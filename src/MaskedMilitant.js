import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import { EnemyBullet } from './EnemyBullet.js'
import { DamageText } from './DamageText.js'
import gameConfig from './gameConfig.json'

export class MaskedMilitant extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "masked_militant_idle_frame1")

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Enemy properties
    this.scene = scene
    this.facingDirection = "left" // Enemy defaults to facing left
    this.walkSpeed = gameConfig.enemyConfig.walkSpeed.value
    this.patrolDistance = gameConfig.enemyConfig.patrolDistance.value
    this.detectionRange = gameConfig.enemyConfig.detectionRange.value

    // Status flags
    this.isDead = false
    this.isAttacking = false
    this.isHurting = false
    this.attackCooldown = false

    // Attack target tracking system
    this.currentAttackTargets = new Set()

    // Enemy health system
    this.maxHealth = gameConfig.enemyConfig.maxHealth.value
    this.health = this.maxHealth

    // AI state
    this.aiState = "patrol" // patrol, chase, attack, shoot
    this.startX = x
    this.patrolDirection = -1 // -1 for left, 1 for right
    this.lastAttackTime = 0
    this.shootingRange = 300 // Shooting range
    this.isShooting = false

    // Set physics properties
    this.body.setGravityY(gameConfig.enemyConfig.gravityY.value)

    // Set collision box based on idle animation (based on asset info)
    this.collisionBoxWidth = 408 * 0.9
    this.collisionBoxHeight = 560 * 0.9
    this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    // Set character scale
    const standardHeight = 2 * 64 // 2 tiles height
    this.characterScale = standardHeight / 560
    this.setScale(this.characterScale)

    // Set initial origin
    this.setOrigin(0.5, 1.0)

    // Create animations
    this.createAnimations()

    // Play idle animation
    this.play("masked_militant_idle_anim")
    this.resetOriginAndOffset()

    // Create attack trigger
    this.createAttackTrigger()

    // Initialize sounds
    this.initializeSounds()
  }

  // Initialize sounds
  initializeSounds() {
    this.ak47ShotSound = this.scene.sound.add("ak47_shot", { volume: 0.3 })
    this.enemyRifleShotSound = this.scene.sound.add("enemy_rifle_shot", { volume: 0.3 })
    this.enemyDeathSound = this.scene.sound.add("enemy_death", { volume: 0.3 })
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle animation
    if (!anims.exists("masked_militant_idle_anim")) {
      anims.create({
        key: "masked_militant_idle_anim",
        frames: [
          {
            key: "masked_militant_idle_frame1",
            duration: 800,
          },
          {
            key: "masked_militant_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk animation
    if (!anims.exists("masked_militant_walk_anim")) {
      anims.create({
        key: "masked_militant_walk_anim",
        frames: [
          {
            key: "masked_militant_walk_frame1",
            duration: 300,
          },
          {
            key: "masked_militant_walk_frame2",
            duration: 300,
          },
          {
            key: "masked_militant_walk_frame3",
            duration: 300,
          },
          {
            key: "masked_militant_walk_frame4",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    // Attack animation
    if (!anims.exists("masked_militant_attack_anim")) {
      anims.create({
        key: "masked_militant_attack_anim",
        frames: [
          {
            key: "masked_militant_attack_frame1",
            duration: 150,
          },
          {
            key: "masked_militant_attack_frame2",
            duration: 250,
          },
        ],
        repeat: 0,
      })
    }

    // Die animation
    if (!anims.exists("masked_militant_die_anim")) {
      anims.create({
        key: "masked_militant_die_anim",
        frames: [
          {
            key: "masked_militant_die_frame1",
            duration: 400,
          },
          {
            key: "masked_militant_die_frame2",
            duration: 800,
          },
        ],
        repeat: 0,
      })
    }
  }

  update() {
    if (!this.body || !this.active || this.isDead || this.isHurting) {
      return
    }

    // Handle death state
    this.handleDying()

    // Update AI behavior
    if (!this.isDead && !this.isAttacking && !this.isShooting) {
      this.updateAI()
    }

    // Update attack trigger
    this.updateAttackTrigger()
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body.setVelocityX(0)
      this.play("masked_militant_die_anim", true)
      this.resetOriginAndOffset()
      this.enemyDeathSound.play()

      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "masked_militant_die_anim") {
          // Remove enemy from scene
          this.setActive(false)
          this.setVisible(false)
          this.body.enable = false
        }
      })
    }
  }

  updateAI() {
    const player = this.scene.player
    if (!player || player.isDead) {
      this.patrol()
      return
    }

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    // Switch AI state based on distance
    if (distanceToPlayer <= this.detectionRange) {
      if (distanceToPlayer <= 150 && !this.attackCooldown) {
        this.aiState = "attack"
        this.attack()
      } else if (distanceToPlayer <= this.shootingRange && !this.attackCooldown) {
        this.aiState = "shoot"
        this.shoot(player)
      } else {
        this.aiState = "chase"
        this.chase(player)
      }
    } else {
      this.aiState = "patrol"
      this.patrol()
    }
  }

  patrol() {
    // Patrol logic
    const distanceFromStart = this.x - this.startX

    // Check if need to turn around
    if (distanceFromStart <= -this.patrolDistance) {
      this.patrolDirection = 1 // Turn right
    } else if (distanceFromStart >= this.patrolDistance) {
      this.patrolDirection = -1 // Turn left
    }

    // Move
    this.body.setVelocityX(this.walkSpeed * this.patrolDirection)
    this.facingDirection = this.patrolDirection === 1 ? "right" : "left"
    this.setFlipX(this.facingDirection === "left")

    // Play walking animation
    this.play("masked_militant_walk_anim", true)
    this.resetOriginAndOffset()
  }

  chase(player) {
    // Chase logic
    const direction = player.x > this.x ? 1 : -1
    this.body.setVelocityX(this.walkSpeed * direction * 1.5) // Slightly faster when chasing
    this.facingDirection = direction === 1 ? "right" : "left"
    this.setFlipX(this.facingDirection === "left")

    // Play walking animation
    this.play("masked_militant_walk_anim", true)
    this.resetOriginAndOffset()
  }

  attack() {
    if (this.isAttacking || this.attackCooldown) return

    // Clear attack target records, start new attack
    this.currentAttackTargets.clear()
    this.updateAttackTrigger()
    this.isAttacking = true
    this.body.setVelocityX(0)

    this.play("masked_militant_attack_anim", true)
    this.resetOriginAndOffset()
    this.ak47ShotSound.play()

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "masked_militant_attack_anim") {
        this.isAttacking = false
        this.currentAttackTargets.clear()

        // Set attack cooldown
        this.attackCooldown = true
        this.scene.time.delayedCall(gameConfig.enemyConfig.attackCooldown.value, () => {
          this.attackCooldown = false
        })
      }
    })
  }

  shoot(player) {
    if (this.isShooting || this.attackCooldown) return

    this.isShooting = true
    this.body.setVelocityX(0) // Stop moving when shooting

    // Face the player
    this.facingDirection = player.x > this.x ? "right" : "left"
    this.setFlipX(this.facingDirection === "left")

    // Play attack animation (use melee attack animation to represent shooting)
    this.play("masked_militant_attack_anim", true)
    this.resetOriginAndOffset()
    this.enemyRifleShotSound.play()

    // Create bullet
    const bulletDirection = this.facingDirection === "right" ? 1 : -1
    const bulletX = this.x + (bulletDirection * 30) // Bullet fired from weapon position
    const bulletY = this.y - 30 // Bullet height

    const bullet = new EnemyBullet(this.scene, bulletX, bulletY, bulletDirection)
    if (this.scene.enemyBullets) {
      this.scene.enemyBullets.add(bullet)
    }

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "masked_militant_attack_anim") {
        this.isShooting = false

        // Set attack cooldown
        this.attackCooldown = true
        this.scene.time.delayedCall(gameConfig.enemyConfig.attackCooldown.value, () => {
          this.attackCooldown = false
        })
      }
    })
  }

  resetOriginAndOffset() {
    // Return corresponding origin data based on different animations
    let baseOriginX = 0.5;
    let baseOriginY = 1.0;
    const currentAnim = this.anims.currentAnim;
    if (currentAnim) {
      switch(currentAnim.key) {
        case "masked_militant_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "masked_militant_walk_anim":
          baseOriginX = 0.386;
          baseOriginY = 1.0;
          break;
        case "masked_militant_attack_anim":
          baseOriginX = 0.197;
          baseOriginY = 1.0;
          break;
        case "masked_militant_die_anim":
          baseOriginX = 0.354;
          baseOriginY = 1.0;
          break;
        default:
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
      }
    }

    let animOriginX = this.facingDirection === "left" ? (1 - baseOriginX) : baseOriginX;
    let animOriginY = baseOriginY;
    
    // Set origin
    this.setOrigin(animOriginX, animOriginY);

    // Calculate offset to align collision box's bottomCenter with animation frame's origin
    this.body.setOffset(
      this.width * animOriginX - this.collisionBoxWidth / 2, 
      this.height * animOriginY - this.collisionBoxHeight
    );
  }

  takeDamage(damage) {
    if (this.isDead) return
    
    this.health -= damage
    this.isHurting = true

    // Display damage text
    const damageTextX = this.x + Phaser.Math.Between(-20, 20)
    const damageTextY = this.y - this.body.height / 2
    new DamageText(this.scene, damageTextX, damageTextY, damage)

    // Hurt stun logic
    this.scene.time.delayedCall(100, () => {
      this.isHurting = false
    })

    // Hurt flash effect
    this.setTint(0xff0000)
    this.scene.time.delayedCall(200, () => {
      this.clearTint()
    })
  }

  // Create attack trigger
  createAttackTrigger() {
    this.attackTrigger = createTrigger(this.scene, 0, 0, 150, 100)
  }

  // Update attack trigger
  updateAttackTrigger() {
    let triggerX = 0
    let triggerY = 0
    let triggerWidth = 150
    let triggerHeight = 100

    const enemyCenterX = this.x
    const enemyCenterY = this.y - this.body.height / 2

    switch(this.facingDirection) {
      case "right":
        triggerX = enemyCenterX + triggerWidth / 2
        triggerY = enemyCenterY
        break;
      case "left":
        triggerX = enemyCenterX - triggerWidth / 2
        triggerY = enemyCenterY
        break;
    }
    
    this.attackTrigger.setPosition(triggerX, triggerY)
    this.attackTrigger.body.setSize(triggerWidth, triggerHeight)
  }
}