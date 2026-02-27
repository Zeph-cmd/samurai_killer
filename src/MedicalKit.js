import Phaser from 'phaser'

export class MedicalKit extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "medical_kit")

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Medical kit properties
    this.scene = scene
    this.healAmount = 50 // Healing amount
    this.isPickedUp = false

    // Set physics properties
    this.body.setAllowGravity(false) // Medical kit not affected by gravity
    this.body.setImmovable(true)

    // Set medical kit size - scale to appropriate size
    const targetHeight = 32 // Medical kit target height (pixels)
    this.medicalKitScale = targetHeight / 760 // Based on original asset height
    this.setScale(this.medicalKitScale)

    // Set collision box
    this.body.setSize(this.width * 0.8, this.height * 0.8)

    // Set origin
    this.setOrigin(0.5, 1.0) // Bottom center alignment

    // Add floating animation effect
    this.createFloatingAnimation()

    // Initialize pickup sound effect
    this.pickupSound = this.scene.sound.add("medical_pickup", { volume: 0.3 })
  }

  createFloatingAnimation() {
    // Up and down floating animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })

    // Slight scaling pulse
    this.scene.tweens.add({
      targets: this,
      scaleX: this.medicalKitScale * 1.1,
      scaleY: this.medicalKitScale * 1.1,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    })
  }

  // Picked up by player
  pickup(player) {
    if (this.isPickedUp) return

    this.isPickedUp = true

    // Play pickup sound effect
    this.pickupSound.play()

    // Player heals
    const healthBefore = player.health
    player.health = Math.min(player.maxHealth, player.health + this.healAmount)
    const actualHeal = player.health - healthBefore

    // Show healing effect text
    this.showHealText(actualHeal)

    // Create pickup effect
    this.createPickupEffect()

    // Remove medical kit
    this.destroy()
  }

  showHealText(healAmount) {
    // Create floating healing text
    const healText = this.scene.add.text(this.x, this.y - 30, `+${healAmount}`, {
      fontSize: '20px',
      fill: '#00ff00',
      stroke: '#000000',
      strokeThickness: 3,
      fontWeight: 'bold'
    })
    healText.setOrigin(0.5, 0.5)

    // Text floating animation
    this.scene.tweens.add({
      targets: healText,
      y: healText.y - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        healText.destroy()
      }
    })
  }

  createPickupEffect() {
    // Create flash effect
    const flash = this.scene.add.graphics()
    flash.fillStyle(0x00ff00, 0.5)
    flash.fillCircle(this.x, this.y - 16, 30)

    // Flash diffusion animation
    this.scene.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy()
      }
    })
  }

  update() {
    // Medical kit doesn't need special update logic
  }
}