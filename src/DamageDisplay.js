import {
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  DynamicTexture,
  Mesh,
} from "@babylonjs/core";

export class DamageDisplay {
  constructor(scene) {
    this.scene = scene;
    this.texts = [];
  }

  show(position, text, color) {
    // Create a small plane with dynamic texture for the text
    const plane = MeshBuilder.CreatePlane(
      `dmgText_${Date.now()}_${Math.random()}`,
      { width: 1.5, height: 0.5 },
      this.scene
    );
    plane.position = position.clone();
    plane.billboardMode = Mesh.BILLBOARDMODE_ALL;

    // Dynamic texture for text rendering
    const texture = new DynamicTexture(
      `dmgTex_${Date.now()}`,
      { width: 256, height: 64 },
      this.scene,
      false
    );

    const ctx = texture.getContext();
    ctx.clearRect(0, 0, 256, 64);

    // Shadow
    ctx.font = "bold 40px monospace";
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 130, 34);

    // Main text
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillText(text, 128, 32);
    texture.update();

    const mat = new StandardMaterial(`dmgMat_${Date.now()}`, this.scene);
    mat.diffuseTexture = texture;
    mat.emissiveColor = color.scale(0.5);
    mat.useAlphaFromDiffuseTexture = true;
    mat.disableLighting = true;
    mat.backFaceCulling = false;
    plane.material = mat;

    this.texts.push({
      mesh: plane,
      material: mat,
      texture: texture,
      velocity: new Vector3(
        (Math.random() - 0.5) * 1,
        3,
        (Math.random() - 0.5) * 1
      ),
      lifetime: 0,
      maxLifetime: 1.5,
    });
  }

  update(dt) {
    this.texts = this.texts.filter((t) => {
      t.lifetime += dt;

      if (t.lifetime >= t.maxLifetime) {
        if (t.texture) t.texture.dispose();
        if (t.material) t.material.dispose();
        if (t.mesh && !t.mesh.isDisposed()) t.mesh.dispose();
        return false;
      }

      // Rise upward and drift
      t.mesh.position.addInPlace(t.velocity.scale(dt));
      t.velocity.y *= 0.97;
      t.velocity.x *= 0.95;
      t.velocity.z *= 0.95;

      // Fade out
      const alpha = 1 - t.lifetime / t.maxLifetime;
      t.mesh.visibility = alpha;

      // Scale up slightly over time
      const scale = 1 + t.lifetime * 0.3;
      t.mesh.scaling.set(scale, scale, scale);

      return true;
    });
  }

  dispose() {
    this.texts.forEach((t) => {
      if (t.texture) t.texture.dispose();
      if (t.material) t.material.dispose();
      if (t.mesh && !t.mesh.isDisposed()) t.mesh.dispose();
    });
    this.texts = [];
  }
}
