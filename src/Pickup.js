import {
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";

export class Pickup {
  constructor(scene, game, position) {
    this.scene = scene;
    this.game = game;
    this.collected = false;
    this.bobTime = Math.random() * Math.PI * 2;
    this.baseY = position.y;

    // Build model — white box with red cross
    this.mesh = new TransformNode("pickup", scene);
    this.mesh.position = position.clone();
    this.allMeshes = [];

    // Main box
    this.box = MeshBuilder.CreateBox(
      `pickupBox_${Date.now()}_${Math.random()}`,
      { width: 0.6, height: 0.4, depth: 0.6 },
      scene
    );
    const boxMat = new StandardMaterial("pickupBoxMat", scene);
    boxMat.diffuseColor = new Color3(0.95, 0.95, 0.95);
    boxMat.specularColor = new Color3(0.5, 0.5, 0.5);
    this.box.material = boxMat;
    this.box.parent = this.mesh;
    this.allMeshes.push(this.box);

    // Red cross — horizontal bar
    this.crossH = MeshBuilder.CreateBox(
      `crossH_${Date.now()}`,
      { width: 0.35, height: 0.08, depth: 0.02 },
      scene
    );
    this.crossH.position = new Vector3(0, 0, 0.31);
    const crossMat = new StandardMaterial("crossMat", scene);
    crossMat.diffuseColor = new Color3(0.9, 0.1, 0.1);
    crossMat.emissiveColor = new Color3(0.3, 0, 0);
    this.crossH.material = crossMat;
    this.crossH.parent = this.mesh;
    this.allMeshes.push(this.crossH);

    // Red cross — vertical bar
    this.crossV = MeshBuilder.CreateBox(
      `crossV_${Date.now()}`,
      { width: 0.08, height: 0.35, depth: 0.02 },
      scene
    );
    this.crossV.position = new Vector3(0, 0, 0.31);
    this.crossV.material = crossMat;
    this.crossV.parent = this.mesh;
    this.allMeshes.push(this.crossV);

    // Glow sphere
    this.glow = MeshBuilder.CreateSphere(
      `pickupGlow_${Date.now()}`,
      { diameter: 0.8, segments: 8 },
      scene
    );
    const glowMat = new StandardMaterial("pickupGlowMat", scene);
    glowMat.diffuseColor = new Color3(0.2, 0.8, 0.2);
    glowMat.emissiveColor = new Color3(0.1, 0.3, 0.1);
    glowMat.alpha = 0.2;
    this.glow.material = glowMat;
    this.glow.parent = this.mesh;
    this.allMeshes.push(this.glow);
  }

  update(dt) {
    if (this.collected) return;

    this.bobTime += dt * 3;

    // Float up and down
    this.mesh.position.y = this.baseY + Math.sin(this.bobTime) * 0.3 + 0.5;

    // Rotate slowly
    this.mesh.rotation.y += dt * 2;

    // Glow pulse
    const pulse = 0.15 + Math.sin(this.bobTime * 1.5) * 0.1;
    this.glow.material.alpha = pulse;
  }

  collect() {
    this.collected = true;

    // Quick scale-down + disappear
    let t = 0;
    const interval = setInterval(() => {
      t += 0.05;
      const s = Math.max(0, 1 - t);
      this.allMeshes.forEach((m) => {
        if (m && !m.isDisposed()) {
          m.scaling.set(s, s, s);
          m.visibility = s;
        }
      });
      if (t >= 1) {
        clearInterval(interval);
        this.allMeshes.forEach((m) => {
          if (m && !m.isDisposed()) m.setEnabled(false);
        });
      }
    }, 16);
  }

  dispose() {
    this.allMeshes.forEach((m) => {
      if (m && !m.isDisposed()) m.dispose();
    });
    if (this.mesh && !this.mesh.isDisposed()) {
      this.mesh.dispose();
    }
  }
}
