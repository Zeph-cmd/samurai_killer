import Phaser from 'phaser'
import gameConfig from '../gameConfig.json'

export class UIScene extends Phaser.Scene {
  constructor() {
    super({
      key: "UIScene",
    })
  }

  init(data) {
    this.playerHealth = data.playerHealth || 100
  }

  preload() {
    // Load pixel font
    this.load.font('RetroPixel', 'https://retro-pixel-font.takwolf.com/arcade/retro-pixel-arcade.otf.woff2?r=0.8454860941416305', 'opentype')
  }

  create() {
    this.createHealthBar()
    this.createControlInstructions()

    // Listen for health update events from game scene
    this.scene.get('Level1Scene').events.on('playerHealthChanged', this.updateHealth, this)
  }

  createHealthBar() {
    const margin = 20
    const barWidth = 200
    const barHeight = 20

    // Create health bar background
    this.healthBarBg = this.add.graphics()
    this.healthBarBg.fillStyle(0x000000, 0.7)
    this.healthBarBg.fillRect(margin, margin, barWidth + 4, barHeight + 4)
    this.healthBarBg.setScrollFactor(0)

    // Create health bar
    this.healthBar = this.add.graphics()
    this.healthBar.setScrollFactor(0)

    // Health label
    this.healthLabel = this.add.text(margin, margin - 25, 'HEALTH', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    })
    this.healthLabel.setScrollFactor(0)

    // Initialize health display
    this.updateHealthBar(this.playerHealth)
  }

  createControlInstructions() {
    const screenWidth = gameConfig.screenSize.width.value
    const margin = 20

    // Control instructions
    const instructions = [
      'ARROW KEYS - Move',
      'J - Shoot',
      'K - Melee Attack',
      'UP - Jump'
    ]
    
    instructions.forEach((instruction, index) => {
      const text = this.add.text(screenWidth - margin, margin + (index * 25), instruction, {
        fontFamily: 'RetroPixel, monospace',
        fontSize: '14px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'right'
      })
      text.setOrigin(1, 0)
      text.setScrollFactor(0)
    })
  }

  updateHealth(healthPercentage) {
    this.playerHealth = healthPercentage
    this.updateHealthBar(healthPercentage)
  }

  updateHealthBar(healthPercentage) {
    const margin = 20
    const barWidth = 200
    const barHeight = 20
    
    this.healthBar.clear()

    // Health bar background (red)
    this.healthBar.fillStyle(0xff0000, 1)
    this.healthBar.fillRect(margin + 2, margin + 2, barWidth, barHeight)

    // Health bar foreground (green, based on health percentage)
    const currentWidth = (barWidth * healthPercentage) / 100
    const healthColor = healthPercentage > 60 ? 0x00ff00 : healthPercentage > 30 ? 0xffff00 : 0xff0000

    this.healthBar.fillStyle(healthColor, 1)
    this.healthBar.fillRect(margin + 2, margin + 2, currentWidth, barHeight)
  }

  update() {
    // UI scene update logic
    // Other UI elements can be updated here
  }
}