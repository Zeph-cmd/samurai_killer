import {
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
} from "@babylonjs/core";

export class BulletManager {
  constructor(scene) {
    this.scene = scene;
    this.playerBullets = [];
    this.enemyBullets = [];
    this.playerBulletSpeed = 45;
    this.enemyBulletSpeed = 25;
  }

  spawnPlayerBullet(position, direction) {
    const bullet = this._createBullet(
      "playerBullet",
      position,
      direction,
      this.playerBulletSpeed,
      new Color3(1, 0.9, 0.2),
      new Color3(1, 0.7, 0)
    );
    this.playerBullets.push(bullet);
  }

  spawnEnemyBullet(position, direction) {
    const bullet = this._createBullet(
      "enemyBullet",
      position,
      direction,
      this.enemyBulletSpeed,
      new Color3(1, 0.3, 0.1),
      new Color3(0.8, 0.1, 0)
    );
    this.enemyBullets.push(bullet);
  }

  _createBullet(prefix, position, direction, speed, color, emissive) {
    const mesh = MeshBuilder.CreateSphere(
      `bullet_${prefix}_${Date.now()}_${Math.random()}`,
      { diameter: 0.2, segments: 6 },
      this.scene
    );
    mesh.position = position.clone();

    const mat = new StandardMaterial(
      `${prefix}Mat_${Date.now()}`,
      this.scene
    );
    mat.diffuseColor = color;
    mat.emissiveColor = emissive;
    mat.specularColor = new Color3(1, 1, 1);
    mesh.material = mat;

    // Trail glow sphere
    const trail = MeshBuilder.CreateSphere(
      `bulletTrail_${Date.now()}_${Math.random()}`,
      { diameter: 0.12, segments: 4 },
      this.scene
    );
    trail.position = position.clone();
    const trailMat = new StandardMaterial(
      `trailMat_${Date.now()}`,
      this.scene
    );
    trailMat.diffuseColor = color.scale(0.5);
    trailMat.emissiveColor = emissive.scale(0.3);
    trailMat.alpha = 0.5;
    trail.material = trailMat;

    return {
      mesh,
      trail,
      direction: direction.normalize(),
      speed,
      lifetime: 0,
      active: true,
    };
  }

  update(dt, game) {
    this._updateBulletList(this.playerBullets, dt);
    this._updateBulletList(this.enemyBullets, dt);

    // Clean up inactive bullets
    this.playerBullets = this.playerBullets.filter((b) => {
      if (!b.active) {
        this._disposeBullet(b);
        return false;
      }
      return true;
    });

    this.enemyBullets = this.enemyBullets.filter((b) => {
      if (!b.active) {
        this._disposeBullet(b);
        return false;
      }
      return true;
    });
  }

  _updateBulletList(bullets, dt) {
    bullets.forEach((bullet) => {
      if (!bullet.active) return;

      bullet.lifetime += dt;

      // Move bullet
      const movement = bullet.direction.scale(bullet.speed * dt);
      bullet.mesh.position.addInPlace(movement);

      // Trail follows with delay
      const trailTarget = bullet.mesh.position.subtract(
        bullet.direction.scale(0.3)
      );
      bullet.trail.position = Vector3.Lerp(
        bullet.trail.position,
        trailTarget,
        0.5
      );

      // Expire after max lifetime
      if (bullet.lifetime > 4) {
        bullet.active = false;
      }

      // Out of bounds
      const p = bullet.mesh.position;
      if (
        p.x < -32 || p.x > 32 ||
        p.y < -2 || p.y > 30 ||
        p.z < -27 || p.z > 27
      ) {
        bullet.active = false;
      }
    });
  }

  _disposeBullet(bullet) {
    if (bullet.mesh && !bullet.mesh.isDisposed()) {
      if (bullet.mesh.material) bullet.mesh.material.dispose();
      bullet.mesh.dispose();
    }
    if (bullet.trail && !bullet.trail.isDisposed()) {
      if (bullet.trail.material) bullet.trail.material.dispose();
      bullet.trail.dispose();
    }
  }

  clearAll() {
    [...this.playerBullets, ...this.enemyBullets].forEach((b) => {
      this._disposeBullet(b);
    });
    this.playerBullets = [];
    this.enemyBullets = [];
  }
}
