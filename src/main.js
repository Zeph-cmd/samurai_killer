import { Engine, Scene } from "@babylonjs/core";
// Side-effect imports needed by Babylon.js v7 tree-shaking
import "@babylonjs/core/Culling/ray";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Meshes/meshBuilder";
// Shader imports to prevent 404 dynamic import failures
import "@babylonjs/core/Shaders/shadowMap.fragment";
import "@babylonjs/core/Shaders/shadowMap.vertex";
import "@babylonjs/core/Shaders/default.fragment";
import "@babylonjs/core/Shaders/default.vertex";
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import { Game } from "./Game.js";

window.addEventListener("error", (e) => {
  console.error("[GAME ERROR]", e.message, e.filename, e.lineno);
});

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  antialias: true,
});

const scene = new Scene(engine);
const game = new Game(engine, scene, canvas);

game.init().then(() => {
  engine.runRenderLoop(() => {
    try {
      const dt = engine.getDeltaTime() / 1000;
      game.update(dt);
    } catch (e) {
      console.error("[UPDATE ERROR]", e);
    }
    scene.render();
  });
}).catch((e) => {
  console.error("[INIT ERROR]", e);
});

window.addEventListener("resize", () => engine.resize());
