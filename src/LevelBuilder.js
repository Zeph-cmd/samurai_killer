import {
  Vector3,
  Color3,
  MeshBuilder,
  StandardMaterial,
  Texture,
  TransformNode,
  Mesh,
} from "@babylonjs/core";

export class LevelBuilder {
  constructor(scene, shadowGenerator) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    this.rootNode = new TransformNode("level", scene);
    this.collisionMeshes = [];
    this.allMeshes = [];
  }

  build() {
    this._createGround();
    this._createPlatforms();
    this._createWalls();
    this._createDecorations();
    this._createTrees();
  }

  _createMaterial(name, diffuseColor, specularColor = null) {
    const mat = new StandardMaterial(name, this.scene);
    mat.diffuseColor = diffuseColor;
    mat.specularColor = specularColor || new Color3(0.1, 0.1, 0.1);
    return mat;
  }

  _createGround() {
    // Main ground plane
    const ground = MeshBuilder.CreateGround(
      "ground",
      { width: 60, height: 50, subdivisions: 4 },
      this.scene
    );
    const groundMat = this._createMaterial(
      "groundMat",
      new Color3(0.35, 0.55, 0.2)
    );
    groundMat.specularColor = new Color3(0.05, 0.05, 0.05);
    groundMat.emissiveColor = new Color3(0.08, 0.12, 0.04);
    ground.material = groundMat;
    ground.receiveShadows = true;
    ground.checkCollisions = true;
    ground.parent = this.rootNode;
    this.collisionMeshes.push(ground);
    this.allMeshes.push(ground);

    // Dirt patches
    for (let i = 0; i < 8; i++) {
      const patch = MeshBuilder.CreateDisc(
        `dirtPatch${i}`,
        { radius: 1.5 + Math.random() * 2, tessellation: 16 },
        this.scene
      );
      patch.rotation.x = Math.PI / 2;
      patch.position = new Vector3(
        (Math.random() - 0.5) * 50,
        0.01,
        (Math.random() - 0.5) * 40
      );
      const dirtMat = this._createMaterial(
        `dirtMat${i}`,
        new Color3(0.35 + Math.random() * 0.1, 0.25 + Math.random() * 0.05, 0.1)
      );
      dirtMat.specularColor = new Color3(0, 0, 0);
      patch.material = dirtMat;
      patch.parent = this.rootNode;
      this.allMeshes.push(patch);
    }
  }

  _createPlatforms() {
    const platformColor = new Color3(0.4, 0.35, 0.3);
    const platformTopColor = new Color3(0.3, 0.45, 0.2);

    const platforms = [
      // position [x, y, z], size [w, h, d]
      { pos: [8, 1.5, 8], size: [6, 0.5, 4] },
      { pos: [15, 3, 15], size: [5, 0.5, 5] },
      { pos: [-5, 2, 12], size: [4, 0.5, 6] },
      { pos: [22, 2, 5], size: [8, 0.5, 3] },
      { pos: [10, 4.5, 22], size: [5, 0.5, 4] },
      { pos: [-8, 1, 20], size: [5, 0.5, 5] },
      { pos: [28, 4, 12], size: [4, 0.5, 4] },
      { pos: [25, 1.5, 20], size: [6, 0.5, 5] },
      // Stepped platforms
      { pos: [18, 1, 20], size: [3, 0.5, 3] },
      { pos: [20, 2, 22], size: [3, 0.5, 3] },
      { pos: [22, 3, 20], size: [3, 0.5, 3] },
      // Bridge
      { pos: [5, 3.5, 18], size: [10, 0.3, 1.5] },
      // Sniper perch
      { pos: [27, 5, 8], size: [3, 0.5, 3] },
    ];

    platforms.forEach((p, i) => {
      const platform = MeshBuilder.CreateBox(
        `platform${i}`,
        { width: p.size[0], height: p.size[1], depth: p.size[2] },
        this.scene
      );
      platform.position = new Vector3(p.pos[0], p.pos[1], p.pos[2]);

      const mat = this._createMaterial(`platformMat${i}`, platformColor);
      platform.material = mat;
      platform.receiveShadows = true;
      platform.checkCollisions = true;
      platform.parent = this.rootNode;
      this.collisionMeshes.push(platform);
      this.allMeshes.push(platform);

      // Platform top (grass layer)
      const top = MeshBuilder.CreateBox(
        `platformTop${i}`,
        { width: p.size[0] + 0.1, height: 0.1, depth: p.size[2] + 0.1 },
        this.scene
      );
      top.position = new Vector3(
        p.pos[0],
        p.pos[1] + p.size[1] / 2 + 0.05,
        p.pos[2]
      );
      const topMat = this._createMaterial(`platformTopMat${i}`, platformTopColor);
      topMat.specularColor = new Color3(0, 0, 0);
      top.material = topMat;
      top.parent = this.rootNode;
      this.allMeshes.push(top);
    });

    // Pillars / supports for elevated platforms
    const pillarPositions = [
      { pos: [15, 0, 15], height: 3 },
      { pos: [28, 0, 12], height: 4 },
      { pos: [27, 0, 8], height: 5 },
      { pos: [10, 0, 22], height: 4.5 },
    ];
    pillarPositions.forEach((p, i) => {
      const pillar = MeshBuilder.CreateCylinder(
        `pillar${i}`,
        { diameter: 0.6, height: p.height, tessellation: 8 },
        this.scene
      );
      pillar.position = new Vector3(p.pos[0], p.height / 2, p.pos[2]);
      const pillarMat = this._createMaterial(
        `pillarMat${i}`,
        new Color3(0.45, 0.4, 0.35)
      );
      pillar.material = pillarMat;
      pillar.parent = this.rootNode;
      this.allMeshes.push(pillar);
    });
  }

  _createWalls() {
    const wallColor = new Color3(0.35, 0.3, 0.25);

    // Boundary walls
    const walls = [
      { pos: [0, 2.5, -25], size: [62, 5, 1] },
      { pos: [0, 2.5, 25], size: [62, 5, 1] },
      { pos: [-30, 2.5, 0], size: [1, 5, 52] },
      { pos: [30, 2.5, 0], size: [1, 5, 52] },
    ];

    walls.forEach((w, i) => {
      const wall = MeshBuilder.CreateBox(
        `wall${i}`,
        { width: w.size[0], height: w.size[1], depth: w.size[2] },
        this.scene
      );
      wall.position = new Vector3(w.pos[0], w.pos[1], w.pos[2]);
      const mat = this._createMaterial(`wallMat${i}`, wallColor);
      wall.material = mat;
      wall.checkCollisions = true;
      wall.parent = this.rootNode;
      this.collisionMeshes.push(wall);
      this.allMeshes.push(wall);
    });

    // Interior cover walls / barriers
    const barriers = [
      { pos: [12, 0.75, 10], size: [0.4, 1.5, 3] },
      { pos: [25, 0.75, 18], size: [3, 1.5, 0.4] },
      { pos: [5, 0.75, 22], size: [0.4, 1.5, 4] },
      { pos: [-3, 0.75, 5], size: [4, 1.5, 0.4] },
      { pos: [27, 0.75, 10], size: [0.4, 1.5, 6] },
    ];

    barriers.forEach((b, i) => {
      const barrier = MeshBuilder.CreateBox(
        `barrier${i}`,
        { width: b.size[0], height: b.size[1], depth: b.size[2] },
        this.scene
      );
      barrier.position = new Vector3(b.pos[0], b.pos[1], b.pos[2]);
      const mat = this._createMaterial(
        `barrierMat${i}`,
        new Color3(0.5, 0.45, 0.35)
      );
      barrier.material = mat;
      barrier.checkCollisions = true;
      barrier.receiveShadows = true;
      barrier.parent = this.rootNode;
      this.collisionMeshes.push(barrier);
      this.allMeshes.push(barrier);
    });
  }

  _createDecorations() {
    // Military crates
    const cratePositions = [
      new Vector3(6, 0.4, 5),
      new Vector3(20, 0.4, 8),
      new Vector3(-2, 0.4, 15),
      new Vector3(26, 0.4, 6),
      new Vector3(15, 0.4, 20),
    ];
    const crateMat = this._createMaterial(
      "crateMat",
      new Color3(0.4, 0.3, 0.15)
    );

    cratePositions.forEach((pos, i) => {
      const crate = MeshBuilder.CreateBox(
        `crate${i}`,
        { width: 0.8, height: 0.8, depth: 0.8 },
        this.scene
      );
      crate.position = pos;
      crate.rotation.y = Math.random() * Math.PI;
      crate.material = crateMat;
      crate.receiveShadows = true;
      crate.checkCollisions = true;
      crate.parent = this.rootNode;
      this.collisionMeshes.push(crate);
      this.allMeshes.push(crate);
      this.shadowGenerator.addShadowCaster(crate);
    });

    // Explosive barrels
    const barrelPositions = [
      new Vector3(10, 0.5, 3),
      new Vector3(26, 0.5, 12),
      new Vector3(-5, 0.5, 8),
    ];
    const barrelMat = this._createMaterial(
      "barrelMat",
      new Color3(0.6, 0.15, 0.1)
    );

    barrelPositions.forEach((pos, i) => {
      const barrel = MeshBuilder.CreateCylinder(
        `barrel${i}`,
        { diameter: 0.7, height: 1, tessellation: 12 },
        this.scene
      );
      barrel.position = pos;
      barrel.material = barrelMat;
      barrel.receiveShadows = true;
      barrel.checkCollisions = true;
      barrel.parent = this.rootNode;
      this.collisionMeshes.push(barrel);
      this.allMeshes.push(barrel);
      this.shadowGenerator.addShadowCaster(barrel);
    });

    // Rocks
    const rockPositions = [
      new Vector3(3, 0.3, 12),
      new Vector3(18, 0.3, 22),
      new Vector3(-8, 0.3, 3),
      new Vector3(25, 0.3, 20),
      new Vector3(20, 0.3, 15),
    ];

    rockPositions.forEach((pos, i) => {
      const rock = MeshBuilder.CreateSphere(
        `rock${i}`,
        {
          diameter: 0.6 + Math.random() * 0.8,
          segments: 6,
        },
        this.scene
      );
      rock.position = pos;
      rock.scaling.y = 0.6;
      const rockMat = this._createMaterial(
        `rockMat${i}`,
        new Color3(0.4, 0.38, 0.35)
      );
      rockMat.specularColor = new Color3(0, 0, 0);
      rock.material = rockMat;
      rock.receiveShadows = true;
      rock.parent = this.rootNode;
      this.allMeshes.push(rock);
      this.shadowGenerator.addShadowCaster(rock);
    });
  }

  _createTrees() {
    const treePositions = [
      new Vector3(-10, 0, 5),
      new Vector3(-12, 0, 15),
      new Vector3(-8, 0, -5),
      new Vector3(5, 0, -8),
      new Vector3(15, 0, -10),
      new Vector3(25, 0, -8),
      new Vector3(-15, 0, 22),
      new Vector3(26, 0, 3),
      new Vector3(24, 0, -5),
      new Vector3(-5, 0, -12),
      new Vector3(20, 0, -12),
      new Vector3(27, 0, 18),
    ];

    const trunkMat = this._createMaterial(
      "trunkMat",
      new Color3(0.35, 0.2, 0.1)
    );
    trunkMat.specularColor = new Color3(0, 0, 0);

    treePositions.forEach((pos, i) => {
      const height = 3 + Math.random() * 3;
      const trunk = MeshBuilder.CreateCylinder(
        `trunk${i}`,
        { diameter: 0.3 + Math.random() * 0.2, height: height, tessellation: 8 },
        this.scene
      );
      trunk.position = new Vector3(pos.x, height / 2, pos.z);
      trunk.material = trunkMat;
      trunk.parent = this.rootNode;
      this.allMeshes.push(trunk);
      this.shadowGenerator.addShadowCaster(trunk);

      // Foliage — layered cones/spheres
      const foliageCount = 2 + Math.floor(Math.random() * 2);
      for (let j = 0; j < foliageCount; j++) {
        const foliage = MeshBuilder.CreateSphere(
          `foliage${i}_${j}`,
          { diameter: 2 + Math.random() * 1.5, segments: 8 },
          this.scene
        );
        foliage.position = new Vector3(
          pos.x + (Math.random() - 0.5) * 0.5,
          height - 0.5 + j * 0.8,
          pos.z + (Math.random() - 0.5) * 0.5
        );
        foliage.scaling = new Vector3(1, 0.7, 1);
        const foliageMat = this._createMaterial(
          `foliageMat${i}_${j}`,
          new Color3(
            0.1 + Math.random() * 0.15,
            0.35 + Math.random() * 0.2,
            0.05 + Math.random() * 0.1
          )
        );
        foliageMat.specularColor = new Color3(0, 0, 0);
        foliage.material = foliageMat;
        foliage.parent = this.rootNode;
        this.allMeshes.push(foliage);
        this.shadowGenerator.addShadowCaster(foliage);
      }
    });
  }

  dispose() {
    this.allMeshes.forEach((m) => {
      if (m && !m.isDisposed()) m.dispose();
    });
    this.allMeshes = [];
    this.collisionMeshes = [];
    if (this.rootNode) {
      this.rootNode.dispose();
    }
  }
}
