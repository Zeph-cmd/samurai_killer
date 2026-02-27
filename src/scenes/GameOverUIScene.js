import Phaser from 'phaser'
import gameConfig from '../gameConfig.json'

export class GameOverUIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "GameOverUIScene",
    })
  }

  init(data) {
    this.currentLevelKey = data.currentLevelKey
  }


  create() {
    // Play game over sound effect
    this.sound.play("game_over", { volume: 0.3 })

    this.createOverlay()
    this.createGameOverText()
    this.createRestartInstructions()
    this.setupInputs()
  }

  createOverlay() {
    // Create semi-transparent black overlay
    const graphics = this.add.graphics()
    graphics.fillStyle(0x000000, 0.8)
    graphics.fillRect(0, 0, gameConfig.screenSize.width.value, gameConfig.screenSize.height.value)
    graphics.setScrollFactor(0)
  }

  createGameOverText() {
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value

    // GAME OVER text
    this.gameOverText = this.add.text(screenWidth / 2, screenHeight * 0.4, 'GAME OVER', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '64px',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    })
    this.gameOverText.setOrigin(0.5, 0.5)
    this.gameOverText.setScrollFactor(0)

    // Add pulse animation
    this.tweens.add({
      targets: this.gameOverText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  createRestartInstructions() {
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value

    // Restart instructions
    this.restartText = this.add.text(screenWidth / 2, screenHeight * 0.65, 'PRESS ENTER TO RESTART', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    })
    this.restartText.setOrigin(0.5, 0.5)
    this.restartText.setScrollFactor(0)

    // Add blinking animation
    this.tweens.add({
      targets: this.restartText,
      alpha: 0.3,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  setupInputs() {
    // Listen for Enter key
    this.input.keyboard.on('keydown-ENTER', () => {
      this.restartLevel()
    })

    this.input.keyboard.on('keydown-SPACE', () => {
      this.restartLevel()
    })

    // Listen for mouse clicks
    this.input.on('pointerdown', () => {
      this.restartLevel()
    })
  }

  restartLevel() {
    // Play selection sound effect
    this.sound.play("ui_select", { volume: 0.3 })

    // Stop other scenes
    this.scene.stop("UIScene")
    this.scene.stop(this.currentLevelKey)

    // Restart current level
    this.scene.start(this.currentLevelKey)

    // Stop self
    this.scene.stop()
  }
}