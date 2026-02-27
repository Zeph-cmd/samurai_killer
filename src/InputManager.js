import { GameState } from "./Game.js";

export class InputManager {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;

    // Key states
    this.keys = {};
    this.keysJustPressed = {};
    this.mouseButtons = {};
    this.mouseJustClicked = {};

    // Mouse movement
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.mouseSensitivity = 0.002;
    this.isPointerLocked = false;

    // Touch / mobile state
    this.isMobile = this._detectMobile();
    this.touchJoystick = { active: false, id: null, startX: 0, startY: 0, dx: 0, dy: 0 };
    this.touchLook = { active: false, id: null, lastX: 0, lastY: 0 };
    this.touchShoot = false;
    this.touchJump = false;
    this.touchMelee = false;
    this.touchSprint = false;
    this.swipeUp = false;

    this._setupKeyboard();
    this._setupMouse();
    this._setupPointerLock();
    if (this.isMobile) {
      this._setupTouch();
    }
  }

  _detectMobile() {
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
  }

  _setupKeyboard() {
    window.addEventListener("keydown", (e) => {
      if (!this.keys[e.code]) {
        this.keysJustPressed[e.code] = true;
      }
      this.keys[e.code] = true;

      // Pause with P key
      if (e.code === "KeyP") {
        if (this.game.state === GameState.PLAYING || this.game.state === GameState.PAUSED) {
          e.preventDefault();
          this.game.togglePause();
          return;
        }
      }

      // Escape: unpause or return to title
      if (e.code === "Escape") {
        if (this.game.state === GameState.PAUSED) {
          this.game.togglePause();
          return;
        }
        if (this.game.state === GameState.GAME_OVER || this.game.state === GameState.VICTORY) {
          this.game.returnToTitle();
          return;
        }
        if (this.game.state === GameState.PLAYING) {
          e.preventDefault();
          this.game.togglePause();
          return;
        }
      }

      // Handle menu navigation
      if (e.code === "Enter" || e.code === "Space") {
        if (this.game.state === GameState.TITLE) {
          e.preventDefault();
          this.game.goToModeSelect();
        } else if (this.game.state === GameState.GAME_OVER) {
          e.preventDefault();
          this.game.restartGame();
        } else if (this.game.state === GameState.VICTORY) {
          e.preventDefault();
          this.game.returnToTitle();
        }
      }

      // Prevent defaults during gameplay
      if (this.game.state === GameState.PLAYING) {
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
          e.preventDefault();
        }
      }
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });
  }

  _setupMouse() {
    this.canvas.addEventListener("mousedown", (e) => {
      this.mouseButtons[e.button] = true;
      this.mouseJustClicked[e.button] = true;

      if (this.game.state === GameState.TITLE) {
        this.game.goToModeSelect();
      } else if (this.game.state === GameState.GAME_OVER) {
        this.game.restartGame();
      } else if (this.game.state === GameState.VICTORY) {
        this.game.returnToTitle();
      }
    });

    window.addEventListener("mouseup", (e) => {
      this.mouseButtons[e.button] = false;
    });

    document.addEventListener("mousemove", (e) => {
      if (this.isPointerLocked) {
        this.mouseDeltaX += e.movementX;
        this.mouseDeltaY += e.movementY;
      }
    });
  }

  _setupPointerLock() {
    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked = document.pointerLockElement === this.canvas;
    });
  }

  // ==================== TOUCH CONTROLS ====================
  _setupTouch() {
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        const x = touch.clientX;
        const y = touch.clientY;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Handle menu taps
        if (this.game.state === GameState.TITLE) {
          this.game.goToModeSelect();
          return;
        }
        if (this.game.state === GameState.GAME_OVER) {
          this.game.restartGame();
          return;
        }
        if (this.game.state === GameState.VICTORY) {
          this.game.returnToTitle();
          return;
        }

        // Left half = joystick
        if (x < w * 0.4) {
          this.touchJoystick.active = true;
          this.touchJoystick.id = touch.identifier;
          this.touchJoystick.startX = x;
          this.touchJoystick.startY = y;
          this.touchJoystick.dx = 0;
          this.touchJoystick.dy = 0;
        }
        // Right half = look (camera)
        else if (x > w * 0.6) {
          this.touchLook.active = true;
          this.touchLook.id = touch.identifier;
          this.touchLook.lastX = x;
          this.touchLook.lastY = y;
        }
      }
    }, { passive: false });

    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        // Joystick movement
        if (this.touchJoystick.active && touch.identifier === this.touchJoystick.id) {
          this.touchJoystick.dx = touch.clientX - this.touchJoystick.startX;
          this.touchJoystick.dy = touch.clientY - this.touchJoystick.startY;
        }
        // Look
        if (this.touchLook.active && touch.identifier === this.touchLook.id) {
          const dx = touch.clientX - this.touchLook.lastX;
          const dy = touch.clientY - this.touchLook.lastY;
          this.mouseDeltaX += dx * 1.5;
          this.mouseDeltaY += dy * 1.5;
          this.touchLook.lastX = touch.clientX;
          this.touchLook.lastY = touch.clientY;
        }
      }
    }, { passive: false });

    this.canvas.addEventListener("touchend", (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (this.touchJoystick.active && touch.identifier === this.touchJoystick.id) {
          // Detect swipe up for jump
          if (this.touchJoystick.dy < -50) {
            this.swipeUp = true;
          }
          this.touchJoystick.active = false;
          this.touchJoystick.dx = 0;
          this.touchJoystick.dy = 0;
        }
        if (this.touchLook.active && touch.identifier === this.touchLook.id) {
          this.touchLook.active = false;
        }
      }
    }, { passive: false });
  }

  requestPointerLock() {
    if (!this.isMobile) {
      this.canvas.requestPointerLock();
    }
  }

  releasePointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  // Called by touch UI buttons
  onTouchShoot() { this.touchShoot = true; }
  onTouchJump() { this.touchJump = true; }
  onTouchMelee() { this.touchMelee = true; }
  onTouchPause() {
    if (this.game.state === GameState.PLAYING || this.game.state === GameState.PAUSED) {
      this.game.togglePause();
    }
  }
  setTouchSprint(val) { this.touchSprint = val; }
  setTouchShootHeld(val) { this.touchShoot = val; }

  // Call at end of each frame
  endFrame() {
    this.keysJustPressed = {};
    this.mouseJustClicked = {};

    // Apply mouse/touch delta to camera
    if (this.isPointerLocked || this.isMobile) {
      this.game.cameraYaw += this.mouseDeltaX * this.mouseSensitivity;
      this.game.cameraPitch += this.mouseDeltaY * this.mouseSensitivity;
    }
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;

    // Reset touch one-shot inputs
    this.touchJump = false;
    this.touchMelee = false;
    this.swipeUp = false;
  }

  isKeyDown(code) { return !!this.keys[code]; }
  isKeyJustPressed(code) { return !!this.keysJustPressed[code]; }
  isMouseDown(button = 0) { return !!this.mouseButtons[button]; }
  isMouseJustClicked(button = 0) { return !!this.mouseJustClicked[button]; }

  // Movement helpers - combine keyboard + touch
  get moveForward() {
    return this.isKeyDown("KeyW") || this.isKeyDown("ArrowUp")
      || (this.touchJoystick.active && this.touchJoystick.dy < -15);
  }
  get moveBackward() {
    return this.isKeyDown("KeyS") || this.isKeyDown("ArrowDown")
      || (this.touchJoystick.active && this.touchJoystick.dy > 15);
  }
  get moveLeft() {
    return this.isKeyDown("KeyA") || this.isKeyDown("ArrowLeft")
      || (this.touchJoystick.active && this.touchJoystick.dx < -15);
  }
  get moveRight() {
    return this.isKeyDown("KeyD") || this.isKeyDown("ArrowRight")
      || (this.touchJoystick.active && this.touchJoystick.dx > 15);
  }
  get jump() {
    return this.isKeyJustPressed("Space") || this.touchJump || this.swipeUp;
  }
  get shoot() {
    return this.isMouseDown(0) || this.touchShoot;
  }
  get melee() {
    return this.isKeyJustPressed("KeyF") || this.isMouseJustClicked(2) || this.touchMelee;
  }
  get sprint() {
    return this.isKeyDown("ShiftLeft") || this.isKeyDown("ShiftRight") || this.touchSprint;
  }
}
