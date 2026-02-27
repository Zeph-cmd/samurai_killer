import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import { DamageText } from './DamageText.js'
import gameConfig from './gameConfig.json'

export class JapaneseSamuraiBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "japanese_samurai_boss_idle_frame1")

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Boss properties
    this.scene = scene
    this.facingDirection = "left" // Default facing left (player direction)
    this.walkSpeed = gameConfig.bossConfig.walkSpeed.value || 80
    this.detectionRange = gameConfig.bossConfig.detectionRange.value || 400
    this.attackRange = gameConfig.bossConfig.attackRange.value || 120
    this.attackCooldown = gameConfig.bossConfig.attackCooldown.value || 2000
    this.lastAttackTime = 0

    // Status flags
    this.isDead = false
    this.isAttacking = false
    this.isHurting = false
    this.isInvulnerable = false
    this.hurtingDuration = 200 // Hurt stun duration
    this.invulnerableTime = 500 // Brief invulnerability time

    // Boss health system (Boss should have more health)
    this.maxHealth = gameConfig.bossConfig.maxHealth.value || 200
    this.health = this.maxHealth

    // AI state
    this.aiState = "idle" // idle, patrol, chase, attack
    this.patrolDirection = 1
    this.patrolStartX = x
    this.patrolDistance = 200

    // Attack target tracking system
    this.currentAttackTargets = new Set()

    // Set physics properties
    this.body.setGravityY(gameConfig.playerConfig.gravityY.value)

    // Set collision box based on idle animation (Boss is larger than normal enemies)
    this.collisionBoxWidth = 300 * 0.9
    this.collisionBoxHeight = 560 * 0.9
    this.body.setSize(this.collisionBoxWidth, this.collisionBoxHeight)

    // Set Boss scale (1.5 times larger than normal enemies)
    const standardHeight = 2 * 64 * 1.5 // Boss is 1.5 times taller than standard height
    this.characterScale = standardHeight / 560
    this.setScale(this.characterScale)

    // Set initial origin
    this.setOrigin(0.5, 1.0)

    // Create animations
    this.createAnimations()

    // Play idle animation
    this.play("japanese_samurai_boss_idle_anim")
    this.resetOriginAndOffset()

    // Create attack trigger
    this.createAttackTrigger()

    // Initialize sounds
    this.initializeSounds()
  }

  // Initialize sounds
  initializeSounds() {
    this.battleCrySound = this.scene.sound.add("samurai_battle_cry", { volume: 0.4 })
    this.swordSlashSound = this.scene.sound.add("samurai_sword_slash", { volume: 0.4 })
    this.deathSound = this.scene.sound.add("boss_death", { volume: 0.5 })
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle animation
    if (!anims.exists("japanese_samurai_boss_idle_anim")) {
      anims.create({
        key: "japanese_samurai_boss_idle_anim",
        frames: [
          {
            key: "japanese_samurai_boss_idle_frame1",
            duration: 800,
          },
          {
            key: "japanese_samurai_boss_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk animation
    if (!anims.exists("japanese_samurai_boss_walk_anim")) {
      anims.create({
        key: "japanese_samurai_boss_walk_anim",
        frames: [
          {
            key: "japanese_samurai_boss_walk_frame1",
            duration: 300,
          },
          {
            key: "japanese_samurai_boss_walk_frame2",
            duration: 300,
          },
          {
            key: "japanese_samurai_boss_walk_frame3",
            duration: 300,
          },
          {
            key: "japanese_samurai_boss_walk_frame4",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    // Attack animation
    if (!anims.exists("japanese_samurai_boss_attack_anim")) {
      anims.create({
        key: "japanese_samurai_boss_attack_anim",
        frames: [
          {
            key: "japanese_samurai_boss_attack_frame1",
            duration: 150,
          },
          {
            key: "japanese_samurai_boss_attack_frame2",
            duration: 250,
          },
        ],
        repeat: 0,
      })
    }

    // Die animation
    if (!anims.exists("japanese_samurai_boss_die_anim")) {
      anims.create({
        key: "japanese_samurai_boss_die_anim",
        frames: [
          {
            key: "japanese_samurai_boss_die_frame1",
            duration: 800,
          },
          {
            key: "japanese_samurai_boss_die_frame2",
            duration: 1200,
          },
        ],
        repeat: 0,
      })
    }
  }

  update() {
    if (!this.body || !this.active || this.isDead) {
      return
    }

    // Handle death state
    this.handleDying()

    // Handle hurt state
    this.handleHurting()

    // Handle AI logic
    if (!this.isDead && !this.isHurting) {
      this.handleAI()
    }

    // Update attack trigger
    this.updateAttackTrigger()
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body.setVelocityX(0)
      this.aiState = "dead"
      this.play("japanese_samurai_boss_die_anim", true)
      this.resetOriginAndOffset()
      this.deathSound.play()
      
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "japanese_samurai_boss_die_anim") {
          // Disable Boss after death, but don't destroy immediately (preserve corpse)
          this.setActive(false)
          // Trigger Boss defeated event
          this.scene.events.emit('bossDefeated')
        }
      })
    }
  }

  handleHurting() {
    // Hurt stun logic
    if (this.isHurting) {
      this.body.setVelocityX(0)
      return
    }
  }

  handleAI() {
    const player = this.scene.player
    if (!player || player.isDead) return

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const currentTime = this.scene.time.now

    // Determine AI behavior based on distance and state
    if (distanceToPlayer <= this.attackRange && currentTime - this.lastAttackTime > this.attackCooldown) {
      this.handleAttack()
    } else if (distanceToPlayer <= this.detectionRange) {
      this.handleChase(player)
    } else {
      this.handlePatrol()
    }
  }

  handleAttack() {
    if (this.isAttacking) return

    // Clear attack target records, start new attack
    this.currentAttackTargets.clear()
    this.isAttacking = true
    this.body.setVelocityX(0)
    this.lastAttackTime = this.scene.time.now

    // Face the player
    const player = this.scene.player
    this.facingDirection = player.x > this.x ? "right" : "left"
    this.setFlipX(this.facingDirection === "left")

    this.play("japanese_samurai_boss_attack_anim", true)
    this.resetOriginAndOffset()
    this.swordSlashSound.play()

    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
      if (animation.key === "japanese_samurai_boss_attack_anim") {
        this.isAttacking = false
        this.currentAttackTargets.clear()
      }
    })
  }

  handleChase(player) {
    if (this.isAttacking) return

    this.aiState = "chase"

    // Move towards player
    if (player.x > this.x) {
      this.facingDirection = "right"
      this.body.setVelocityX(this.walkSpeed)
    } else {
      this.facingDirection = "left"
      this.body.setVelocityX(-this.walkSpeed)
    }

    this.setFlipX(this.facingDirection === "left")
    this.play("japanese_samurai_boss_walk_anim", true)
    this.resetOriginAndOffset()
  }

  handlePatrol() {
    if (this.isAttacking) return

    this.aiState = "patrol"

    // Patrol logic
    const currentDistance = Math.abs(this.x - this.patrolStartX)

    if (currentDistance >= this.patrolDistance) {
      this.patrolDirection *= -1
    }

    if (this.patrolDirection > 0) {
      this.facingDirection = "right"
      this.body.setVelocityX(this.walkSpeed * 0.5) // Slower speed during patrol
    } else {
      this.facingDirection = "left"
      this.body.setVelocityX(-this.walkSpeed * 0.5)
    }

    this.setFlipX(this.facingDirection === "left")
    this.play("japanese_samurai_boss_walk_anim", true)
    this.resetOriginAndOffset()
  }

  resetOriginAndOffset() {
    // Return corresponding origin data based on different animations
    let baseOriginX = 0.5;
    let baseOriginY = 1.0;
    const currentAnim = this.anims.currentAnim;

    if (currentAnim) {
      switch(currentAnim.key) {
        case "japanese_samurai_boss_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "japanese_samurai_boss_walk_anim":
          baseOriginX = 0.494;
          baseOriginY = 1.0;
          break;
        case "japanese_samurai_boss_attack_anim":
          baseOriginX = 0.189;
          baseOriginY = 1.0;
          break;
        case "japanese_samurai_boss_die_anim":
          baseOriginX = 0.477;
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
    if (this.isInvulnerable || this.isDead) return

    this.health -= damage
    this.isHurting = true
    this.isInvulnerable = true

    // Display damage text - Boss usually takes higher damage, may have critical hit effect
    const damageTextX = this.x + Phaser.Math.Between(-30, 30)
    const damageTextY = this.y - this.body.height / 2 - 20
    if (damage >= 150) {
      // High damage shows critical hit effect
      DamageText.createCriticalHit(this.scene, damageTextX, damageTextY, damage)
    } else {
      new DamageText(this.scene, damageTextX, damageTextY, damage)
    }

    // Play battle cry to indicate being attacked
    if (this.health > 0) {
      this.battleCrySound.play()
    }

    // Hurt stun
    setTimeout(() => {
      this.isHurting = false
    }, this.hurtingDuration)

    // Brief invulnerability time
    setTimeout(() => {
      this.isInvulnerable = false
    }, this.invulnerableTime)

    // Hurt flashing effect
    let flashCount = 0
    const flashInterval = setInterval(() => {
      this.setAlpha(this.alpha === 1 ? 0.5 : 1)
      flashCount++
      if (flashCount >= 6) { // Flash 3 times
        clearInterval(flashInterval)
        this.setAlpha(1)
      }
    }, 100)
  }

  getHealthPercentage() {
    return (this.health / this.maxHealth) * 100
  }

  // Create attack trigger
  createAttackTrigger() {
    this.attackTrigger = createTrigger(this.scene, 0, 0, 200, 150) // Boss has larger attack range
  }

  // Update attack trigger
  updateAttackTrigger() {
    let triggerX = 0
    let triggerY = 0
    let triggerWidth = 200 // Boss has larger attack range
    let triggerHeight = 150

    const bossCenterX = this.x
    const bossCenterY = this.y - this.body.height / 2

    switch(this.facingDirection) {
      case "right":
        triggerX = bossCenterX + triggerWidth / 2
        triggerY = bossCenterY
        break;
      case "left":
        triggerX = bossCenterX - triggerWidth / 2
        triggerY = bossCenterY
        break;
    }

    this.attackTrigger.setPosition(triggerX, triggerY)
    this.attackTrigger.body.setSize(triggerWidth, triggerHeight)
  }
}