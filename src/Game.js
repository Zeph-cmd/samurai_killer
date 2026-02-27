import {
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  ShadowGenerator,
  FreeCamera,
  MeshBuilder,
  StandardMaterial,
} from "@babylonjs/core";
import { InputManager } from "./InputManager.js";
import { LevelBuilder } from "./LevelBuilder.js";
import { Player } from "./Player.js";
import { Enemy } from "./Enemy.js";
import { Boss } from "./Boss.js";
import { BulletManager } from "./Bullet.js";
import { Pickup } from "./Pickup.js";
import { HUD } from "./HUD.js";
import { SoundManager } from "./SoundManager.js";
import { DamageDisplay } from "./DamageDisplay.js";

export const GameState = {
  LOADING: "loading",
  TITLE: "title",
  MODE_SELECT: "mode_select",
  PLAYING: "playing",
  PAUSED: "paused",
  GAME_OVER: "game_over",
  VICTORY: "victory",
};

export const GameMode = {
  MISSION: "mission",
  SURVIVAL: "survival",
  TIME_ATTACK: "time_attack",
};

export class Game {
  constructor(engine, scene, canvas) {
    this.engine = engine;
    this.scene = scene;
    this.canvas = canvas;
    this.state = GameState.LOADING;
    this.gameMode = GameMode.MISSION;

    this.player = null;
    this.enemies = [];
    this.boss = null;
    this.pickups = [];
    this.levelBuilder = null;
    this.bulletManager = null;
    this.damageDisplay = null;
    this.hud = null;
    this.input = null;
    this.sound = null;
    this.shadowGenerator = null;

    // Camera
    this.camera = null;
    this.cameraYaw = 0;
    this.cameraPitch = 0.35;
    this.cameraDistance = 14;
    this.cameraSmoothness = 0.08;
    this.cameraFirstFrame = true;

    // Survival mode
    this.survivalWave = 0;
    this.survivalKills = 0;
    this.survivalSpawnTimer = 0;
    this.survivalNextEnemyId = 100;

    // Time Attack mode
    this.timeAttackTimer = 0;
    this.timeAttackLimit = 120; // 2 minutes
    this.timeAttackKills = 0;
  }

  async init() {
    this.scene.clearColor = new Color4(0.45, 0.65, 0.95, 1.0);
    this.scene.ambientColor = new Color3(0.4, 0.4, 0.4);
    this.scene.collisionsEnabled = false;

    this.scene.fogMode = 2;
    this.scene.fogDensity = 0.006;
    this.scene.fogColor = new Color3(0.55, 0.65, 0.55);

    this._setupCamera();
    this._setupLighting();

    this.input = new InputManager(this.canvas, this);
    this.sound = new SoundManager(this.scene);
    this.bulletManager = new BulletManager(this.scene);
    this.damageDisplay = new DamageDisplay(this.scene);
    this.hud = new HUD(this);

    this.hud.showLoadingScreen();
    await this.sound.loadAll();

    this.state = GameState.TITLE;
    this.hud.hideLoadingScreen();
    this.hud.showTitleScreen();
  }

  _setupCamera() {
    this.camera = new FreeCamera("camera", new Vector3(2, 8, -10), this.scene);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 300;
    this.camera.fov = 0.9;
    this.camera.inputs.clear();
  }

  _setupLighting() {
    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.7;
    hemiLight.groundColor = new Color3(0.3, 0.35, 0.3);
    hemiLight.diffuse = new Color3(1, 1, 0.9);

    const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, 1).normalize(), this.scene);
    dirLight.position = new Vector3(20, 40, -20);
    dirLight.intensity = 0.8;
    dirLight.diffuse = new Color3(1, 0.95, 0.8);

    this.shadowGenerator = new ShadowGenerator(1024, dirLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 8;
    this.shadowGenerator.darkness = 0.4;
  }

  // ---- Called from title screen ----
  goToModeSelect() {
    this.hud.hideTitleScreen();
    this.state = GameState.MODE_SELECT;
    this.hud.showModeSelectScreen();
  }

  // ---- Called from mode select ----
  selectMode(mode) {
    this.gameMode = mode;
    this.hud.hideModeSelectScreen();
    this.startGame();
  }

  startGame() {
    this.cameraFirstFrame = true;
    try {
      if (this.gameMode === GameMode.SURVIVAL) {
        this._buildSurvivalLevel();
      } else if (this.gameMode === GameMode.TIME_ATTACK) {
        this._buildTimeAttackLevel();
      } else {
        this._buildMissionLevel();
      }
    } catch (e) {
      console.error("[BUILD LEVEL ERROR]", e);
    }
    this.state = GameState.PLAYING;
    this.input.requestPointerLock();
    this.sound.playMusic("battle_theme");
    this.hud.showGameHUD();
  }

  // ==================== MISSION MODE ====================
  _buildMissionLevel() {
    this._clearLevel();
    this.levelBuilder = new LevelBuilder(this.scene, this.shadowGenerator);
    this.levelBuilder.build();

    this.player = new Player(this.scene, this, new Vector3(2, 0.5, 2));
    this._addMeshesAsShadowCasters(this.player.meshes);

    const enemyPositions = [
      new Vector3(15, 0.5, 8),
      new Vector3(22, 0.5, -5),
      new Vector3(-10, 0.5, 12),
      new Vector3(10, 0.5, -12),
    ];
    this.enemies = enemyPositions.map((pos, i) => {
      const enemy = new Enemy(this.scene, this, pos, i);
      this._addMeshesAsShadowCasters(enemy.meshes);
      return enemy;
    });

    this.boss = new Boss(this.scene, this, new Vector3(20, 0.5, 18));
    this._addMeshesAsShadowCasters(this.boss.meshes);

    const pickupPositions = [
      new Vector3(8, 0.5, 6),
      new Vector3(-5, 0.5, -5),
      new Vector3(18, 0.5, -10),
    ];
    this.pickups = pickupPositions.map((pos) => new Pickup(this.scene, this, pos));
  }

  // ==================== SURVIVAL MODE ====================
  _buildSurvivalLevel() {
    this._clearLevel();
    this.survivalWave = 0;
    this.survivalKills = 0;
    this.survivalSpawnTimer = 0;
    this.survivalNextEnemyId = 100;

    this.levelBuilder = new LevelBuilder(this.scene, this.shadowGenerator);
    this.levelBuilder.build();

    this.player = new Player(this.scene, this, new Vector3(0, 0.5, 0));
    this._addMeshesAsShadowCasters(this.player.meshes);
    this.boss = null;

    this.pickups = [new Pickup(this.scene, this, new Vector3(5, 0.5, 5))];

    this._spawnSurvivalWave();
  }

  _spawnSurvivalWave() {
    this.survivalWave++;
    const count = Math.min(3 + this.survivalWave, 10);
    const spawnPoints = [
      new Vector3(25, 0.5, 20), new Vector3(-20, 0.5, 15),
      new Vector3(20, 0.5, -15), new Vector3(-15, 0.5, -18),
      new Vector3(25, 0.5, 0), new Vector3(-25, 0.5, 0),
      new Vector3(0, 0.5, 20), new Vector3(0, 0.5, -20),
      new Vector3(18, 0.5, 18), new Vector3(-18, 0.5, -12),
    ];
    for (let i = 0; i < count; i++) {
      const pos = spawnPoints[i % spawnPoints.length].clone();
      // Randomize a bit
      pos.x += (Math.random() - 0.5) * 4;
      pos.z += (Math.random() - 0.5) * 4;
      const id = this.survivalNextEnemyId++;
      const enemy = new Enemy(this.scene, this, pos, id);
      // Make enemies tougher each wave
      enemy.maxHealth = 60 + this.survivalWave * 10;
      enemy.health = enemy.maxHealth;
      enemy.speed = Math.min(4 + this.survivalWave * 0.3, 8);
      this._addMeshesAsShadowCasters(enemy.meshes);
      this.enemies.push(enemy);
    }

    // Spawn boss every 3 waves
    if (this.survivalWave % 3 === 0 && !this.boss) {
      const bossPos = new Vector3(
        (Math.random() - 0.5) * 40,
        0.5,
        (Math.random() - 0.5) * 30
      );
      bossPos.x = Math.max(-25, Math.min(25, bossPos.x));
      bossPos.z = Math.max(-20, Math.min(20, bossPos.z));
      this.boss = new Boss(this.scene, this, bossPos);
      this.boss.maxHealth = 200 + this.survivalWave * 30;
      this.boss.health = this.boss.maxHealth;
      this._addMeshesAsShadowCasters(this.boss.meshes);
    }

    // Spawn a medkit every wave
    const medPos = new Vector3(
      (Math.random() - 0.5) * 30,
      0.5,
      (Math.random() - 0.5) * 25
    );
    this.pickups.push(new Pickup(this.scene, this, medPos));
  }

  // ==================== TIME ATTACK MODE ====================
  _buildTimeAttackLevel() {
    this._clearLevel();
    this.timeAttackTimer = this.timeAttackLimit;
    this.timeAttackKills = 0;

    this.levelBuilder = new LevelBuilder(this.scene, this.shadowGenerator);
    this.levelBuilder.build();

    this.player = new Player(this.scene, this, new Vector3(0, 0.5, 0));
    this._addMeshesAsShadowCasters(this.player.meshes);

    // Spawn 8 enemies spread around
    const positions = [
      new Vector3(15, 0.5, 8), new Vector3(-15, 0.5, 8),
      new Vector3(20, 0.5, -10), new Vector3(-20, 0.5, -10),
      new Vector3(10, 0.5, 18), new Vector3(-10, 0.5, 18),
      new Vector3(25, 0.5, 0), new Vector3(-25, 0.5, 0),
    ];
    this.enemies = positions.map((pos, i) => {
      const enemy = new Enemy(this.scene, this, pos, i);
      this._addMeshesAsShadowCasters(enemy.meshes);
      return enemy;
    });

    this.boss = new Boss(this.scene, this, new Vector3(0, 0.5, 20));
    this._addMeshesAsShadowCasters(this.boss.meshes);

    const pickupPositions = [
      new Vector3(10, 0.5, 0), new Vector3(-10, 0.5, 0),
      new Vector3(0, 0.5, 10), new Vector3(0, 0.5, -10),
    ];
    this.pickups = pickupPositions.map((pos) => new Pickup(this.scene, this, pos));
  }

  // ==================== SHARED ====================
  _addMeshesAsShadowCasters(meshes) {
    if (!meshes || !this.shadowGenerator) return;
    meshes.forEach((m) => {
      try {
        if (m && !m.isDisposed()) {
          this.shadowGenerator.addShadowCaster(m);
        }
      } catch (e) { /* skip */ }
    });
  }

  _clearLevel() {
    if (this.player) { this.player.dispose(); this.player = null; }
    this.enemies.forEach((e) => e.dispose());
    this.enemies = [];
    if (this.boss) { this.boss.dispose(); this.boss = null; }
    this.pickups.forEach((p) => p.dispose());
    this.pickups = [];
    this.bulletManager.clearAll();
    if (this.levelBuilder) { this.levelBuilder.dispose(); this.levelBuilder = null; }
  }

  get isPaused() {
    return this.state === GameState.PAUSED;
  }

  togglePause() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
      this.input.releasePointerLock();
      this.hud.showPauseScreen();
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.hud.hidePauseScreen();
      this.input.requestPointerLock();
    }
  }

  update(dt) {
    dt = Math.min(dt, 0.05);
    if (this.state === GameState.PLAYING) {
      this._updatePlaying(dt);
    }
    // When paused, nothing updates — scene still renders (frozen frame)
  }

  _updatePlaying(dt) {
    if (!this.player || this.player.isDead) return;

    this.player.update(dt, this.input);
    this._updateCamera(dt);

    this.enemies.forEach((enemy) => {
      if (!enemy.isDead) {
        try { enemy.update(dt, this.player); } catch(e) {}
      }
    });

    if (this.boss && !this.boss.isDead) {
      try { this.boss.update(dt, this.player); } catch(e) {}
    }

    this.bulletManager.update(dt, this);
    this.pickups.forEach((p) => p.update(dt));
    this.damageDisplay.update(dt);

    this._checkCollisions();

    // Mode-specific updates
    if (this.gameMode === GameMode.SURVIVAL) {
      this._updateSurvival(dt);
    } else if (this.gameMode === GameMode.TIME_ATTACK) {
      this._updateTimeAttack(dt);
    } else {
      this._checkMissionWinLose();
    }

    this.hud.updateHealthBar(this.player.health, this.player.maxHealth);
    this.hud.updateModeInfo(this);
  }

  // ---- Survival update ----
  _updateSurvival(dt) {
    if (this.player.health <= 0 || this.player.rootMesh.position.y < -10) {
      this.playerDied();
      return;
    }

    // Check if all enemies AND boss are dead -> next wave
    const allDead = this.enemies.every((e) => e.isDead);
    const bossDead = !this.boss || this.boss.isDead;
    if (allDead && bossDead) {
      // Small delay before next wave
      this.survivalSpawnTimer += dt;
      if (this.survivalSpawnTimer > 2.0) {
        this.survivalSpawnTimer = 0;
        // Clean up dead enemies
        this.enemies.forEach((e) => e.dispose());
        this.enemies = [];
        if (this.boss) { this.boss.dispose(); this.boss = null; }
        this._spawnSurvivalWave();
        this.sound.play("medical_pickup"); // wave start sound
      }
    }
  }

  // ---- Time Attack update ----
  _updateTimeAttack(dt) {
    this.timeAttackTimer -= dt;

    if (this.player.health <= 0 || this.player.rootMesh.position.y < -10) {
      this.playerDied();
      return;
    }

    // Count kills
    let kills = 0;
    this.enemies.forEach((e) => { if (e.isDead) kills++; });
    if (this.boss && this.boss.isDead) kills++;
    this.timeAttackKills = kills;

    // Win: all enemies + boss dead before time runs out
    const total = this.enemies.length + (this.boss ? 1 : 0);
    if (kills >= total) {
      this.victory();
      return;
    }

    // Lose: time expired
    if (this.timeAttackTimer <= 0) {
      this.timeAttackTimer = 0;
      this.playerDied();
    }
  }

  // ---- Mission win/lose ----
  _checkMissionWinLose() {
    if (this.player.health <= 0 || this.player.rootMesh.position.y < -10) {
      this.playerDied();
      return;
    }
    const allEnemiesDead = this.enemies.every((e) => e.isDead);
    const bossDead = this.boss ? this.boss.isDead : true;
    if (allEnemiesDead && bossDead) {
      this.victory();
    }
  }

  _updateCamera(dt) {
    if (!this.player) return;
    const playerPos = this.player.rootMesh.position;

    this.cameraPitch = Math.max(-0.3, Math.min(1.2, this.cameraPitch));
    const horizontalDist = this.cameraDistance * Math.cos(this.cameraPitch);
    const verticalDist = this.cameraDistance * Math.sin(this.cameraPitch);

    const targetX = playerPos.x - horizontalDist * Math.sin(this.cameraYaw);
    const targetY = playerPos.y + verticalDist + 3;
    const targetZ = playerPos.z - horizontalDist * Math.cos(this.cameraYaw);

    if (this.cameraFirstFrame) {
      this.camera.position.set(targetX, targetY, targetZ);
      this.cameraFirstFrame = false;
    } else {
      const s = this.cameraSmoothness * 3;
      this.camera.position.x += (targetX - this.camera.position.x) * s;
      this.camera.position.y += (targetY - this.camera.position.y) * s;
      this.camera.position.z += (targetZ - this.camera.position.z) * s;
    }

    this.camera.setTarget(new Vector3(playerPos.x, playerPos.y + 1.5, playerPos.z));
  }

  _checkCollisions() {
    if (!this.player || this.player.isDead) return;
    const playerPos = this.player.rootMesh.position;

    // Player bullets vs enemies and boss
    this.bulletManager.playerBullets.forEach((bullet) => {
      if (!bullet.active) return;

      this.enemies.forEach((enemy) => {
        if (!bullet.active || enemy.isDead) return;
        const dist = Vector3.Distance(bullet.mesh.position, enemy.rootMesh.position);
        if (dist < 1.5) {
          enemy.takeDamage(40, bullet.mesh.position);
          bullet.active = false;
          this.sound.play("enemy_rifle_shot");
          if (this.gameMode === GameMode.SURVIVAL && enemy.health <= 0) {
            this.survivalKills++;
          }
        }
      });

      if (!bullet.active) return;
      if (this.boss && !this.boss.isDead) {
        const dist = Vector3.Distance(bullet.mesh.position, this.boss.rootMesh.position);
        if (dist < 2.0) {
          this.boss.takeDamage(40, bullet.mesh.position);
          bullet.active = false;
          if (this.gameMode === GameMode.SURVIVAL && this.boss.health <= 0) {
            this.survivalKills++;
          }
        }
      }
    });

    // Enemy bullets vs player
    this.bulletManager.enemyBullets.forEach((bullet) => {
      if (!bullet.active) return;
      const dist = Vector3.Distance(bullet.mesh.position, playerPos);
      if (dist < 1.0) {
        this.player.takeDamage(15);
        bullet.active = false;
      }
    });

    // Player melee vs enemies
    if (this.player.isMeleeing) {
      const meleePos = this.player.getMeleePosition();
      const meleeRange = 2.5;

      this.enemies.forEach((enemy) => {
        if (enemy.isDead || enemy.meleeHitThisSwing) return;
        const dist = Vector3.Distance(meleePos, enemy.rootMesh.position);
        if (dist < meleeRange) {
          enemy.takeDamage(40, meleePos);
          enemy.meleeHitThisSwing = true;
          this.sound.play("samurai_sword_slash");
          const dir = enemy.rootMesh.position.subtract(playerPos).normalize();
          enemy.applyKnockback(dir, 5);
          if (this.gameMode === GameMode.SURVIVAL && enemy.health <= 0) {
            this.survivalKills++;
          }
        }
      });

      if (this.boss && !this.boss.isDead && !this.boss.meleeHitThisSwing) {
        const dist = Vector3.Distance(meleePos, this.boss.rootMesh.position);
        if (dist < meleeRange + 0.5) {
          this.boss.takeDamage(40, meleePos);
          this.boss.meleeHitThisSwing = true;
          this.sound.play("samurai_sword_slash");
          if (this.gameMode === GameMode.SURVIVAL && this.boss.health <= 0) {
            this.survivalKills++;
          }
        }
      }
    } else {
      this.enemies.forEach((e) => (e.meleeHitThisSwing = false));
      if (this.boss) this.boss.meleeHitThisSwing = false;
    }

    // Enemy melee vs player
    this.enemies.forEach((enemy) => {
      if (enemy.isDead || !enemy.isMeleeing) return;
      const dist = Vector3.Distance(enemy.rootMesh.position, playerPos);
      if (dist < 2.0 && !enemy.meleeHitPlayer) {
        this.player.takeDamage(20);
        enemy.meleeHitPlayer = true;
        const dir = playerPos.subtract(enemy.rootMesh.position).normalize();
        this.player.applyKnockback(dir, 5);
      }
    });

    // Boss melee vs player
    if (this.boss && !this.boss.isDead && this.boss.isMeleeing) {
      const dist = Vector3.Distance(this.boss.rootMesh.position, playerPos);
      if (dist < 3.0 && !this.boss.meleeHitPlayer) {
        this.player.takeDamage(40);
        this.boss.meleeHitPlayer = true;
        const dir = playerPos.subtract(this.boss.rootMesh.position).normalize();
        this.player.applyKnockback(dir, 8);
        this.sound.play("samurai_battle_cry");
      }
    }

    // Player vs pickups
    this.pickups.forEach((pickup) => {
      if (pickup.collected) return;
      const dist = Vector3.Distance(playerPos, pickup.mesh.position);
      if (dist < 1.5) {
        const healed = this.player.heal(50);
        if (healed) {
          pickup.collect();
          this.sound.play("medical_pickup");
          this.damageDisplay.show(pickup.mesh.position.clone(), "+50", new Color3(0, 1, 0));
        }
      }
    });

    // Contact damage
    this.enemies.forEach((enemy) => {
      if (enemy.isDead) return;
      const dist = Vector3.Distance(playerPos, enemy.rootMesh.position);
      if (dist < 1.2 && this.player.canTakeContactDamage()) {
        this.player.takeDamage(10);
        const dir = playerPos.subtract(enemy.rootMesh.position).normalize();
        this.player.applyKnockback(dir, 4);
      }
    });
  }

  playerDied() {
    if (this.state !== GameState.PLAYING) return;
    this.state = GameState.GAME_OVER;
    this.sound.stopMusic();
    this.sound.play("game_over");
    this.input.releasePointerLock();
    this.hud.hideGameHUD();
    this.hud.showGameOverScreen();
  }

  victory() {
    if (this.state !== GameState.PLAYING) return;
    this.state = GameState.VICTORY;
    this.sound.stopMusic();
    this.sound.play("explosion");
    this.input.releasePointerLock();
    this.hud.hideGameHUD();
    this.hud.showVictoryScreen();
  }

  restartGame() {
    this.hud.hidePauseScreen();
    this.hud.hideGameOverScreen();
    this.hud.hideVictoryScreen();
    this.hud.hideGameHUD();
    this.startGame();
  }

  returnToTitle() {
    this.hud.hidePauseScreen();
    this.hud.hideGameOverScreen();
    this.hud.hideVictoryScreen();
    this.hud.hideGameHUD();
    this._clearLevel();
    this.state = GameState.TITLE;
    this.hud.showTitleScreen();
  }

  getForwardDirection() {
    return new Vector3(Math.sin(this.cameraYaw), 0, Math.cos(this.cameraYaw)).normalize();
  }

  getRightDirection() {
    return new Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw)).normalize();
  }

  getAimDirection() {
    return new Vector3(Math.sin(this.cameraYaw), -Math.sin(this.cameraPitch) * 0.3, Math.cos(this.cameraYaw)).normalize();
  }
}
