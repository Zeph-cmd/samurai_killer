import {
  AdvancedDynamicTexture,
  TextBlock,
  Rectangle,
  Control,
  StackPanel,
  Ellipse,
  Button,
} from "@babylonjs/gui";
import { GameMode } from "./Game.js";

export class HUD {
  constructor(game) {
    this.game = game;
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    this.loadingPanel = null;
    this.titlePanel = null;
    this.modeSelectPanel = null;
    this.gameHUDPanel = null;
    this.pausePanel = null;
    this.gameOverPanel = null;
    this.victoryPanel = null;
    this.healthBar = null;
    this.healthText = null;
    this.modeInfoText = null;
    this.touchControls = null;
  }

  // ========== LOADING SCREEN ==========
  showLoadingScreen() {
    this.loadingPanel = new Rectangle("loadingPanel");
    this.loadingPanel.width = "100%";
    this.loadingPanel.height = "100%";
    this.loadingPanel.background = "#000000";
    this.loadingPanel.thickness = 0;
    this.gui.addControl(this.loadingPanel);

    const title = new TextBlock("loadingTitle", "METAL SLUG SOLDIER 3D");
    title.color = "#FFD700";
    title.fontSize = 48;
    title.fontFamily = "monospace";
    title.top = "-80px";
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.loadingPanel.addControl(title);

    const loadingText = new TextBlock("loadingText", "Preparing battlefield...");
    loadingText.color = "#AAAAAA";
    loadingText.fontSize = 20;
    loadingText.fontFamily = "monospace";
    loadingText.top = "0px";
    loadingText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    loadingText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.loadingPanel.addControl(loadingText);

    const barBg = new Rectangle("barBg");
    barBg.width = "300px";
    barBg.height = "20px";
    barBg.top = "40px";
    barBg.background = "#333333";
    barBg.thickness = 1;
    barBg.color = "#666666";
    barBg.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.loadingPanel.addControl(barBg);

    const barFill = new Rectangle("barFill");
    barFill.width = "0px";
    barFill.height = "18px";
    barFill.background = "#FFD700";
    barFill.thickness = 0;
    barFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    barBg.addControl(barFill);

    let progress = 0;
    const loadInterval = setInterval(() => {
      progress += 5;
      if (progress > 100) progress = 100;
      barFill.width = `${(progress / 100) * 298}px`;
      if (progress >= 100) clearInterval(loadInterval);
    }, 50);
  }

  hideLoadingScreen() {
    if (this.loadingPanel) {
      this.gui.removeControl(this.loadingPanel);
      this.loadingPanel.dispose();
      this.loadingPanel = null;
    }
  }

  // ========== TITLE SCREEN ==========
  showTitleScreen() {
    this.titlePanel = new Rectangle("titlePanel");
    this.titlePanel.width = "100%";
    this.titlePanel.height = "100%";
    this.titlePanel.background = "rgba(0, 0, 0, 0.85)";
    this.titlePanel.thickness = 0;
    this.gui.addControl(this.titlePanel);

    const title = new TextBlock("gameTitle", "METAL SLUG\nSOLDIER 3D");
    title.color = "#FFD700";
    title.fontSize = 52;
    title.fontFamily = "monospace";
    title.fontWeight = "bold";
    title.top = "-120px";
    title.lineSpacing = "10px";
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    title.shadowColor = "#FF4400";
    title.shadowOffsetX = 3;
    title.shadowOffsetY = 3;
    this.titlePanel.addControl(title);

    const subtitle = new TextBlock("subtitle", "FULL 3D COMBAT EXPERIENCE");
    subtitle.color = "#FF6633";
    subtitle.fontSize = 18;
    subtitle.fontFamily = "monospace";
    subtitle.top = "-20px";
    subtitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    subtitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.titlePanel.addControl(subtitle);

    const startText = new TextBlock("startText", "[ TAP OR PRESS ENTER TO START ]");
    startText.color = "#FFFFFF";
    startText.fontSize = 22;
    startText.fontFamily = "monospace";
    startText.top = "60px";
    startText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    startText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.titlePanel.addControl(startText);

    let blinkOn = true;
    this._titleBlinkInterval = setInterval(() => {
      blinkOn = !blinkOn;
      startText.color = blinkOn ? "#FFFFFF" : "#666666";
    }, 500);

    const isMobile = this.game.input && this.game.input.isMobile;
    const ctrlStr = isMobile
      ? "Left: Move Joystick | Right: Camera\nTap buttons to Shoot / Melee / Jump"
      : "WASD - Move | SPACE - Jump | MOUSE - Aim\nLMB - Shoot | RMB/F - Melee | SHIFT - Sprint | P - Pause";
    const controls = new TextBlock("controlsInfo", ctrlStr);
    controls.color = "#888888";
    controls.fontSize = 13;
    controls.fontFamily = "monospace";
    controls.top = "130px";
    controls.lineSpacing = "5px";
    controls.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    controls.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.titlePanel.addControl(controls);
  }

  hideTitleScreen() {
    if (this._titleBlinkInterval) {
      clearInterval(this._titleBlinkInterval);
      this._titleBlinkInterval = null;
    }
    if (this.titlePanel) {
      this.gui.removeControl(this.titlePanel);
      this.titlePanel.dispose();
      this.titlePanel = null;
    }
  }

  // ========== MODE SELECT SCREEN ==========
  showModeSelectScreen() {
    this.modeSelectPanel = new Rectangle("modeSelectPanel");
    this.modeSelectPanel.width = "100%";
    this.modeSelectPanel.height = "100%";
    this.modeSelectPanel.background = "rgba(0, 0, 0, 0.9)";
    this.modeSelectPanel.thickness = 0;
    this.gui.addControl(this.modeSelectPanel);

    const title = new TextBlock("msTitle", "SELECT GAME MODE");
    title.color = "#FFD700";
    title.fontSize = 40;
    title.fontFamily = "monospace";
    title.fontWeight = "bold";
    title.top = "-200px";
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    title.shadowColor = "#886600";
    title.shadowOffsetX = 2;
    title.shadowOffsetY = 2;
    this.modeSelectPanel.addControl(title);

    this._selectedModeIndex = 0;
    this._modeButtons = [];
    this._modeKeys = [GameMode.MISSION, GameMode.SURVIVAL, GameMode.TIME_ATTACK];

    const modes = [
      { name: "1. MISSION MODE", desc: "Eliminate 4 soldiers and the Samurai Boss.\nClassic tactical combat.", color: "#44FF44" },
      { name: "2. SURVIVAL MODE", desc: "Endless enemy waves. How long can you survive?\nEnemies grow stronger each wave.", color: "#FF8844" },
      { name: "3. TIME ATTACK", desc: "Eliminate 8 soldiers and Boss in 2 minutes.\nSpeed is everything!", color: "#44AAFF" },
    ];

    modes.forEach((mode, i) => {
      const btn = new Rectangle(`modeBtn${i}`);
      btn.width = "460px";
      btn.height = "75px";
      btn.top = `${-60 + i * 95}px`;
      btn.background = i === 0 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)";
      btn.thickness = i === 0 ? 2 : 1;
      btn.color = i === 0 ? "#FFD700" : "#555555";
      btn.cornerRadius = 8;
      btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      this.modeSelectPanel.addControl(btn);

      // Make buttons tappable on mobile
      btn.isPointerBlocker = true;
      btn.onPointerClickObservable.add(() => {
        this._selectModeIndex(i);
        this.game.selectMode(this._modeKeys[i]);
      });

      const nameText = new TextBlock(`modeName${i}`, mode.name);
      nameText.color = mode.color;
      nameText.fontSize = 20;
      nameText.fontFamily = "monospace";
      nameText.fontWeight = "bold";
      nameText.top = "-10px";
      nameText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      nameText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      btn.addControl(nameText);

      const descText = new TextBlock(`modeDesc${i}`, mode.desc);
      descText.color = "#999999";
      descText.fontSize = 11;
      descText.fontFamily = "monospace";
      descText.top = "18px";
      descText.lineSpacing = "2px";
      descText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      descText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
      btn.addControl(descText);

      this._modeButtons.push(btn);
    });

    const isMobile = this.game.input && this.game.input.isMobile;
    const hintStr = isMobile
      ? "Tap a mode to start"
      : "Press 1, 2, or 3  |  ENTER to confirm  |  UP/DOWN to navigate";
    const hint = new TextBlock("msHint", hintStr);
    hint.color = "#666666";
    hint.fontSize = 13;
    hint.fontFamily = "monospace";
    hint.top = "200px";
    hint.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    hint.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.modeSelectPanel.addControl(hint);

    this._modeSelectHandler = (e) => {
      if (e.code === "Digit1" || e.code === "Numpad1") { this._selectModeIndex(0); this.game.selectMode(GameMode.MISSION); }
      else if (e.code === "Digit2" || e.code === "Numpad2") { this._selectModeIndex(1); this.game.selectMode(GameMode.SURVIVAL); }
      else if (e.code === "Digit3" || e.code === "Numpad3") { this._selectModeIndex(2); this.game.selectMode(GameMode.TIME_ATTACK); }
      else if (e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); this._selectModeIndex((this._selectedModeIndex + 2) % 3); }
      else if (e.code === "ArrowDown" || e.code === "KeyS") { e.preventDefault(); this._selectModeIndex((this._selectedModeIndex + 1) % 3); }
      else if (e.code === "Enter" || e.code === "Space") { e.preventDefault(); this.game.selectMode(this._modeKeys[this._selectedModeIndex]); }
    };
    window.addEventListener("keydown", this._modeSelectHandler);
  }

  _selectModeIndex(idx) {
    this._selectedModeIndex = idx;
    this._modeButtons.forEach((btn, i) => {
      btn.background = i === idx ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)";
      btn.thickness = i === idx ? 2 : 1;
      btn.color = i === idx ? "#FFD700" : "#555555";
    });
  }

  hideModeSelectScreen() {
    if (this._modeSelectHandler) {
      window.removeEventListener("keydown", this._modeSelectHandler);
      this._modeSelectHandler = null;
    }
    if (this.modeSelectPanel) {
      this.gui.removeControl(this.modeSelectPanel);
      this.modeSelectPanel.dispose();
      this.modeSelectPanel = null;
    }
    this._modeButtons = [];
  }

  // ========== GAME HUD ==========
  showGameHUD() {
    this.gameHUDPanel = new Rectangle("gameHUD");
    this.gameHUDPanel.width = "100%";
    this.gameHUDPanel.height = "100%";
    this.gameHUDPanel.thickness = 0;
    this.gameHUDPanel.isPointerBlocker = false;
    this.gui.addControl(this.gameHUDPanel);

    // Health bar
    const healthContainer = new Rectangle("healthContainer");
    healthContainer.width = "200px";
    healthContainer.height = "26px";
    healthContainer.left = "15px";
    healthContainer.top = "15px";
    healthContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    healthContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    healthContainer.background = "rgba(0, 0, 0, 0.6)";
    healthContainer.thickness = 2;
    healthContainer.color = "#444444";
    healthContainer.cornerRadius = 4;
    this.gameHUDPanel.addControl(healthContainer);

    this.healthBar = new Rectangle("healthBar");
    this.healthBar.width = "196px";
    this.healthBar.height = "22px";
    this.healthBar.background = "#44FF44";
    this.healthBar.thickness = 0;
    this.healthBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.healthBar.left = "2px";
    healthContainer.addControl(this.healthBar);

    this.healthText = new TextBlock("healthText", "100 / 100");
    this.healthText.color = "#FFFFFF";
    this.healthText.fontSize = 12;
    this.healthText.fontFamily = "monospace";
    this.healthText.fontWeight = "bold";
    this.healthText.shadowColor = "#000000";
    this.healthText.shadowOffsetX = 1;
    this.healthText.shadowOffsetY = 1;
    healthContainer.addControl(this.healthText);

    // Mode info (top right)
    this.modeInfoText = new TextBlock("modeInfo", "");
    this.modeInfoText.color = "#FFD700";
    this.modeInfoText.fontSize = 14;
    this.modeInfoText.fontFamily = "monospace";
    this.modeInfoText.fontWeight = "bold";
    this.modeInfoText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.modeInfoText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.modeInfoText.paddingRight = "15px";
    this.modeInfoText.paddingTop = "15px";
    this.modeInfoText.lineSpacing = "3px";
    this.modeInfoText.shadowColor = "#000000";
    this.modeInfoText.shadowOffsetX = 1;
    this.modeInfoText.shadowOffsetY = 1;
    this.gameHUDPanel.addControl(this.modeInfoText);

    // Pause button (top center - works on both mobile and desktop)
    const pauseBtn = Button.CreateSimpleButton("pauseBtn", "| |");
    pauseBtn.width = "40px";
    pauseBtn.height = "40px";
    pauseBtn.top = "10px";
    pauseBtn.color = "#FFFFFF";
    pauseBtn.background = "rgba(0,0,0,0.4)";
    pauseBtn.thickness = 1;
    pauseBtn.cornerRadius = 6;
    pauseBtn.fontSize = 18;
    pauseBtn.fontFamily = "monospace";
    pauseBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    pauseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    pauseBtn.onPointerClickObservable.add(() => {
      this.game.input.onTouchPause();
    });
    this.gameHUDPanel.addControl(pauseBtn);

    // Crosshair (desktop only)
    const isMobile = this.game.input && this.game.input.isMobile;
    if (!isMobile) {
      this._createCrosshair();
    }

    // Mobile touch buttons
    if (isMobile) {
      this._createMobileTouchControls();
    }

    // Objective text
    let objectiveStr = "OBJECTIVE: Eliminate all hostiles";
    if (this.game.gameMode === GameMode.SURVIVAL) objectiveStr = "SURVIVAL: Survive as many waves as possible!";
    else if (this.game.gameMode === GameMode.TIME_ATTACK) objectiveStr = "TIME ATTACK: Eliminate all before time runs out!";

    const objective = new TextBlock("objective", objectiveStr);
    objective.color = "#FFD700";
    objective.fontSize = 13;
    objective.fontFamily = "monospace";
    objective.top = "55px";
    objective.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    objective.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.gameHUDPanel.addControl(objective);

    setTimeout(() => {
      if (objective && !objective.isDisposed) {
        let alpha = 1;
        const fadeInt = setInterval(() => {
          alpha -= 0.02;
          objective.alpha = Math.max(0, alpha);
          if (alpha <= 0) clearInterval(fadeInt);
        }, 30);
      }
    }, 5000);
  }

  _createCrosshair() {
    const dot = new Ellipse("crosshairDot");
    dot.width = "6px";
    dot.height = "6px";
    dot.background = "rgba(255, 255, 255, 0.8)";
    dot.thickness = 0;
    this.gameHUDPanel.addControl(dot);

    [
      { top: "-15px", left: "0px", width: "2px", height: "10px" },
      { top: "15px", left: "0px", width: "2px", height: "10px" },
      { top: "0px", left: "-15px", width: "10px", height: "2px" },
      { top: "0px", left: "15px", width: "10px", height: "2px" },
    ].forEach((cfg, i) => {
      const line = new Rectangle(`crosshairLine${i}`);
      line.width = cfg.width;
      line.height = cfg.height;
      line.top = cfg.top;
      line.left = cfg.left;
      line.background = "rgba(255, 255, 255, 0.6)";
      line.thickness = 0;
      this.gameHUDPanel.addControl(line);
    });
  }

  _createMobileTouchControls() {
    // Joystick visual (left side - visual indicator ring)
    const joyBase = new Ellipse("joyBase");
    joyBase.width = "120px";
    joyBase.height = "120px";
    joyBase.left = "80px";
    joyBase.top = "-80px";
    joyBase.background = "rgba(255,255,255,0.08)";
    joyBase.color = "rgba(255,255,255,0.2)";
    joyBase.thickness = 2;
    joyBase.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    joyBase.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    joyBase.isPointerBlocker = false;
    this.gameHUDPanel.addControl(joyBase);

    const joyLabel = new TextBlock("joyLabel", "MOVE");
    joyLabel.color = "rgba(255,255,255,0.3)";
    joyLabel.fontSize = 12;
    joyLabel.fontFamily = "monospace";
    joyBase.addControl(joyLabel);

    // Right side action buttons
    const btnSize = "60px";
    const btnAlpha = "rgba(255,255,255,0.15)";

    // Shoot button (large, bottom right)
    const shootBtn = Button.CreateSimpleButton("shootBtn", "FIRE");
    shootBtn.width = "70px";
    shootBtn.height = "70px";
    shootBtn.left = "-90px";
    shootBtn.top = "-90px";
    shootBtn.color = "#FF4444";
    shootBtn.background = "rgba(255,60,60,0.2)";
    shootBtn.thickness = 2;
    shootBtn.cornerRadius = 35;
    shootBtn.fontSize = 14;
    shootBtn.fontWeight = "bold";
    shootBtn.fontFamily = "monospace";
    shootBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    shootBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    shootBtn.onPointerDownObservable.add(() => { this.game.input.setTouchShootHeld(true); });
    shootBtn.onPointerUpObservable.add(() => { this.game.input.setTouchShootHeld(false); });
    this.gameHUDPanel.addControl(shootBtn);

    // Jump button
    const jumpBtn = Button.CreateSimpleButton("jumpBtn", "JUMP");
    jumpBtn.width = btnSize;
    jumpBtn.height = btnSize;
    jumpBtn.left = "-170px";
    jumpBtn.top = "-70px";
    jumpBtn.color = "#44FF44";
    jumpBtn.background = "rgba(60,255,60,0.15)";
    jumpBtn.thickness = 2;
    jumpBtn.cornerRadius = 30;
    jumpBtn.fontSize = 11;
    jumpBtn.fontWeight = "bold";
    jumpBtn.fontFamily = "monospace";
    jumpBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    jumpBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    jumpBtn.onPointerClickObservable.add(() => { this.game.input.onTouchJump(); });
    this.gameHUDPanel.addControl(jumpBtn);

    // Melee button
    const meleeBtn = Button.CreateSimpleButton("meleeBtn", "MELEE");
    meleeBtn.width = btnSize;
    meleeBtn.height = btnSize;
    meleeBtn.left = "-90px";
    meleeBtn.top = "-170px";
    meleeBtn.color = "#FFAA00";
    meleeBtn.background = "rgba(255,170,0,0.15)";
    meleeBtn.thickness = 2;
    meleeBtn.cornerRadius = 30;
    meleeBtn.fontSize = 10;
    meleeBtn.fontWeight = "bold";
    meleeBtn.fontFamily = "monospace";
    meleeBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    meleeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    meleeBtn.onPointerClickObservable.add(() => { this.game.input.onTouchMelee(); });
    this.gameHUDPanel.addControl(meleeBtn);

    // Sprint toggle
    const sprintBtn = Button.CreateSimpleButton("sprintBtn", "RUN");
    sprintBtn.width = "55px";
    sprintBtn.height = "55px";
    sprintBtn.left = "-170px";
    sprintBtn.top = "-145px";
    sprintBtn.color = "#44AAFF";
    sprintBtn.background = "rgba(60,170,255,0.15)";
    sprintBtn.thickness = 2;
    sprintBtn.cornerRadius = 28;
    sprintBtn.fontSize = 10;
    sprintBtn.fontWeight = "bold";
    sprintBtn.fontFamily = "monospace";
    sprintBtn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    sprintBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    let sprinting = false;
    sprintBtn.onPointerClickObservable.add(() => {
      sprinting = !sprinting;
      this.game.input.setTouchSprint(sprinting);
      sprintBtn.background = sprinting ? "rgba(60,170,255,0.4)" : "rgba(60,170,255,0.15)";
    });
    this.gameHUDPanel.addControl(sprintBtn);

    // Swipe hint
    const swipeHint = new TextBlock("swipeHint", "Swipe up on left = Jump");
    swipeHint.color = "rgba(255,255,255,0.25)";
    swipeHint.fontSize = 10;
    swipeHint.fontFamily = "monospace";
    swipeHint.left = "80px";
    swipeHint.top = "-20px";
    swipeHint.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    swipeHint.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.gameHUDPanel.addControl(swipeHint);
  }

  hideGameHUD() {
    if (this.gameHUDPanel) {
      this.gui.removeControl(this.gameHUDPanel);
      this.gameHUDPanel.dispose();
      this.gameHUDPanel = null;
      this.healthBar = null;
      this.healthText = null;
      this.modeInfoText = null;
    }
  }

  updateHealthBar(current, max) {
    if (!this.healthBar || !this.healthText) return;
    const ratio = Math.max(0, current / max);
    this.healthBar.width = `${ratio * 196}px`;
    this.healthText.text = `${Math.ceil(current)} / ${max}`;
    if (ratio > 0.6) this.healthBar.background = "#44FF44";
    else if (ratio > 0.3) this.healthBar.background = "#FFDD44";
    else this.healthBar.background = "#FF4444";
  }

  updateModeInfo(game) {
    if (!this.modeInfoText) return;
    if (game.gameMode === GameMode.MISSION) {
      const alive = game.enemies.filter((e) => !e.isDead).length;
      const bossAlive = game.boss && !game.boss.isDead ? 1 : 0;
      this.modeInfoText.text = `MISSION\nEnemies: ${alive}\nBoss: ${bossAlive ? "ALIVE" : "DEAD"}`;
    } else if (game.gameMode === GameMode.SURVIVAL) {
      this.modeInfoText.text = `SURVIVAL\nWave: ${game.survivalWave}\nKills: ${game.survivalKills}\nAlive: ${game.enemies.filter((e) => !e.isDead).length}`;
      this.modeInfoText.color = "#FF8844";
    } else if (game.gameMode === GameMode.TIME_ATTACK) {
      const mins = Math.floor(game.timeAttackTimer / 60);
      const secs = Math.floor(game.timeAttackTimer % 60);
      const alive = game.enemies.filter((e) => !e.isDead).length;
      const bossAlive = game.boss && !game.boss.isDead ? 1 : 0;
      this.modeInfoText.text = `TIME ATTACK\nTime: ${mins}:${secs.toString().padStart(2, "0")}\nLeft: ${alive + bossAlive}`;
      this.modeInfoText.color = game.timeAttackTimer < 30 ? "#FF3333" : "#44AAFF";
    }
  }

  // ========== PAUSE SCREEN ==========
  showPauseScreen() {
    this.pausePanel = new Rectangle("pausePanel");
    this.pausePanel.width = "100%";
    this.pausePanel.height = "100%";
    this.pausePanel.background = "rgba(0, 0, 0, 0.75)";
    this.pausePanel.thickness = 0;
    this.pausePanel.isPointerBlocker = true;
    this.gui.addControl(this.pausePanel);

    const title = new TextBlock("pauseTitle", "PAUSED");
    title.color = "#FFD700";
    title.fontSize = 56;
    title.fontFamily = "monospace";
    title.fontWeight = "bold";
    title.top = "-220px";
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    title.shadowColor = "#886600";
    title.shadowOffsetX = 2;
    title.shadowOffsetY = 2;
    this.pausePanel.addControl(title);

    // Tab system for instructions
    this._pauseTabIndex = 0;
    this._pauseTabContents = [];
    this._pauseTabButtons = [];

    const tabBar = new StackPanel("tabBar");
    tabBar.isVertical = false;
    tabBar.height = "40px";
    tabBar.top = "-155px";
    tabBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    tabBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.pausePanel.addControl(tabBar);

    const isMobile = this.game.input && this.game.input.isMobile;
    const tabNames = ["CONTROLS", "MISSION", "SURVIVAL", "TIME ATTACK"];

    tabNames.forEach((name, i) => {
      const tabBtn = Button.CreateSimpleButton(`pauseTab${i}`, name);
      tabBtn.width = "130px";
      tabBtn.height = "35px";
      tabBtn.color = i === 0 ? "#FFD700" : "#888888";
      tabBtn.background = i === 0 ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)";
      tabBtn.thickness = i === 0 ? 2 : 1;
      tabBtn.cornerRadius = 4;
      tabBtn.fontSize = 11;
      tabBtn.fontFamily = "monospace";
      tabBtn.fontWeight = "bold";
      tabBtn.onPointerClickObservable.add(() => { this._switchPauseTab(i); });
      tabBar.addControl(tabBtn);
      this._pauseTabButtons.push(tabBtn);
    });

    // Content area
    const contentArea = new Rectangle("pauseContent");
    contentArea.width = "520px";
    contentArea.height = "280px";
    contentArea.top = "10px";
    contentArea.background = "rgba(0,0,0,0.5)";
    contentArea.thickness = 1;
    contentArea.color = "#444444";
    contentArea.cornerRadius = 8;
    contentArea.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.pausePanel.addControl(contentArea);

    // Tab contents
    const controlsDesktop =
      "MOVEMENT\n" +
      "  W/A/S/D or Arrow Keys ........ Move\n" +
      "  SPACE ......................... Jump\n" +
      "  SHIFT ......................... Sprint\n\n" +
      "COMBAT\n" +
      "  Left Mouse (hold) ............ Shoot\n" +
      "  Right Mouse / F .............. Melee\n" +
      "  Mouse ........................ Aim Camera\n\n" +
      "SYSTEM\n" +
      "  P or ESC ..................... Pause/Resume\n" +
      "  ESC (on Game Over/Victory) ... Return to Title";

    const controlsMobile =
      "MOVEMENT\n" +
      "  Left Side Touch+Drag ......... Move Joystick\n" +
      "  Swipe Up (left side) ......... Jump\n" +
      "  JUMP Button .................. Jump\n" +
      "  RUN Button ................... Toggle Sprint\n\n" +
      "COMBAT\n" +
      "  FIRE Button (hold) ........... Shoot\n" +
      "  MELEE Button ................. Knife Attack\n" +
      "  Right Side Touch+Drag ........ Aim Camera\n\n" +
      "SYSTEM\n" +
      "  Pause Button (top center) .... Pause/Resume";

    const controlsText = isMobile ? controlsMobile : controlsDesktop;

    const missionText =
      "MISSION MODE\n\n" +
      "Objective: Eliminate all enemies and defeat\n" +
      "the Samurai Boss to complete the mission.\n\n" +
      "  - 4 Masked Militant soldiers patrol the area\n" +
      "  - 1 Japanese Samurai Boss guards the zone\n" +
      "  - Collect Medical Kits to restore 50 HP\n" +
      "  - Boss enrages at 50% HP (faster + stronger)\n" +
      "  - Eliminate ALL enemies to win\n\n" +
      "Tips: Use cover and platforms for advantage.\n" +
      "Melee does 40 damage with knockback!";

    const survivalText =
      "SURVIVAL MODE\n\n" +
      "Objective: Survive as many waves as possible.\n" +
      "Each wave brings more and tougher enemies!\n\n" +
      "  - Enemies spawn in waves of 3+ (grows each wave)\n" +
      "  - Enemy HP increases +10 per wave\n" +
      "  - Enemy speed increases each wave (max 8)\n" +
      "  - Boss spawns every 3 waves (grows stronger)\n" +
      "  - Medical Kit spawns each wave\n" +
      "  - Your score = Wave count + Total kills\n\n" +
      "Tips: Keep moving! Don't get surrounded.\n" +
      "Prioritize medkits between waves.";

    const timeAttackText =
      "TIME ATTACK MODE\n\n" +
      "Objective: Eliminate all 8 soldiers and the\n" +
      "Boss before the 2-minute timer expires!\n\n" +
      "  - 8 Masked Militant soldiers spread across map\n" +
      "  - 1 Japanese Samurai Boss\n" +
      "  - 4 Medical Kits placed around the arena\n" +
      "  - Timer counts down from 2:00\n" +
      "  - Timer turns RED under 30 seconds\n" +
      "  - Kill ALL enemies before time runs out to win\n\n" +
      "Tips: Sprint constantly! Prioritize grouped\n" +
      "enemies. Use melee for quick kills up close.";

    const tabContents = [controlsText, missionText, survivalText, timeAttackText];

    tabContents.forEach((text, i) => {
      const tb = new TextBlock(`pauseTabContent${i}`, text);
      tb.color = "#CCCCCC";
      tb.fontSize = 11;
      tb.fontFamily = "monospace";
      tb.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      tb.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      tb.paddingLeft = "20px";
      tb.paddingTop = "15px";
      tb.paddingRight = "20px";
      tb.lineSpacing = "2px";
      tb.isVisible = i === 0;
      contentArea.addControl(tb);
      this._pauseTabContents.push(tb);
    });

    // Resume button
    const resumeBtn = Button.CreateSimpleButton("resumeBtn", "[ RESUME GAME ]");
    resumeBtn.width = "200px";
    resumeBtn.height = "40px";
    resumeBtn.top = "190px";
    resumeBtn.color = "#44FF44";
    resumeBtn.background = "rgba(60,255,60,0.1)";
    resumeBtn.thickness = 2;
    resumeBtn.cornerRadius = 6;
    resumeBtn.fontSize = 16;
    resumeBtn.fontFamily = "monospace";
    resumeBtn.fontWeight = "bold";
    resumeBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    resumeBtn.onPointerClickObservable.add(() => { this.game.togglePause(); });
    this.pausePanel.addControl(resumeBtn);

    // Quit button
    const quitBtn = Button.CreateSimpleButton("quitBtn", "QUIT TO TITLE");
    quitBtn.width = "160px";
    quitBtn.height = "32px";
    quitBtn.top = "235px";
    quitBtn.color = "#FF6666";
    quitBtn.background = "rgba(255,60,60,0.1)";
    quitBtn.thickness = 1;
    quitBtn.cornerRadius = 4;
    quitBtn.fontSize = 13;
    quitBtn.fontFamily = "monospace";
    quitBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    quitBtn.onPointerClickObservable.add(() => { this.game.returnToTitle(); });
    this.pausePanel.addControl(quitBtn);

    const hint = new TextBlock("pauseHint", isMobile ? "Tap RESUME or Pause button to continue" : "Press P or ESC to resume");
    hint.color = "#555555";
    hint.fontSize = 12;
    hint.fontFamily = "monospace";
    hint.top = "270px";
    hint.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    hint.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.pausePanel.addControl(hint);
  }

  _switchPauseTab(idx) {
    this._pauseTabIndex = idx;
    this._pauseTabContents.forEach((tb, i) => { tb.isVisible = i === idx; });
    this._pauseTabButtons.forEach((btn, i) => {
      btn.color = i === idx ? "#FFD700" : "#888888";
      btn.background = i === idx ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.05)";
      btn.thickness = i === idx ? 2 : 1;
    });
  }

  hidePauseScreen() {
    if (this.pausePanel) {
      this.gui.removeControl(this.pausePanel);
      this.pausePanel.dispose();
      this.pausePanel = null;
    }
    this._pauseTabContents = [];
    this._pauseTabButtons = [];
  }

  // ========== GAME OVER SCREEN ==========
  showGameOverScreen() {
    this.gameOverPanel = new Rectangle("gameOverPanel");
    this.gameOverPanel.width = "100%";
    this.gameOverPanel.height = "100%";
    this.gameOverPanel.background = "rgba(0, 0, 0, 0.8)";
    this.gameOverPanel.thickness = 0;
    this.gui.addControl(this.gameOverPanel);

    const title = new TextBlock("goTitle", "GAME OVER");
    title.color = "#FF3333";
    title.fontSize = 64;
    title.fontFamily = "monospace";
    title.fontWeight = "bold";
    title.top = "-100px";
    title.shadowColor = "#880000";
    title.shadowOffsetX = 4;
    title.shadowOffsetY = 4;
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gameOverPanel.addControl(title);

    let statsStr = "Mission Failed, Soldier.";
    if (this.game.gameMode === GameMode.SURVIVAL) {
      statsStr = `Survived ${this.game.survivalWave} wave${this.game.survivalWave !== 1 ? "s" : ""}!\nTotal Kills: ${this.game.survivalKills}`;
    } else if (this.game.gameMode === GameMode.TIME_ATTACK) {
      statsStr = `Time expired! Kills: ${this.game.timeAttackKills}`;
    }

    const subtitle = new TextBlock("goSubtitle", statsStr);
    subtitle.color = "#AAAAAA";
    subtitle.fontSize = 20;
    subtitle.fontFamily = "monospace";
    subtitle.top = "-10px";
    subtitle.lineSpacing = "8px";
    subtitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    subtitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.gameOverPanel.addControl(subtitle);

    const restart = Button.CreateSimpleButton("goRestart", "[ TAP OR PRESS ENTER TO RETRY ]");
    restart.width = "380px";
    restart.height = "40px";
    restart.top = "60px";
    restart.color = "#FFFFFF";
    restart.background = "rgba(255,255,255,0.05)";
    restart.thickness = 0;
    restart.fontSize = 18;
    restart.fontFamily = "monospace";
    restart.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    restart.onPointerClickObservable.add(() => { this.game.restartGame(); });
    this.gameOverPanel.addControl(restart);

    const backBtn = Button.CreateSimpleButton("goBack", "[ TITLE SCREEN ]");
    backBtn.width = "200px";
    backBtn.height = "32px";
    backBtn.top = "110px";
    backBtn.color = "#888888";
    backBtn.background = "rgba(255,255,255,0.03)";
    backBtn.thickness = 0;
    backBtn.fontSize = 14;
    backBtn.fontFamily = "monospace";
    backBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    backBtn.onPointerClickObservable.add(() => { this.game.returnToTitle(); });
    this.gameOverPanel.addControl(backBtn);

    this._goBlinkInterval = setInterval(() => {
      restart.color = restart.color === "#FFFFFF" ? "#666666" : "#FFFFFF";
    }, 500);
  }

  hideGameOverScreen() {
    if (this._goBlinkInterval) { clearInterval(this._goBlinkInterval); this._goBlinkInterval = null; }
    if (this.gameOverPanel) {
      this.gui.removeControl(this.gameOverPanel);
      this.gameOverPanel.dispose();
      this.gameOverPanel = null;
    }
  }

  // ========== VICTORY SCREEN ==========
  showVictoryScreen() {
    this.victoryPanel = new Rectangle("victoryPanel");
    this.victoryPanel.width = "100%";
    this.victoryPanel.height = "100%";
    this.victoryPanel.background = "rgba(0, 20, 0, 0.85)";
    this.victoryPanel.thickness = 0;
    this.gui.addControl(this.victoryPanel);

    let titleStr = "MISSION COMPLETE!";
    let subtitleStr = "Congratulations, Soldier!\nAll enemies eliminated!";
    if (this.game.gameMode === GameMode.TIME_ATTACK) {
      const elapsed = this.game.timeAttackLimit - this.game.timeAttackTimer;
      const mins = Math.floor(elapsed / 60);
      const secs = Math.floor(elapsed % 60);
      titleStr = "TIME ATTACK COMPLETE!";
      subtitleStr = `All hostiles eliminated!\nTime: ${mins}:${secs.toString().padStart(2, "0")}`;
    }

    const title = new TextBlock("vicTitle", titleStr);
    title.color = "#FFD700";
    title.fontSize = 52;
    title.fontFamily = "monospace";
    title.fontWeight = "bold";
    title.top = "-80px";
    title.shadowColor = "#886600";
    title.shadowOffsetX = 3;
    title.shadowOffsetY = 3;
    title.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    title.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.victoryPanel.addControl(title);

    const subtitle = new TextBlock("vicSubtitle", subtitleStr);
    subtitle.color = "#88FF88";
    subtitle.fontSize = 20;
    subtitle.fontFamily = "monospace";
    subtitle.top = "0px";
    subtitle.lineSpacing = "8px";
    subtitle.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    subtitle.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    this.victoryPanel.addControl(subtitle);

    const restart = Button.CreateSimpleButton("vicRestart", "[ TAP OR PRESS ENTER ]");
    restart.width = "300px";
    restart.height = "40px";
    restart.top = "80px";
    restart.color = "#FFFFFF";
    restart.background = "rgba(255,255,255,0.05)";
    restart.thickness = 0;
    restart.fontSize = 18;
    restart.fontFamily = "monospace";
    restart.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    restart.onPointerClickObservable.add(() => { this.game.returnToTitle(); });
    this.victoryPanel.addControl(restart);

    this._vicBlinkInterval = setInterval(() => {
      restart.color = restart.color === "#FFFFFF" ? "#666666" : "#FFFFFF";
    }, 500);
  }

  hideVictoryScreen() {
    if (this._vicBlinkInterval) { clearInterval(this._vicBlinkInterval); this._vicBlinkInterval = null; }
    if (this.victoryPanel) {
      this.gui.removeControl(this.victoryPanel);
      this.victoryPanel.dispose();
      this.victoryPanel = null;
    }
  }
}
