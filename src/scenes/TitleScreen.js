import Phaser from 'phaser'
import { BaseLevelScene } from './BaseLevelScene.js'
import gameConfig from '../gameConfig.json'

export class TitleScreen extends Phaser.Scene {
  constructor() {
    super({
      key: "TitleScreen",
    })
    this.isStarting = false
  }

  init() {
    this.isStarting = false
  }

  preload() {
    // Assets already preloaded in LoadingScene, no need to load again
  }

  create() {
    // Add entrance fade-in effect
    this.cameras.main.fadeIn(1000, 0, 0, 0)

    this.createBackground()
    this.createUI()
    this.setupInputs()
  }

  createBackground() {
    // Use level 1 background
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value

    // Calculate background scale ratio
    const bgScale = screenHeight / 1024
    const bgWidth = 1536 * bgScale
    const numBackgrounds = Math.ceil(screenWidth / bgWidth) + 1

    for (let i = 0; i < numBackgrounds; i++) {
      const bg = this.add.image(i * bgWidth, screenHeight / 2, "jungle_battlefield_bg")
      bg.setScale(bgScale)
      bg.setOrigin(0, 0.5)
    }
  }

  createUI() {
    this.createGameTitle()
    this.createPressEnterText()
  }

  createGameTitle() {
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value
    
    this.gameTitle = this.add.image(screenWidth / 2, screenHeight * 0.35, "game_title")
    
    const maxTitleWidth = screenWidth * 0.7
    const maxTitleHeight = screenHeight * 0.6

    if (this.gameTitle.width / this.gameTitle.height > maxTitleWidth / maxTitleHeight) {
        this.gameTitle.setScale(maxTitleWidth / this.gameTitle.width)
    } else {
        this.gameTitle.setScale(maxTitleHeight / this.gameTitle.height)
    }
    // Ensure top margin is 50px
    this.gameTitle.y = 50 + this.gameTitle.displayHeight / 2
  }

  createPressEnterText() {
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value

    // Create PRESS ENTER text (centered at bottom)
    this.pressEnterText = this.add.text(screenWidth / 2, screenHeight * 0.75, 'PRESS ENTER TO START GAME', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: Math.min(screenWidth / 20, 48) + 'px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 10,
      align: 'center'
    }).setOrigin(0.5, 0.5)

    // Ensure bottom margin is 80px
    this.pressEnterText.y = screenHeight - 80 - this.pressEnterText.displayHeight / 2

    // Add blinking animation
    this.tweens.add({
      targets: this.pressEnterText,
      alpha: 0.3,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }



  setupInputs() {
    // Listen for Enter key
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // Listen for keyboard input
    this.input.keyboard.on('keydown-ENTER', () => {
      this.startGame()
    })

    this.input.keyboard.on('keydown-SPACE', () => {
      this.startGame()
    })

    // Listen for mouse clicks
    this.input.on('pointerdown', () => {
      this.startGame()
    })
  }



  startGame() {
    if (this.isStarting) return
    
    this.isStarting = true
    
    // Start first level
    this.scene.start(BaseLevelScene.getFirstLevelScene())
  }

  update() {
    // Title screen doesn't need special update logic
  }
}