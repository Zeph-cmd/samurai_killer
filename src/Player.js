import {
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Ray,
} from "@babylonjs/core";

export class Player {
  constructor(scene, game, spawnPos) {
    this.scene = scene;
    this.game = game;

    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.speed = 8;
    this.sprintSpeed = 13;
    this.jumpForce = 12;
    this.gravity = 28;

    this.velocity = new Vector3(0, 0, 0);
    this.isGrounded = false;
    this.isDead = false;
    this.isMeleeing = false;
    this.meleeTimer = 0;
    this.meleeDuration = 0.3;
    this.shootCooldown = 0;
    this.shootCooldownMax = 0.2;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.invulnerableDuration = 1.5;
    this.lastContactDamageTime = 0;
    this.knockbackVelocity = new Vector3(0, 0, 0);
    this.walkBob = 0;

    this.rootMesh = new TransformNode("player", scene);
    this.rootMesh.position = spawnPos.clone();
    this._buildModel();
  }

  _buildModel() {
    const bodyMat = new StandardMaterial("playerBodyMat", this.scene);
    bodyMat.diffuseColor = new Color3(0.3, 0.45, 0.2);
    bodyMat.specularColor = new Color3(0.1, 0.1, 0.1);

    this.body = MeshBuilder.CreateBox("playerBody", { width: 0.7, height: 0.9, depth: 0.4 }, this.scene);
    this.body.position = new Vector3(0, 1.1, 0);
    this.body.material = bodyMat;
    this.body.parent = this.rootMesh;

    const headMat = new StandardMaterial("playerHeadMat", this.scene);
    headMat.diffuseColor = new Color3(0.85, 0.7, 0.55);
    this.head = MeshBuilder.CreateSphere("playerHead", { diameter: 0.45, segments: 12 }, this.scene);
    this.head.position = new Vector3(0, 1.85, 0);
    this.head.material = headMat;
    this.head.parent = this.rootMesh;

    const helmetMat = new StandardMaterial("playerHelmetMat", this.scene);
    helmetMat.diffuseColor = new Color3(0.25, 0.35, 0.15);
    this.helmet = MeshBuilder.CreateSphere("playerHelmet", { diameter: 0.52, segments: 10, slice: 0.5 }, this.scene);
    this.helmet.position = new Vector3(0, 1.92, 0);
    this.helmet.material = helmetMat;
    this.helmet.parent = this.rootMesh;

    this.leftArm = MeshBuilder.CreateBox("playerLA", { width: 0.2, height: 0.7, depth: 0.2 }, this.scene);
    this.leftArm.position = new Vector3(-0.5, 1.0, 0);
    this.leftArm.material = bodyMat;
    this.leftArm.parent = this.rootMesh;

    this.rightArm = MeshBuilder.CreateBox("playerRA", { width: 0.2, height: 0.7, depth: 0.2 }, this.scene);
    this.rightArm.position = new Vector3(0.5, 1.0, 0);
    this.rightArm.material = bodyMat;
    this.rightArm.parent = this.rootMesh;

    const gunMat = new StandardMaterial("gunMat", this.scene);
    gunMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
    gunMat.specularColor = new Color3(0.4, 0.4, 0.4);
    this.gun = MeshBuilder.CreateBox("playerGun", { width: 0.1, height: 0.1, depth: 0.6 }, this.scene);
    this.gun.position = new Vector3(0.5, 1.0, 0.35);
    this.gun.material = gunMat;
    this.gun.parent = this.rootMesh;

    const legMat = new StandardMaterial("playerLegMat", this.scene);
    legMat.diffuseColor = new Color3(0.25, 0.25, 0.2);
    this.leftLeg = MeshBuilder.CreateBox("playerLL", { width: 0.22, height: 0.7, depth: 0.22 }, this.scene);
    this.leftLeg.position = new Vector3(-0.18, 0.35, 0);
    this.leftLeg.material = legMat;
    this.leftLeg.parent = this.rootMesh;

    this.rightLeg = MeshBuilder.CreateBox("playerRL", { width: 0.22, height: 0.7, depth: 0.22 }, this.scene);
    this.rightLeg.position = new Vector3(0.18, 0.35, 0);
    this.rightLeg.material = legMat;
    this.rightLeg.parent = this.rootMesh;

    const knifeMat = new StandardMaterial("knifeMat", this.scene);
    knifeMat.diffuseColor = new Color3(0.7, 0.7, 0.7);
    knifeMat.specularColor = new Color3(0.8, 0.8, 0.8);
    this.knife = MeshBuilder.CreateBox("playerKnife", { width: 0.05, height: 0.05, depth: 0.5 }, this.scene);
    this.knife.position = new Vector3(0.6, 1.2, 0.5);
    this.knife.material = knifeMat;
    this.knife.parent = this.rootMesh;
    this.knife.setEnabled(false);

    this.meshes = [this.body, this.head, this.helmet, this.leftArm, this.rightArm, this.gun, this.leftLeg, this.rightLeg, this.knife];
  }

  update(dt, input) {
    if (this.isDead) return;

    this._handleMovement(dt, input);
    this._handleJump(dt, input);
    this._applyGravity(dt);
    this._applyVelocity(dt);
    this._groundCheck();
    this._handleShooting(dt, input);
    this._handleMelee(dt, input);
    this._updateInvulnerability(dt);
    this._animateCharacter(dt, input);

    if (this.knockbackVelocity.length() > 0.1) {
      this.rootMesh.position.addInPlace(this.knockbackVelocity.scale(dt));
      this.knockbackVelocity.scaleInPlace(0.9);
    } else {
      this.knockbackVelocity.set(0, 0, 0);
    }

    this._clampPosition();
    input.endFrame();
  }

  _handleMovement(dt, input) {
    const forward = this.game.getForwardDirection();
    const right = this.game.getRightDirection();
    const currentSpeed = input.sprint ? this.sprintSpeed : this.speed;
    let moveDir = Vector3.Zero();

    if (input.moveForward) moveDir.addInPlace(forward);
    if (input.moveBackward) moveDir.addInPlace(forward.scale(-1));
    if (input.moveLeft) moveDir.addInPlace(right.scale(-1));
    if (input.moveRight) moveDir.addInPlace(right);

    if (moveDir.length() > 0.01) {
      moveDir.normalize();
      this.velocity.x = moveDir.x * currentSpeed;
      this.velocity.z = moveDir.z * currentSpeed;
      const targetYaw = Math.atan2(moveDir.x, moveDir.z);
      let diff = targetYaw - this.rootMesh.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.rootMesh.rotation.y += diff * 0.15;
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
      if (Math.abs(this.velocity.x) < 0.1) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.1) this.velocity.z = 0;
    }
  }

  _handleJump(dt, input) {
    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }
  }

  _applyGravity(dt) {
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }
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

    // Ray-based check for platforms
    const origin = pos.clone();
    origin.y += 1.0;
    try {
      const ray = new Ray(origin, new Vector3(0, -1, 0), 3.0);
      const hit = this.scene.pickWithRay(ray, (mesh) => {
        return (
          mesh.isPickable &&
          !mesh.name.startsWith("player") &&
          !mesh.name.startsWith("bullet") &&
          !mesh.name.startsWith("enemy") &&
          !mesh.name.startsWith("boss") &&
          !mesh.name.startsWith("pickup") &&
          !mesh.name.startsWith("dmg") &&
          !mesh.name.startsWith("crossH") &&
          !mesh.name.startsWith("crossV") &&
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
      // If raycasting fails, use simple ground check
      if (pos.y <= 0.05) {
        this.isGrounded = true;
        this.velocity.y = 0;
        pos.y = 0;
      } else {
        this.isGrounded = false;
      }
    }
  }

  _applyVelocity(dt) {
    this.rootMesh.position.x += this.velocity.x * dt;
    this.rootMesh.position.y += this.velocity.y * dt;
    this.rootMesh.position.z += this.velocity.z * dt;
  }

  _handleShooting(dt, input) {
    this.shootCooldown -= dt;
    if (input.shoot && this.shootCooldown <= 0 && !this.isMeleeing) {
      this.shootCooldown = this.shootCooldownMax;
      // Shoot in the direction the player character is facing
      const yaw = this.rootMesh.rotation.y;
      const aimDir = new Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
      const spawnPos = this.rootMesh.position.clone();
      spawnPos.y += 1.0;
      spawnPos.addInPlace(aimDir.scale(1.0));
      this.game.bulletManager.spawnPlayerBullet(spawnPos, aimDir);
      this.game.sound.play("rifle_shot");
    }
  }

  _handleMelee(dt, input) {
    if (this.meleeTimer > 0) {
      this.meleeTimer -= dt;
      if (this.meleeTimer <= 0) {
        this.isMeleeing = false;
        this.knife.setEnabled(false);
      }
    }
    if (input.melee && !this.isMeleeing) {
      this.isMeleeing = true;
      this.meleeTimer = this.meleeDuration;
      this.knife.setEnabled(true);
      this.game.sound.play("samurai_sword_slash");
    }
  }

  getMeleePosition() {
    const forward = new Vector3(
      Math.sin(this.rootMesh.rotation.y), 0,
      Math.cos(this.rootMesh.rotation.y)
    );
    return this.rootMesh.position.add(forward.scale(1.5)).add(new Vector3(0, 1, 0));
  }

  _updateInvulnerability(dt) {
    if (this.invulnerable) {
      this.invulnerableTimer -= dt;
      const visible = Math.floor(this.invulnerableTimer * 10) % 2 === 0;
      this.meshes.forEach((m) => {
        if (m && !m.isDisposed()) m.visibility = visible ? 1 : 0.3;
      });
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
        this.meshes.forEach((m) => {
          if (m && !m.isDisposed()) m.visibility = 1;
        });
      }
    }
  }

  _animateCharacter(dt, input) {
    const isMoving = Math.abs(this.velocity.x) > 0.5 || Math.abs(this.velocity.z) > 0.5;
    if (isMoving && this.isGrounded) {
      this.walkBob += dt * (input.sprint ? 15 : 10);
      const legSwing = Math.sin(this.walkBob) * 0.4;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftArm.rotation.x = -legSwing * 0.5;
      this.rightArm.rotation.x = legSwing * 0.3;
      this.body.position.y = 1.1 + Math.abs(Math.sin(this.walkBob)) * 0.05;
    } else {
      this.leftLeg.rotation.x *= 0.9;
      this.rightLeg.rotation.x *= 0.9;
      this.leftArm.rotation.x *= 0.9;
      this.rightArm.rotation.x *= 0.9;
      this.body.position.y = 1.1 + Math.sin(Date.now() * 0.003) * 0.02;
    }
    if (!this.isGrounded) {
      this.leftLeg.rotation.x = -0.3;
      this.rightLeg.rotation.x = 0.3;
    }
    if (this.isMeleeing) {
      const t = 1 - this.meleeTimer / this.meleeDuration;
      this.rightArm.rotation.x = -Math.PI * 0.5 * Math.sin(t * Math.PI);
      this.knife.position.z = 0.5 + Math.sin(t * Math.PI) * 0.5;
    }
  }

  _clampPosition() {
    const p = this.rootMesh.position;
    p.x = Math.max(-28, Math.min(28, p.x));
    p.z = Math.max(-23, Math.min(23, p.z));
    if (p.y < -5) this.health = 0;
  }

  takeDamage(amount) {
    if (this.invulnerable || this.isDead) return;
    this.health -= amount;
    this.invulnerable = true;
    this.invulnerableTimer = this.invulnerableDuration;
    this.lastContactDamageTime = Date.now();

    this.game.damageDisplay.show(
      this.rootMesh.position.add(new Vector3(0, 2.5, 0)),
      "-" + amount,
      new Color3(1, 0, 0)
    );

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  canTakeContactDamage() {
    return !this.invulnerable && !this.isDead && Date.now() - this.lastContactDamageTime > 1000;
  }

  heal(amount) {
    if (this.health >= this.maxHealth) return false;
    this.health = Math.min(this.maxHealth, this.health + amount);
    return true;
  }

  applyKnockback(direction, force) {
    this.knockbackVelocity = direction.scale(force);
    this.knockbackVelocity.y = force * 0.3;
  }

  die() {
    this.isDead = true;
    let angle = 0;
    const fallInterval = setInterval(() => {
      angle += 0.05;
      if (this.rootMesh && !this.rootMesh.isDisposed()) {
        this.rootMesh.rotation.x = angle;
        if (angle > Math.PI / 2) {
          clearInterval(fallInterval);
          setTimeout(() => this.game.playerDied(), 500);
        }
      } else {
        clearInterval(fallInterval);
      }
    }, 16);
  }

  dispose() {
    this.meshes.forEach((m) => {
      if (m && !m.isDisposed()) m.dispose();
    });
    if (this.rootMesh && !this.rootMesh.isDisposed()) this.rootMesh.dispose();
  }
}
