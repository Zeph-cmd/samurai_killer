import Phaser from 'phaser'
import { BaseLevelScene } from './BaseLevelScene.js'
import gameConfig from '../gameConfig.json'

export class VictoryUIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "VictoryUIScene",
    })
  }

  init(data) {
    this.currentLevelKey = data.currentLevelKey
  }


  create() {
    this.createOverlay()
    this.createVictoryText()
    this.createNextLevelInstructions()
    this.setupInputs()
  }

  createOverlay() {
    // Create semi-transparent green overlay
    const graphics = this.add.graphics()
    graphics.fillStyle(0x00ff00, 0.3)
    graphics.fillRect(0, 0, gameConfig.screenSize.width.value, gameConfig.screenSize.height.value)
    graphics.setScrollFactor(0)
  }

  createVictoryText() {
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value

    // LEVEL CLEAR text
    this.victoryText = this.add.text(screenWidth / 2, screenHeight * 0.4, 'LEVEL CLEAR!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '56px',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    })
    this.victoryText.setOrigin(0.5, 0.5)
    this.victoryText.setScrollFactor(0)

    // Add pulse animation
    this.tweens.add({
      targets: this.victoryText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  createNextLevelInstructions() {
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value

    // Game completion instructions
    this.nextLevelText = this.add.text(screenWidth / 2, screenHeight * 0.65, 'GAME COMPLETE! PRESS ENTER TO CONTINUE', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    })
    this.nextLevelText.setOrigin(0.5, 0.5)
    this.nextLevelText.setScrollFactor(0)

    // Add blinking animation
    this.tweens.add({
      targets: this.nextLevelText,
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
      this.goToNextLevel()
    })

    this.input.keyboard.on('keydown-SPACE', () => {
      this.goToNextLevel()
    })

    // Listen for mouse clicks
    this.input.on('pointerdown', () => {
      this.goToNextLevel()
    })
  }

  goToNextLevel() {
    // Play selection sound effect
    this.sound.play("ui_select", { volume: 0.3 })

    // Stop other scenes
    this.scene.stop("UIScene")
    this.scene.stop(this.currentLevelKey)

    // Game complete, launch game complete UI scene
    this.scene.start("GameCompleteUIScene", { currentLevelKey: this.currentLevelKey })

    // Stop self
    this.scene.stop()
  }
}