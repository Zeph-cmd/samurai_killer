import Phaser from 'phaser'

export class EnemyBullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, direction) {
    super(scene, x, y, "enemy_bullet")

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Bullet properties
    this.scene = scene
    this.direction = direction // 1 for right, -1 for left
    this.speed = 400
    this.damage = 15

    // Set physics properties
    this.body.setAllowGravity(false)
    this.body.setSize(8, 4) // Small collision box

    // Set bullet appearance - create simple yellow rectangle bullet
    this.setTint(0xffff00) // Yellow
    this.setScale(0.3) // Scale down bullet

    // Set initial velocity
    this.body.setVelocityX(this.speed * this.direction)

    // Set bullet lifetime
    this.lifeTime = 3000 // Auto-destroy after 3 seconds
    this.scene.time.delayedCall(this.lifeTime, () => {
      if (this.active) {
        this.destroy()
      }
    })
  }

  // Create bullet graphics (if no dedicated bullet assets)
  static preload(scene) {
    // Create a simple rectangle bullet graphic
    scene.add.graphics()
      .fillStyle(0xffff00)
      .fillRect(0, 0, 16, 4)
      .generateTexture('enemy_bullet', 16, 4)
      .destroy()
  }

  // Bullet hits target
  hit() {
    // Create hit effect
    this.createHitEffect()

    // Destroy bullet
    this.destroy()
  }

  createHitEffect() {
    // Create simple hit flash effect
    const flash = this.scene.add.graphics()
    flash.fillStyle(0xffff00, 0.8)
    flash.fillCircle(this.x, this.y, 10)

    // Flash animation
    this.scene.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        flash.destroy()
      }
    })
  }

  update() {
    // Check if bullet exceeds screen boundaries
    if (this.x < -50 || this.x > this.scene.mapWidth + 50) {
      this.destroy()
    }
  }
}