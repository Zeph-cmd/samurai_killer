import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import { DamageText } from './DamageText.js'
import gameConfig from './gameConfig.json'

export class DesertWarlordBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "desert_warlord_boss_idle_frame1")

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Boss properties
    this.scene = scene
    this.facingDirection = "left" // Boss initially faces player
    this.walkSpeed = gameConfig.bossConfig.walkSpeed.value
    this.attackRange = gameConfig.bossConfig.attackRange.value
    this.shootRange = gameConfig.bossConfig.shootRange.value

    // Status flags
    this.isDead = false
    this.isAttacking = false
    this.isHurting = false
    this.isInvulnerable = false
    this.hurtingDuration = gameConfig.bossConfig.hurtingDuration.value
    this.invulnerableTime = gameConfig.bossConfig.invulnerableTime.value

    // Boss health system (higher health)
    this.maxHealth = gameConfig.bossConfig.maxHealth.value
    this.health = this.maxHealth

    // AI timers
    this.lastAttackTime = 0
    this.attackCooldown = gameConfig.bossConfig.attackCooldown.value // 4 second attack cooldown
    this.lastShootTime = 0
    this.shootCooldown = gameConfig.bossConfig.shootCooldown.value // 2 second shoot cooldown

    // Set physics properties
    this.body.setGravityY(gameConfig.playerConfig.gravityY.value)

    // Set collision box based on idle animation
    this.collisionBoxWidth = 426 * 0.8  // Boss has larger collision box
    this.collisionBoxHeight = 560 * 0.9
    this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    // Set Boss scale - Boss is larger than normal characters
    const standardHeight = 3 * 64 // Boss is 3 tiles tall
    this.characterScale = standardHeight / 560
    this.setScale(this.characterScale)

    // Set initial origin
    this.setOrigin(0.5, 1.0)

    // Create animations
    this.createAnimations()

    // Play idle animation
    this.play("desert_warlord_boss_idle_anim")
    this.resetOriginAndOffset()

    // Create attack trigger
    this.createAttackTrigger()

    // Initialize sounds
    this.initializeSounds()
  }

  initializeSounds() {
    this.heavyMachineGunSound = this.scene.sound.add("heavy_machine_gun", { volume: 0.3 })
    this.warlordBattleCrySound = this.scene.sound.add("warlord_battle_cry", { volume: 0.3 })
    this.footstepsSandSound = this.scene.sound.add("footsteps_sand", { volume: 0.3 })
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle animation
    if (!anims.exists("desert_warlord_boss_idle_anim")) {
      anims.create({
        key: "desert_warlord_boss_idle_anim",
        frames: [
          {
            key: "desert_warlord_boss_idle_frame1",
            duration: 800,
          },
          {
            key: "desert_warlord_boss_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk animation
    if (!anims.exists("desert_warlord_boss_walk_anim")) {
      anims.create({
        key: "desert_warlord_boss_walk_anim",
        frames: [
          {
            key: "desert_warlord_boss_walk_frame1",
            duration: 300,
          },
          {
            key: "desert_warlord_boss_walk_frame2",
            duration: 300,
          },
          {
            key: "desert_warlord_boss_walk_frame3",
            duration: 300,
          },
          {
            key: "desert_warlord_boss_walk_frame4",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    // Attack animation
    if (!anims.exists("desert_warlord_boss_attack_anim")) {
      anims.create({
        key: "desert_warlord_boss_attack_anim",
        frames: [
          {
            key: "desert_warlord_boss_attack_frame1",
            duration: 100,
          },
          {
            key: "desert_warlord_boss_attack_frame2",
            duration: 200,
          },
        ],
        repeat: 0,
      })
    }

    // Die animation
    if (!anims.exists("desert_warlord_boss_die_anim")) {
      anims.create({
        key: "desert_warlord_boss_die_anim",
        frames: [
          {
            key: "desert_warlord_boss_die_frame1",
            duration: 800,
          },
          {
            key: "desert_warlord_boss_die_frame2",
            duration: 1200,
          },
        ],
        repeat: 0,
      })
    }
  }

  update(time, player) {
    if (!this.body || !this.active || this.isDead || this.isAttacking || this.isHurting) {
      return
    }

    // Handle death state
    if (!this.isDead) {
      this.handleDying()
    }

    // Boss AI logic
    if (!this.isDead && !this.isAttacking && !this.isHurting && player) {
      this.handleBossAI(time, player)
    }

    // Update attack trigger
    this.updateAttackTrigger()
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body.setVelocityX(0)
      this.play("desert_warlord_boss_die_anim", true)
      this.resetOriginAndOffset()
      
      // Play Boss death sound effect
      this.scene.sound.play("boss_death", { volume: 0.3 })

      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "desert_warlord_boss_die_anim") {
          // Mark Boss as inactive when dead
          this.setActive(false)
          this.setVisible(false)
        }
      })
    }
  }

  handleBossAI(time, player) {
    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)

    // Update facing direction
    if (player.x < this.x) {
      this.facingDirection = "left"
    } else {
      this.facingDirection = "right"
    }
    this.setFlipX(this.facingDirection === "left")

    // Prioritize shooting attack
    if (distanceToPlayer <= this.shootRange && time - this.lastShootTime > this.shootCooldown) {
      this.performShootAttack(time, player)
    }
    // If player is too close, move to keep distance
    else if (distanceToPlayer < this.attackRange) {
      this.moveAwayFromPlayer(player)
    }
    // If player is too far, move closer
    else if (distanceToPlayer > this.shootRange * 1.5) {
      this.moveTowardsPlayer(player)
    }
    // Otherwise stay in idle state
    else {
      this.body.setVelocityX(0)
      this.play("desert_warlord_boss_idle_anim", true)
      this.resetOriginAndOffset()
    }
  }

  performShootAttack(time, player) {
    this.lastShootTime = time
    this.isAttacking = true
    this.body.setVelocityX(0)

    this.play("desert_warlord_boss_attack_anim", true)
    this.resetOriginAndOffset()
    this.heavyMachineGunSound.play()

    // Calculate bullet firing position
    const bulletDirection = this.facingDirection === "right" ? 1 : -1
    const characterHeight = 3 * 64 // Boss height is 3 tiles
    const gunMuzzleHeightOffset = characterHeight * 0.4
    const gunLengthOffset = (this.collisionBoxWidth * 0.5) * bulletDirection

    const bulletX = this.x + gunLengthOffset
    const bulletY = this.y - gunMuzzleHeightOffset

    // Fire 3 bullets in succession
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 100, () => {
        if (this.active && !this.isDead) {
          const bullet = this.scene.physics.add.sprite(bulletX, bulletY, 'enemy_bullet')
          bullet.setScale(0.8)
          bullet.body.setSize(8, 8)
          bullet.setVelocityX(bulletDirection * 500)
          bullet.body.setAllowGravity(false)

          // Add lifetime to Boss bullets
          this.scene.time.delayedCall(3000, () => {
            if (bullet.active) {
              bullet.destroy()
            }
          })

          if (this.scene.enemyBullets) {
            this.scene.enemyBullets.add(bullet)
          }
        }
      })
    }

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "desert_warlord_boss_attack_anim") {
        this.isAttacking = false
      }
    })
  }

  moveTowardsPlayer(player) {
    const speed = this.walkSpeed * 0.8 // Boss moves slightly slower

    if (player.x < this.x) {
      this.body.setVelocityX(-speed)
    } else {
      this.body.setVelocityX(speed)
    }

    this.play("desert_warlord_boss_walk_anim", true)
    this.resetOriginAndOffset()
  }

  moveAwayFromPlayer(player) {
    const speed = this.walkSpeed * 0.6

    if (player.x < this.x) {
      this.body.setVelocityX(speed) // Move right to distance from player
    } else {
      this.body.setVelocityX(-speed) // Move left to distance from player
    }

    this.play("desert_warlord_boss_walk_anim", true)
    this.resetOriginAndOffset()
  }

  resetOriginAndOffset() {
    let baseOriginX = 0.5
    let baseOriginY = 1.0
    const currentAnim = this.anims.currentAnim
    if (currentAnim) {
      switch(currentAnim.key) {
        case "desert_warlord_boss_idle_anim":
          baseOriginX = 0.5
          baseOriginY = 1.0
          break
        case "desert_warlord_boss_walk_anim":
          baseOriginX = 0.451
          baseOriginY = 1.0
          break
        case "desert_warlord_boss_attack_anim":
          baseOriginX = 0.249
          baseOriginY = 1.0
          break
        case "desert_warlord_boss_die_anim":
          baseOriginX = 0.531
          baseOriginY = 1.0
          break
        default:
          baseOriginX = 0.5
          baseOriginY = 1.0
          break
      }
    }

    let animOriginX = this.facingDirection === "left" ? (1 - baseOriginX) : baseOriginX
    let animOriginY = baseOriginY
    
    this.setOrigin(animOriginX, animOriginY)
    
    this.body.setOffset(
      this.width * animOriginX - this.collisionBoxWidth / 2, 
      this.height * animOriginY - this.collisionBoxHeight
    )
  }

  takeDamage(damage) {
    if (this.isInvulnerable || this.isDead) return
    
    this.health = Math.max(0, this.health - damage)
    this.isHurting = true
    this.isInvulnerable = true

    // Display damage text - Desert Warlord Boss is more resilient, high damage shows critical hit
    const damageTextX = this.x + Phaser.Math.Between(-40, 40)
    const damageTextY = this.y - this.body.height / 2 - 30
    if (damage >= 200) {
      // Super high damage shows critical hit effect
      DamageText.createCriticalHit(this.scene, damageTextX, damageTextY, damage)
    } else {
      new DamageText(this.scene, damageTextX, damageTextY, damage)
    }

    // Play hurt sound effect
    this.warlordBattleCrySound.play()

    // Hurt stun logic
    this.scene.time.delayedCall(this.hurtingDuration, () => {
      this.isHurting = false
    })

    // Flash during invulnerability time
    const blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: this.invulnerableTime / 200,
      onComplete: () => {
        this.isInvulnerable = false
        this.setAlpha(1)
      }
    })
  }

  getHealthPercentage() {
    return (this.health / this.maxHealth) * 100
  }

  createAttackTrigger() {
    this.attackTrigger = createTrigger(this.scene, 0, 0, 250, 150)
  }

  updateAttackTrigger() {
    let triggerX = 0
    let triggerY = 0
    let triggerWidth = 250
    let triggerHeight = 150

    const bossCenterX = this.x
    const bossCenterY = this.y - this.body.height / 2

    switch(this.facingDirection) {
      case "right":
        triggerX = bossCenterX + triggerWidth / 2
        triggerY = bossCenterY
        break
      case "left":
        triggerX = bossCenterX - triggerWidth / 2
        triggerY = bossCenterY
        break
    }
    
    this.attackTrigger.setPosition(triggerX, triggerY)
    this.attackTrigger.body.setSize(triggerWidth, triggerHeight)
  }
}