import Phaser from 'phaser'

export class DamageText extends Phaser.GameObjects.Text {
  constructor(scene, x, y, damage) {
    // Determine color and style based on damage value
    const style = DamageText.getStyleByDamage(damage)

    super(scene, x, y, damage.toString(), style)

    // Add to scene
    scene.add.existing(this)

    // Set initial properties
    this.setOrigin(0.5, 0.5)
    this.setDepth(1000) // Ensure displayed on top layer

    // Store damage value for animation effects
    this.damageValue = damage

    // Create pop-up animation
    this.createAnimation()
  }
  
  static getStyleByDamage(damage) {
    let color = '#ffffff'
    let fontSize = '24px'
    let strokeThickness = 3
    
    if (damage >= 2000) {
      // Ultra high damage - Red
      color = '#ff0000'
      fontSize = '36px'
      strokeThickness = 4
    } else if (damage >= 1000) {
      // High damage - Orange
      color = '#ff8800'
      fontSize = '32px'
      strokeThickness = 4
    } else if (damage >= 500) {
      // Medium damage - Yellow
      color = '#ffff00'
      fontSize = '28px'
      strokeThickness = 3
    } else if (damage >= 100) {
      // Low damage - Green
      color = '#00ff00'
      fontSize = '24px'
      strokeThickness = 3
    } else {
      // Very low damage - White
      color = '#ffffff'
      fontSize = '20px'
      strokeThickness = 2
    }
    
    return {
      fontFamily: 'RetroPixel, monospace',
      fontSize: fontSize,
      fill: color,
      stroke: '#000000',
      strokeThickness: strokeThickness,
      align: 'center'
    }
  }
  
  createAnimation() {
    // Initial scale animation
    this.setScale(0.5)

    // Pop-up animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        // Rise and fade out animation
        this.scene.tweens.add({
          targets: this,
          y: this.y - 80,
          alpha: 0,
          duration: 1500,
          ease: 'Power2.easeOut',
          onComplete: () => {
            this.destroy()
          }
        })
      }
    })

    // Add slight horizontal wobble effect
    this.scene.tweens.add({
      targets: this,
      x: this.x + Phaser.Math.Between(-10, 10),
      duration: 200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 3
    })

    // If high damage, add special effect
    if (this.damageValue >= 1000) {
      this.addSpecialEffect()
    }
  }
  
  addSpecialEffect() {
    // Add flash effect for high damage
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 100,
      ease: 'Power2.easeInOut',
      yoyo: true,
      repeat: 4
    })

    // Add color gradient effect
    const originalColor = this.style.color
    this.scene.tweens.add({
      targets: this,
      duration: 300,
      ease: 'Power2.easeInOut',
      onUpdate: (tween) => {
        const progress = tween.progress
        if (progress < 0.5) {
          this.setTint(0xffffff)
        } else {
          this.clearTint()
        }
      }
    })
  }

  // Static method to create critical hit effect
  static createCriticalHit(scene, x, y, damage) {
    const critText = new DamageText(scene, x, y - 20, damage)

    // Add "CRITICAL!" text
    const critLabel = scene.add.text(x, y - 50, 'CRITICAL!', {
      fontFamily: 'RetroPixel, monospace',
      fontSize: '16px',
      fill: '#ff0000',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    })
    critLabel.setOrigin(0.5, 0.5)
    critLabel.setDepth(999)

    // Critical hit label animation
    scene.tweens.add({
      targets: critLabel,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        scene.tweens.add({
          targets: critLabel,
          y: critLabel.y - 60,
          alpha: 0,
          duration: 1200,
          ease: 'Power2.easeOut',
          onComplete: () => {
            critLabel.destroy()
          }
        })
      }
    })

    return critText
  }
}