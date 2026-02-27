import {
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Ray,
} from "@babylonjs/core";

export class Enemy {
  constructor(scene, game, spawnPos, id) {
    this.scene = scene;
    this.game = game;
    this.id = id;
    this.spawnPos = spawnPos.clone();

    // Stats
    this.maxHealth = 60;
    this.health = this.maxHealth;
    this.speed = 4;
    this.detectionRange = 15;
    this.shootRange = 12;
    this.meleeRange = 2.5;
    this.attackCooldownMax = 3;
    this.attackCooldown = Math.random() * 2;
    this.shootCooldownMax = 2.5;
    this.shootCooldown = Math.random() * 1.5;

    // State
    this.state = "patrol"; // patrol, chase, attack
    this.isDead = false;
    this.isMeleeing = false;
    this.meleeTimer = 0;
    this.meleeDuration = 0.4;
    this.meleeHitThisSwing = false;
    this.meleeHitPlayer = false;
    this.velocity = new Vector3(0, 0, 0);
    this.isGrounded = false;
    this.knockbackVel = new Vector3(0, 0, 0);

    // Patrol
    this.patrolTarget = null;
    this.patrolRadius = 5;
    this.patrolWaitTimer = 0;
    this.walkBob = 0;

    // Build model
    this.rootMesh = new TransformNode(`enemy_${id}`, scene);
    this.rootMesh.position = spawnPos.clone();
    this._buildModel();
    this._pickPatrolTarget();
  }

  _buildModel() {
    // Body — dark red/maroon
    this.body = MeshBuilder.CreateBox(
      `enemyBody_${this.id}`,
      { width: 0.6, height: 0.8, depth: 0.35 },
      this.scene
    );
    this.body.position = new Vector3(0, 1.0, 0);
    const bodyMat = new StandardMaterial(`enemyBodyMat_${this.id}`, this.scene);
    bodyMat.diffuseColor = new Color3(0.5, 0.15, 0.1);
    bodyMat.specularColor = new Color3(0.1, 0.1, 0.1);
    this.body.material = bodyMat;
    this.body.parent = this.rootMesh;

    // Head — with mask (dark sphere)
    this.head = MeshBuilder.CreateSphere(
      `enemyHead_${this.id}`,
      { diameter: 0.4, segments: 10 },
      this.scene
    );
    this.head.position = new Vector3(0, 1.65, 0);
    const headMat = new StandardMaterial(`enemyHeadMat_${this.id}`, this.scene);
    headMat.diffuseColor = new Color3(0.15, 0.15, 0.15);
    headMat.specularColor = new Color3(0.1, 0.1, 0.1);
    this.head.material = headMat;
    this.head.parent = this.rootMesh;

    // Eyes (red visor)
    this.visor = MeshBuilder.CreateBox(
      `enemyVisor_${this.id}`,
      { width: 0.3, height: 0.06, depth: 0.1 },
      this.scene
    );
    this.visor.position = new Vector3(0, 1.68, 0.18);
    const visorMat = new StandardMaterial(`enemyVisorMat_${this.id}`, this.scene);
    visorMat.diffuseColor = new Color3(1, 0.2, 0.1);
    visorMat.emissiveColor = new Color3(0.5, 0.1, 0.05);
    this.visor.material = visorMat;
    this.visor.parent = this.rootMesh;

    // Arms
    const armMat = new StandardMaterial(`enemyArmMat_${this.id}`, this.scene);
    armMat.diffuseColor = new Color3(0.4, 0.12, 0.08);
    this.leftArm = MeshBuilder.CreateBox(
      `enemyLA_${this.id}`,
      { width: 0.18, height: 0.6, depth: 0.18 },
      this.scene
    );
    this.leftArm.position = new Vector3(-0.42, 0.9, 0);
    this.leftArm.material = armMat;
    this.leftArm.parent = this.rootMesh;

    this.rightArm = MeshBuilder.CreateBox(
      `enemyRA_${this.id}`,
      { width: 0.18, height: 0.6, depth: 0.18 },
      this.scene
    );
    this.rightArm.position = new Vector3(0.42, 0.9, 0);
    this.rightArm.material = armMat;
    this.rightArm.parent = this.rootMesh;

    // Gun
    this.gun = MeshBuilder.CreateBox(
      `enemyGun_${this.id}`,
      { width: 0.08, height: 0.08, depth: 0.5 },
      this.scene
    );
    this.gun.position = new Vector3(0.42, 0.9, 0.3);
    const gunMat = new StandardMaterial(`enemyGunMat_${this.id}`, this.scene);
    gunMat.diffuseColor = new Color3(0.15, 0.15, 0.15);
    this.gun.material = gunMat;
    this.gun.parent = this.rootMesh;

    // Legs
    const legMat = new StandardMaterial(`enemyLegMat_${this.id}`, this.scene);
    legMat.diffuseColor = new Color3(0.2, 0.2, 0.18);
    this.leftLeg = MeshBuilder.CreateBox(
      `enemyLL_${this.id}`,
      { width: 0.2, height: 0.6, depth: 0.2 },
      this.scene
    );
    this.leftLeg.position = new Vector3(-0.15, 0.3, 0);
    this.leftLeg.material = legMat;
    this.leftLeg.parent = this.rootMesh;

    this.rightLeg = MeshBuilder.CreateBox(
      `enemyRL_${this.id}`,
      { width: 0.2, height: 0.6, depth: 0.2 },
      this.scene
    );
    this.rightLeg.position = new Vector3(0.15, 0.3, 0);
    this.rightLeg.material = legMat;
    this.rightLeg.parent = this.rootMesh;

    this.meshes = [
      this.body,
      this.head,
      this.visor,
      this.leftArm,
      this.rightArm,
      this.gun,
      this.leftLeg,
      this.rightLeg,
    ];
  }

  _pickPatrolTarget() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 2 + Math.random() * this.patrolRadius;
    this.patrolTarget = new Vector3(
      this.spawnPos.x + Math.cos(angle) * dist,
      this.spawnPos.y,
      this.spawnPos.z + Math.sin(angle) * dist
    );
    // Clamp within level bounds
    this.patrolTarget.x = Math.max(-28, Math.min(28, this.patrolTarget.x));
    this.patrolTarget.z = Math.max(-23, Math.min(23, this.patrolTarget.z));
  }

  update(dt, player) {
    if (this.isDead) return;

    this._groundCheck();
    this._applyGravity(dt);

    const playerPos = player.rootMesh.position;
    const distToPlayer = Vector3.Distance(this.rootMesh.position, playerPos);

    // State transitions
    if (distToPlayer < this.meleeRange && this.attackCooldown <= 0) {
      this.state = "attack";
    } else if (distToPlayer < this.detectionRange) {
      this.state = "chase";
    } else {
      this.state = "patrol";
    }

    // Cooldowns
    this.attackCooldown -= dt;
    this.shootCooldown -= dt;

    switch (this.state) {
      case "patrol":
        this._patrol(dt);
        break;
      case "chase":
        this._chase(dt, playerPos, distToPlayer);
        break;
      case "attack":
        this._attack(dt, playerPos);
        break;
    }

    // Handle melee timer
    if (this.meleeTimer > 0) {
      this.meleeTimer -= dt;
      if (this.meleeTimer <= 0) {
        this.isMeleeing = false;
        this.meleeHitPlayer = false;
      }
    }

    // Apply velocity
    this.rootMesh.position.addInPlace(this.velocity.scale(dt));

    // Knockback
    if (this.knockbackVel.length() > 0.1) {
      this.rootMesh.position.addInPlace(this.knockbackVel.scale(dt));
      this.knockbackVel.scaleInPlace(0.88);
    } else {
      this.knockbackVel.set(0, 0, 0);
    }

    // Animation
    this._animate(dt);

    // Keep in bounds
    this.rootMesh.position.x = Math.max(
      -28,
      Math.min(28, this.rootMesh.position.x)
    );
    this.rootMesh.position.z = Math.max(
      -23,
      Math.min(23, this.rootMesh.position.z)
    );
  }

  _patrol(dt) {
    if (this.patrolWaitTimer > 0) {
      this.patrolWaitTimer -= dt;
      this.velocity.x = 0;
      this.velocity.z = 0;
      return;
    }

    if (!this.patrolTarget) {
      this._pickPatrolTarget();
    }

    const dir = this.patrolTarget.subtract(this.rootMesh.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 1) {
      this._pickPatrolTarget();
      this.patrolWaitTimer = 1 + Math.random() * 2;
      this.velocity.x = 0;
      this.velocity.z = 0;
    } else {
      dir.normalize();
      this.velocity.x = dir.x * this.speed * 0.5;
      this.velocity.z = dir.z * this.speed * 0.5;
      this._faceDirection(dir);
    }
  }

  _chase(dt, playerPos, dist) {
    const dir = playerPos.subtract(this.rootMesh.position);
    dir.y = 0;
    dir.normalize();

    // Move toward player
    if (dist > this.meleeRange) {
      this.velocity.x = dir.x * this.speed;
      this.velocity.z = dir.z * this.speed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    this._faceDirection(dir);

    // Ranged attack
    if (
      dist < this.shootRange &&
      dist > this.meleeRange + 1 &&
      this.shootCooldown <= 0
    ) {
      this._shoot(dir);
      this.shootCooldown = this.shootCooldownMax;
    }
  }

  _attack(dt, playerPos) {
    this.attackCooldown = this.attackCooldownMax;
    this.velocity.x = 0;
    this.velocity.z = 0;

    const dir = playerPos.subtract(this.rootMesh.position);
    dir.y = 0;
    dir.normalize();
    this._faceDirection(dir);

    // Start melee
    if (!this.isMeleeing) {
      this.isMeleeing = true;
      this.meleeTimer = this.meleeDuration;
      this.meleeHitPlayer = false;
      this.game.sound.play("ak47_shot");
    }
  }

  _shoot(dir) {
    const spawnPos = this.rootMesh.position.clone();
    spawnPos.y += 0.9;
    spawnPos.addInPlace(dir.scale(0.8));
    this.game.bulletManager.spawnEnemyBullet(spawnPos, dir);
    this.game.sound.play("enemy_rifle_shot");
  }

  _faceDirection(dir) {
    const targetYaw = Math.atan2(dir.x, dir.z);
    let diff = targetYaw - this.rootMesh.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.rootMesh.rotation.y += diff * 0.1;
  }

  _groundCheck() {
    const pos = this.rootMesh.position;
    // Simple ground plane check at y=0
    if (pos.y <= 0.05 && this.velocity.y <= 0) {
      this.isGrounded = true;
      this.velocity.y = 0;
      pos.y = 0;
      return;
    }
    // Ray-based for platforms
    try {
      const origin = pos.clone();
      origin.y += 1.0;
      const ray = new Ray(origin, new Vector3(0, -1, 0), 3.0);
      const hit = this.scene.pickWithRay(ray, (mesh) => {
        return (
          mesh.isPickable &&
          !mesh.name.startsWith("enemy") &&
          !mesh.name.startsWith("player") &&
          !mesh.name.startsWith("boss") &&
          !mesh.name.startsWith("bullet") &&
          !mesh.name.startsWith("pickup") &&
          !mesh.name.startsWith("dmg") &&
          !mesh.name.startsWith("foliage") &&
          !mesh.name.startsWith("trunk")
        );
      });
      if (hit && hit.hit && hit.distance < 1.2) {
        this.isGrounded = true;
        if (this.velocity.y <= 0) {
          this.velocity.y = 0;
          pos.y = hit.pickedPoint.y;
        }
      } else if (pos.y > 0.1) {
        this.isGrounded = false;
      }
    } catch (e) {
      if (pos.y <= 0.05) { this.isGrounded = true; this.velocity.y = 0; pos.y = 0; }
      else { this.isGrounded = false; }
    }
  }

  _applyGravity(dt) {
    if (!this.isGrounded) {
      this.velocity.y -= 28 * dt;
      this.rootMesh.position.y += this.velocity.y * dt;
    }
  }

  _animate(dt) {
    const isMoving =
      Math.abs(this.velocity.x) > 0.3 || Math.abs(this.velocity.z) > 0.3;

    if (isMoving) {
      this.walkBob += dt * 8;
      const swing = Math.sin(this.walkBob) * 0.35;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing * 0.4;
      this.rightArm.rotation.x = swing * 0.3;
    } else {
      this.leftLeg.rotation.x *= 0.9;
      this.rightLeg.rotation.x *= 0.9;
      this.leftArm.rotation.x *= 0.9;
      this.rightArm.rotation.x *= 0.9;
    }

    // Melee animation
    if (this.isMeleeing) {
      const t = 1 - this.meleeTimer / this.meleeDuration;
      this.rightArm.rotation.x = -Math.PI * 0.6 * Math.sin(t * Math.PI);
    }

    // Visor pulse
    if (this.state === "chase" || this.state === "attack") {
      const pulse = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
      this.visor.material.emissiveColor = new Color3(pulse, pulse * 0.15, 0);
    }
  }

  takeDamage(amount, hitPos) {
    if (this.isDead) return;
    this.health -= amount;

    // Red flash
    this.meshes.forEach((m) => {
      if (m && m.material && !m.isDisposed()) {
        const orig = m.material.diffuseColor.clone();
        m.material.diffuseColor = new Color3(1, 0, 0);
        setTimeout(() => {
          if (m && m.material && !m.isDisposed()) {
            m.material.diffuseColor = orig;
          }
        }, 150);
      }
    });

    // Damage text
    this.game.damageDisplay.show(
      this.rootMesh.position.add(new Vector3(0, 2.2, 0)),
      `${amount}`,
      new Color3(1, 1, 0)
    );

    if (this.health <= 0) {
      this.die();
    }
  }

  applyKnockback(direction, force) {
    this.knockbackVel = direction.scale(force);
    this.knockbackVel.y = force * 0.2;
  }

  die() {
    this.isDead = true;
    this.isMeleeing = false;
    this.game.sound.play("enemy_death");

    // Fall & fade
    let fadeTime = 0;
    const fadeInterval = setInterval(() => {
      fadeTime += 0.02;
      if (this.rootMesh && !this.rootMesh.isDisposed()) {
        this.rootMesh.rotation.x += 0.04;
        this.meshes.forEach((m) => {
          if (m && !m.isDisposed()) {
            m.visibility = Math.max(0, 1 - fadeTime);
          }
        });
        if (fadeTime >= 1) {
          clearInterval(fadeInterval);
          this.meshes.forEach((m) => {
            if (m && !m.isDisposed()) m.setEnabled(false);
          });
        }
      } else {
        clearInterval(fadeInterval);
      }
    }, 16);
  }

  dispose() {
    this.meshes.forEach((m) => {
      if (m && !m.isDisposed()) m.dispose();
    });
    if (this.rootMesh && !this.rootMesh.isDisposed()) {
      this.rootMesh.dispose();
    }
  }
}
