import {
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Ray,
} from "@babylonjs/core";

export class Boss {
  constructor(scene, game, spawnPos) {
    this.scene = scene;
    this.game = game;
    this.spawnPos = spawnPos.clone();

    // Stats — much tougher than regular enemies
    this.maxHealth = 200;
    this.health = this.maxHealth;
    this.speed = 3.5;
    this.detectionRange = 18;
    this.attackRange = 3.5;
    this.attackCooldownMax = 2;
    this.attackCooldown = 1;

    // State
    this.state = "patrol";
    this.isDead = false;
    this.isMeleeing = false;
    this.meleeTimer = 0;
    this.meleeDuration = 0.5;
    this.meleeHitThisSwing = false;
    this.meleeHitPlayer = false;
    this.velocity = new Vector3(0, 0, 0);
    this.isGrounded = false;
    this.knockbackVel = new Vector3(0, 0, 0);

    // Patrol
    this.patrolTarget = null;
    this.patrolRadius = 8;
    this.patrolWaitTimer = 0;
    this.walkBob = 0;

    // Enrage
    this.enraged = false;

    // Build model
    this.rootMesh = new TransformNode("boss", scene);
    this.rootMesh.position = spawnPos.clone();
    this._buildModel();
    this._pickPatrolTarget();
  }

  _buildModel() {
    const scale = 1.5; // Boss is 1.5x larger

    // Body — dark samurai armor
    this.body = MeshBuilder.CreateBox(
      "bossBody",
      { width: 1.0 * scale, height: 1.2 * scale, depth: 0.5 * scale },
      this.scene
    );
    this.body.position = new Vector3(0, 1.4, 0);
    const bodyMat = new StandardMaterial("bossBodyMat", this.scene);
    bodyMat.diffuseColor = new Color3(0.15, 0.1, 0.1);
    bodyMat.specularColor = new Color3(0.3, 0.2, 0.2);
    this.body.material = bodyMat;
    this.body.parent = this.rootMesh;

    // Armor shoulder pads
    const shoulderMat = new StandardMaterial("bossShoulderMat", this.scene);
    shoulderMat.diffuseColor = new Color3(0.6, 0.1, 0.05);
    shoulderMat.specularColor = new Color3(0.4, 0.2, 0.1);

    this.leftShoulder = MeshBuilder.CreateBox(
      "bossLShoulder",
      { width: 0.5, height: 0.3, depth: 0.5 },
      this.scene
    );
    this.leftShoulder.position = new Vector3(-0.8, 1.8, 0);
    this.leftShoulder.material = shoulderMat;
    this.leftShoulder.parent = this.rootMesh;

    this.rightShoulder = MeshBuilder.CreateBox(
      "bossRShoulder",
      { width: 0.5, height: 0.3, depth: 0.5 },
      this.scene
    );
    this.rightShoulder.position = new Vector3(0.8, 1.8, 0);
    this.rightShoulder.material = shoulderMat;
    this.rightShoulder.parent = this.rootMesh;

    // Head — samurai helmet
    this.head = MeshBuilder.CreateSphere(
      "bossHead",
      { diameter: 0.55, segments: 10 },
      this.scene
    );
    this.head.position = new Vector3(0, 2.3, 0);
    const headMat = new StandardMaterial("bossHeadMat", this.scene);
    headMat.diffuseColor = new Color3(0.85, 0.7, 0.55);
    this.head.material = headMat;
    this.head.parent = this.rootMesh;

    // Helmet (kabuto)
    this.helmet = MeshBuilder.CreateBox(
      "bossHelmet",
      { width: 0.7, height: 0.35, depth: 0.6 },
      this.scene
    );
    this.helmet.position = new Vector3(0, 2.52, -0.02);
    const helmetMat = new StandardMaterial("bossHelmetMat", this.scene);
    helmetMat.diffuseColor = new Color3(0.5, 0.05, 0.02);
    helmetMat.specularColor = new Color3(0.5, 0.3, 0.2);
    this.helmet.material = helmetMat;
    this.helmet.parent = this.rootMesh;

    // Helmet crest (maedate)
    this.crest = MeshBuilder.CreateBox(
      "bossCrest",
      { width: 0.05, height: 0.5, depth: 0.3 },
      this.scene
    );
    this.crest.position = new Vector3(0, 2.85, 0);
    const crestMat = new StandardMaterial("bossCrestMat", this.scene);
    crestMat.diffuseColor = new Color3(0.8, 0.7, 0.1);
    crestMat.emissiveColor = new Color3(0.2, 0.15, 0);
    this.crest.material = crestMat;
    this.crest.parent = this.rootMesh;

    // Eyes (glowing)
    this.leftEye = MeshBuilder.CreateSphere(
      "bossLEye",
      { diameter: 0.08, segments: 6 },
      this.scene
    );
    this.leftEye.position = new Vector3(-0.12, 2.32, 0.25);
    const eyeMat = new StandardMaterial("bossEyeMat", this.scene);
    eyeMat.diffuseColor = new Color3(1, 0.3, 0);
    eyeMat.emissiveColor = new Color3(1, 0.3, 0);
    this.leftEye.material = eyeMat;
    this.leftEye.parent = this.rootMesh;

    this.rightEye = this.leftEye.clone("bossREye");
    this.rightEye.position = new Vector3(0.12, 2.32, 0.25);
    this.rightEye.parent = this.rootMesh;

    // Arms
    const armMat = new StandardMaterial("bossArmMat", this.scene);
    armMat.diffuseColor = new Color3(0.2, 0.12, 0.1);
    this.leftArm = MeshBuilder.CreateBox(
      "bossLA",
      { width: 0.25, height: 0.9, depth: 0.25 },
      this.scene
    );
    this.leftArm.position = new Vector3(-0.75, 1.1, 0);
    this.leftArm.material = armMat;
    this.leftArm.parent = this.rootMesh;

    this.rightArm = MeshBuilder.CreateBox(
      "bossRA",
      { width: 0.25, height: 0.9, depth: 0.25 },
      this.scene
    );
    this.rightArm.position = new Vector3(0.75, 1.1, 0);
    this.rightArm.material = armMat;
    this.rightArm.parent = this.rootMesh;

    // Katana (in right hand)
    this.katana = MeshBuilder.CreateBox(
      "bossKatana",
      { width: 0.06, height: 0.06, depth: 1.8 },
      this.scene
    );
    this.katana.position = new Vector3(0.75, 1.1, 0.9);
    const katanaMat = new StandardMaterial("bossKatanaMat", this.scene);
    katanaMat.diffuseColor = new Color3(0.8, 0.8, 0.85);
    katanaMat.specularColor = new Color3(1, 1, 1);
    this.katana.material = katanaMat;
    this.katana.parent = this.rootMesh;

    // Katana handle
    this.katanaHandle = MeshBuilder.CreateBox(
      "bossKatanaHandle",
      { width: 0.08, height: 0.08, depth: 0.3 },
      this.scene
    );
    this.katanaHandle.position = new Vector3(0.75, 1.1, -0.05);
    const handleMat = new StandardMaterial("bossHandleMat", this.scene);
    handleMat.diffuseColor = new Color3(0.3, 0.1, 0.05);
    this.katanaHandle.material = handleMat;
    this.katanaHandle.parent = this.rootMesh;

    // Legs — armored
    const legMat = new StandardMaterial("bossLegMat", this.scene);
    legMat.diffuseColor = new Color3(0.12, 0.1, 0.1);
    this.leftLeg = MeshBuilder.CreateBox(
      "bossLL",
      { width: 0.3, height: 0.9, depth: 0.3 },
      this.scene
    );
    this.leftLeg.position = new Vector3(-0.25, 0.45, 0);
    this.leftLeg.material = legMat;
    this.leftLeg.parent = this.rootMesh;

    this.rightLeg = MeshBuilder.CreateBox(
      "bossRL",
      { width: 0.3, height: 0.9, depth: 0.3 },
      this.scene
    );
    this.rightLeg.position = new Vector3(0.25, 0.45, 0);
    this.rightLeg.material = legMat;
    this.rightLeg.parent = this.rootMesh;

    // Waist sash
    this.sash = MeshBuilder.CreateBox(
      "bossSash",
      { width: 1.1, height: 0.15, depth: 0.55 },
      this.scene
    );
    this.sash.position = new Vector3(0, 0.95, 0);
    const sashMat = new StandardMaterial("bossSashMat", this.scene);
    sashMat.diffuseColor = new Color3(0.7, 0.1, 0.05);
    this.sash.material = sashMat;
    this.sash.parent = this.rootMesh;

    this.meshes = [
      this.body,
      this.leftShoulder,
      this.rightShoulder,
      this.head,
      this.helmet,
      this.crest,
      this.leftEye,
      this.rightEye,
      this.leftArm,
      this.rightArm,
      this.katana,
      this.katanaHandle,
      this.leftLeg,
      this.rightLeg,
      this.sash,
    ];
  }

  _pickPatrolTarget() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * this.patrolRadius;
    this.patrolTarget = new Vector3(
      this.spawnPos.x + Math.cos(angle) * dist,
      this.spawnPos.y,
      this.spawnPos.z + Math.sin(angle) * dist
    );
    this.patrolTarget.x = Math.max(-28, Math.min(28, this.patrolTarget.x));
    this.patrolTarget.z = Math.max(-23, Math.min(23, this.patrolTarget.z));
  }

  update(dt, player) {
    if (this.isDead) return;

    this._groundCheck();
    this._applyGravity(dt);

    const playerPos = player.rootMesh.position;
    const distToPlayer = Vector3.Distance(this.rootMesh.position, playerPos);

    // Enrage when below 50% health
    if (this.health < this.maxHealth * 0.5 && !this.enraged) {
      this.enraged = true;
      this.speed *= 1.5;
      this.attackCooldownMax *= 0.6;
      this.game.sound.play("samurai_battle_cry");
    }

    // State transitions
    if (distToPlayer < this.attackRange && this.attackCooldown <= 0) {
      this.state = "attack";
    } else if (distToPlayer < this.detectionRange) {
      this.state = "chase";
    } else {
      this.state = "patrol";
    }

    this.attackCooldown -= dt;

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

    // Melee timer
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
      this.knockbackVel.scaleInPlace(0.92);
    } else {
      this.knockbackVel.set(0, 0, 0);
    }

    this._animate(dt);

    // Bounds
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

    if (!this.patrolTarget) this._pickPatrolTarget();

    const dir = this.patrolTarget.subtract(this.rootMesh.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 1.5) {
      this._pickPatrolTarget();
      this.patrolWaitTimer = 1.5 + Math.random() * 2;
      this.velocity.x = 0;
      this.velocity.z = 0;
    } else {
      dir.normalize();
      this.velocity.x = dir.x * this.speed * 0.4;
      this.velocity.z = dir.z * this.speed * 0.4;
      this._faceDirection(dir);
    }
  }

  _chase(dt, playerPos, dist) {
    const dir = playerPos.subtract(this.rootMesh.position);
    dir.y = 0;
    dir.normalize();

    if (dist > this.attackRange) {
      this.velocity.x = dir.x * this.speed;
      this.velocity.z = dir.z * this.speed;
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    this._faceDirection(dir);
  }

  _attack(dt, playerPos) {
    this.attackCooldown = this.attackCooldownMax;
    this.velocity.x = 0;
    this.velocity.z = 0;

    const dir = playerPos.subtract(this.rootMesh.position);
    dir.y = 0;
    dir.normalize();
    this._faceDirection(dir);

    if (!this.isMeleeing) {
      this.isMeleeing = true;
      this.meleeTimer = this.meleeDuration;
      this.meleeHitPlayer = false;
      this.game.sound.play("samurai_sword_slash");
    }
  }

  _faceDirection(dir) {
    const targetYaw = Math.atan2(dir.x, dir.z);
    let diff = targetYaw - this.rootMesh.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.rootMesh.rotation.y += diff * 0.08;
  }

  _groundCheck() {
    const pos = this.rootMesh.position;
    if (pos.y <= 0.05 && this.velocity.y <= 0) {
      this.isGrounded = true;
      this.velocity.y = 0;
      pos.y = 0;
      return;
    }
    try {
      const origin = pos.clone();
      origin.y += 1.0;
      const ray = new Ray(origin, new Vector3(0, -1, 0), 3.0);
      const hit = this.scene.pickWithRay(ray, (mesh) => {
        return (
          mesh.isPickable &&
          !mesh.name.startsWith("boss") &&
          !mesh.name.startsWith("player") &&
          !mesh.name.startsWith("enemy") &&
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
      Math.abs(this.velocity.x) > 0.2 || Math.abs(this.velocity.z) > 0.2;

    if (isMoving) {
      this.walkBob += dt * 6;
      const swing = Math.sin(this.walkBob) * 0.3;
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing * 0.3;
    } else {
      this.leftLeg.rotation.x *= 0.9;
      this.rightLeg.rotation.x *= 0.9;
      this.leftArm.rotation.x *= 0.9;
    }

    // Melee swing animation (katana slash)
    if (this.isMeleeing) {
      const t = 1 - this.meleeTimer / this.meleeDuration;
      const swingAngle = Math.sin(t * Math.PI) * Math.PI * 0.8;
      this.rightArm.rotation.x = -swingAngle;
      this.katana.rotation.x = -swingAngle * 0.5;
    } else {
      this.rightArm.rotation.x *= 0.9;
      this.katana.rotation.x *= 0.9;
    }

    // Enrage visual effect
    if (this.enraged) {
      const pulse = 0.5 + Math.sin(Date.now() * 0.008) * 0.5;
      this.leftEye.material.emissiveColor = new Color3(pulse, 0, 0);
      this.rightEye.material.emissiveColor = new Color3(pulse, 0, 0);
      // Slight body glow
      this.body.material.emissiveColor = new Color3(
        pulse * 0.15,
        0,
        0
      );
    }

    // Idle sway
    if (!isMoving && !this.isMeleeing) {
      const breathe = Math.sin(Date.now() * 0.002) * 0.02;
      this.body.position.y = 1.4 + breathe;
    }
  }

  takeDamage(amount, hitPos) {
    if (this.isDead) return;
    this.health -= amount;

    // Flash white
    this.meshes.forEach((m) => {
      if (m && m.material && !m.isDisposed()) {
        const orig = m.material.diffuseColor.clone();
        m.material.diffuseColor = new Color3(1, 1, 1);
        setTimeout(() => {
          if (m && m.material && !m.isDisposed()) {
            m.material.diffuseColor = orig;
          }
        }, 100);
      }
    });

    // Damage text
    const color =
      amount >= 100
        ? new Color3(1, 0, 0)
        : amount >= 50
          ? new Color3(1, 0.5, 0)
          : new Color3(1, 1, 0);

    this.game.damageDisplay.show(
      this.rootMesh.position.add(new Vector3(0, 3.2, 0)),
      `${amount}`,
      color
    );

    this.game.sound.play("samurai_battle_cry");

    if (this.health <= 0) {
      this.die();
    }
  }

  applyKnockback(direction, force) {
    this.knockbackVel = direction.scale(force * 0.5); // Boss resists knockback
  }

  die() {
    this.isDead = true;
    this.isMeleeing = false;
    this.game.sound.play("boss_death");
    this.game.sound.play("explosion");

    // Dramatic death
    let fadeTime = 0;
    const fadeInterval = setInterval(() => {
      fadeTime += 0.015;
      if (this.rootMesh && !this.rootMesh.isDisposed()) {
        this.rootMesh.rotation.x += 0.03;
        this.rootMesh.position.y -= 0.02;
        this.meshes.forEach((m) => {
          if (m && !m.isDisposed()) {
            m.visibility = Math.max(0, 1 - fadeTime);
          }
        });
        if (fadeTime >= 1.2) {
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
