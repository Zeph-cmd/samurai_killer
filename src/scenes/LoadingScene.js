import Phaser from 'phaser'
import gameConfig from '../gameConfig.json'

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({
      key: "LoadingScene",
    })
  }

  preload() {
    // Create loading progress bar
    this.createLoadingUI()

    // Initialize simulated loading progress
    this.simulatedProgress = 0
    this.isRealLoadingComplete = false

    // Load asset pack by type
    this.load.pack('assetPack', 'assets/asset-pack.json')

    // Listen for loading progress
    this.load.on('progress', this.onRealProgress, this)
    this.load.on('complete', this.onRealLoadComplete, this)

    // Start simulated loading progress
    this.startSimulatedProgress()
  }

  create() {
    // All resource loading completion handling will be done in loadComplete
  }

  createLoadingUI() {
    const screenWidth = gameConfig.screenSize.width.value
    const screenHeight = gameConfig.screenSize.height.value

    // Create gradient background
    const graphics = this.add.graphics()
    graphics.fillGradientStyle(0x000033, 0x000033, 0x000066, 0x000066, 1)
    graphics.fillRect(0, 0, screenWidth, screenHeight)

    // Game title (temporary text, since image is still loading)
    this.titleText = this.add.text(screenWidth / 2, screenHeight * 0.3, 'LOADING GAME...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0.5)

    // Add title text pulse animation
    this.tweens.add({
      targets: this.titleText,
      alpha: 0.6,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })

    // Progress bar background
    const barWidth = 400
    const barHeight = 20
    const barX = screenWidth / 2 - barWidth / 2
    const barY = screenHeight * 0.6

    this.progressBarBg = this.add.graphics()
    this.progressBarBg.fillStyle(0x222222, 0.8)
    this.progressBarBg.fillRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8)
    this.progressBarBg.lineStyle(2, 0x666666, 1)
    this.progressBarBg.strokeRect(barX, barY, barWidth, barHeight)

    // Progress bar
    this.progressBar = this.add.graphics()

    // Progress text
    this.progressText = this.add.text(screenWidth / 2, barY + 40, '0%', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5, 0.5)

    // Loading tip text
    this.loadingTips = this.add.text(screenWidth / 2, screenHeight * 0.8, 'Preparing your battlefield...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fill: '#cccccc',
      align: 'center'
    }).setOrigin(0.5, 0.5)

    // Add blinking animation to loading tip text
    this.tweens.add({
      targets: this.loadingTips,
      alpha: 0.4,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })

    // Store progress bar parameters for updating
    this.barX = barX
    this.barY = barY
    this.barWidth = barWidth
    this.barHeight = barHeight
  }

  updateProgress(value) {
    // Update progress bar
    this.progressBar.clear()
    this.progressBar.fillStyle(0x00ff00, 1)
    this.progressBar.fillRect(this.barX, this.barY, this.barWidth * value, this.barHeight)

    // Update progress text
    const percentage = Math.round(value * 100)
    this.progressText.setText(percentage + '%')

    // Update tip text based on progress
    const tips = [
      'Preparing your battlefield...',
      'Loading weapons and equipment...',
      'Initializing combat systems...',
      'Almost ready for battle!'
    ]

    const tipIndex = Math.floor(value * tips.length)
    if (tipIndex < tips.length) {
      this.loadingTips.setText(tips[tipIndex])
    }
  }

  startSimulatedProgress() {
    // Simulate loading progress to make loading look more realistic
    this.progressTimer = this.time.addEvent({
      delay: 80, // Update every 80ms
      callback: () => {
        if (this.simulatedProgress < 0.95) {
          // Use simulated progress for first 95%
          this.simulatedProgress += Math.random() * 0.02 + 0.005 // Random growth
          this.updateProgress(this.simulatedProgress)
        } else if (this.isRealLoadingComplete) {
          // After real loading completes, quickly go to 100%
          this.simulatedProgress = 1.0
          this.updateProgress(this.simulatedProgress)
          this.loadComplete()
          this.progressTimer.destroy()
        }
      },
      loop: true
    })
  }

  onRealProgress(value) {
    // Handle real loading progress completion
    // Don't update UI directly here, just mark real loading status
  }

  onRealLoadComplete() {
    // Mark real loading as complete
    this.isRealLoadingComplete = true
  }

  loadComplete() {
    // After loading completes, wait a short time then switch to title screen
    this.progressText.setText('100%')
    this.loadingTips.setText('Loading Complete!')

    // Add successful completion green flash effect
    this.tweens.add({
      targets: [this.progressBar, this.progressText],
      alpha: 0.3,
      duration: 200,
      ease: 'Power2',
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        // Auto jump to title screen after animation completes
        this.time.delayedCall(300, this.goToTitleScreen, [], this)
      }
    })

    // Title text stops pulse animation and fades out
    this.tweens.killTweensOf(this.titleText)
    this.tweens.add({
      targets: this.titleText,
      alpha: 0.8,
      duration: 800,
      ease: 'Power2'
    })
  }



  goToTitleScreen() {
    // Add fade out effect
    this.cameras.main.fadeOut(500, 0, 0, 0)

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('TitleScreen')
    })
  }
}