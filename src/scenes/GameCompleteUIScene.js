import Phaser from 'phaser'
import gameConfig from '../gameConfig.json'

export class GameCompleteUIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "GameCompleteUIScene",
    })
  }

  init(data) {
    this.currentLevelKey = data.currentLevelKey
  }


  create() {
    this.createOverlay()
    this.createCompleteText()
    this.createReturnInstructions()
    this.setupInputs()
  }

  createOverlay() {
    // Create golden gradient overlay
    const graphics = this.add.graphics()
    graphics.fillGradientStyle(0xffd700, 0xffd700, 0xffa500, 0xffa500, 0.5)
    graphics.fillRect(0, 0, gameConfig.screenSize.width.value, gameConfig.screenSize.height.value)
    graphics.setScrollFactor(0)
  }

  createCompleteText() {
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value

    // MISSION COMPLETE text
    this.completeText = this.add.text(screenWidth / 2, screenHeight * 0.3, 'MISSION\nCOMPLETE!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '64px',
      fill: '#ffd700',
      stroke: '#000000',
      strokeThickness: 8,
      align: 'center'
    })
    this.completeText.setOrigin(0.5, 0.5)
    this.completeText.setScrollFactor(0)

    // Congratulations text
    this.congratsText = this.add.text(screenWidth / 2, screenHeight * 0.5, 'Congratulations, Soldier!\nAll enemies eliminated!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '24px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    })
    this.congratsText.setOrigin(0.5, 0.5)
    this.congratsText.setScrollFactor(0)

    // Add pulse animation
    this.tweens.add({
      targets: this.completeText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  createReturnInstructions() {
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value

    // Return to main menu instructions
    this.returnText = this.add.text(screenWidth / 2, screenHeight * 0.75, 'PRESS ENTER TO RETURN TO MENU', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '20px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    })
    this.returnText.setOrigin(0.5, 0.5)
    this.returnText.setScrollFactor(0)

    // Add blinking animation
    this.tweens.add({
      targets: this.returnText,
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
      this.returnToMenu()
    })

    this.input.keyboard.on('keydown-SPACE', () => {
      this.returnToMenu()
    })

    // Listen for mouse clicks
    this.input.on('pointerdown', () => {
      this.returnToMenu()
    })
  }

  returnToMenu() {
    // Play selection sound effect
    this.sound.play("ui_select", { volume: 0.3 })

    // Stop other scenes
    this.scene.stop("UIScene")
    this.scene.stop(this.currentLevelKey)

    // Return to title screen
    this.scene.start("TitleScreen")

    // Stop self
    this.scene.stop()
  }
}