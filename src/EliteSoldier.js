import Phaser from 'phaser'
import { createTrigger } from './utils.js'
import gameConfig from './gameConfig.json'

export class EliteSoldier extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "elite_soldier_idle_frame1")

    // Add to scene and physics system
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Character properties
    this.scene = scene
    this.facingDirection = "right"
    this.walkSpeed = gameConfig.playerConfig.walkSpeed.value
    this.jumpPower = gameConfig.playerConfig.jumpPower.value

    // Status flags
    this.isDead = false // Dead state
    this.isAttacking = false // Attacking state
    this.isHurting = false // Hurt stun state
    this.isInvulnerable = false // Invulnerable state
    this.isCrouching = false // Crouching state
    this.hurtingDuration = gameConfig.playerConfig.hurtingDuration.value // Hurt stun duration
    this.invulnerableTime = gameConfig.playerConfig.invulnerableTime.value // Invulnerability time

    // Attack target tracking system
    this.currentMeleeTargets = new Set() // Track currently melee attacked targets

    // Player health system
    this.maxHealth = gameConfig.playerConfig.maxHealth.value
    this.health = this.maxHealth

    // Set physics properties
    this.body.setGravityY(gameConfig.playerConfig.gravityY.value)

    // Set collision box based on idle animation (based on asset info)
    this.collisionBoxWidth = 386 * 0.9
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
    this.play("elite_soldier_idle_anim")
    this.resetOriginAndOffset()

    // Create melee attack trigger
    this.createMeleeTrigger()

    // Initialize all sounds
    this.initializeSounds()
  }

  // Initialize all sounds
  initializeSounds() {
    this.rifleShootSound = this.scene.sound.add("rifle_shot", { volume: 0.3 })
    this.footstepsSound = this.scene.sound.add("footsteps_concrete", { volume: 0.3 })
  }

  createAnimations() {
    const anims = this.scene.anims

    // Idle animation
    if (!anims.exists("elite_soldier_idle_anim")) {
      anims.create({
        key: "elite_soldier_idle_anim",
        frames: [
          {
            key: "elite_soldier_idle_frame1",
            duration: 800,
          },
          {
            key: "elite_soldier_idle_frame2",
            duration: 800,
          },
        ],
        repeat: -1,
      })
    }

    // Walk animation
    if (!anims.exists("elite_soldier_walk_anim")) {
      anims.create({
        key: "elite_soldier_walk_anim",
        frames: [
          {
            key: "elite_soldier_walk_frame1",
            duration: 300,
          },
          {
            key: "elite_soldier_walk_frame2",
            duration: 300,
          },
          {
            key: "elite_soldier_walk_frame3",
            duration: 300,
          },
          {
            key: "elite_soldier_walk_frame4",
            duration: 300,
          },
        ],
        repeat: -1,
      })
    }

    // Jump Up animation
    if (!anims.exists("elite_soldier_jump_up_anim")) {
      anims.create({
        key: "elite_soldier_jump_up_anim",
        frames: [
          {
            key: "elite_soldier_jump_frame1",
            duration: 200,
          },
        ],
        repeat: 0,
      })
    }

    // Jump Down animation
    if (!anims.exists("elite_soldier_jump_down_anim")) {
      anims.create({
        key: "elite_soldier_jump_down_anim",
        frames: [
          {
            key: "elite_soldier_jump_frame2",
            duration: 300,
          },
        ],
        repeat: 0,
      })
    }

    // Attack animation
    if (!anims.exists("elite_soldier_attack_anim")) {
      anims.create({
        key: "elite_soldier_attack_anim",
        frames: [
          {
            key: "elite_soldier_attack_frame1",
            duration: 100,
          },
          {
            key: "elite_soldier_attack_frame2",
            duration: 200,
          },
        ],
        repeat: 0,
      })
    }

    // Die animation
    if (!anims.exists("elite_soldier_die_anim")) {
      anims.create({
        key: "elite_soldier_die_anim",
        frames: [
          {
            key: "elite_soldier_die_frame1",
            duration: 500,
          },
          {
            key: "elite_soldier_die_frame2",
            duration: 1000,
          },
        ],
        repeat: 0,
      })
    }

    // Crouch animation
    if (!anims.exists("elite_soldier_crouch_anim")) {
      anims.create({
        key: "elite_soldier_crouch_anim",
        frames: [
          {
            key: "elite_soldier_crouch_frame1",
            duration: 300,
          },
          {
            key: "elite_soldier_crouch_frame2",
            duration: 400,
          },
        ],
        repeat: 0,
      })
    }
  }

  update(cursors, shootKey, meleeKey, crouchKey) {
    if (!this.body || !this.active || this.isDead || this.isAttacking || this.isHurting) {
      return
    }

    // Handle death state
    if (!this.isDead) {
      this.handleDying()
    }

    // Handle crouching state
    if (!this.isDead && !this.isAttacking && !this.isHurting) {
      this.handleCrouching(crouchKey)
    }

    // Handle attack state
    if (!this.isDead && !this.isAttacking && !this.isHurting && !this.isCrouching) {
      this.handleAttacks(shootKey, meleeKey)
    }

    // Handle movement
    if (!this.isDead && !this.isAttacking && !this.isHurting && !this.isCrouching) {
      this.handleMovement(cursors)
    }

    // Update attack trigger
    this.updateMeleeTrigger()
  }

  handleDying() {
    if (this.health <= 0 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.body.setVelocityX(0)
      this.play("elite_soldier_die_anim", true)
      this.resetOriginAndOffset()
      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "elite_soldier_die_anim") {
          this.scene.scene.launch("GameOverUIScene", { 
            currentLevelKey: this.scene.scene.key 
          })
        }
      })
    } else if(this.y > this.scene.mapHeight + 100 && !this.isDead) {
      this.health = 0
      this.isDead = true
      this.scene.scene.launch("GameOverUIScene", { 
        currentLevelKey: this.scene.scene.key 
      })
    }
  }

  handleCrouching(crouchKey) {
    if (Phaser.Input.Keyboard.JustDown(crouchKey) && !this.isCrouching) {
      this.isCrouching = true
      this.body.setVelocityX(0) // Stop movement when crouching
      this.play("elite_soldier_crouch_anim", true)
      this.resetOriginAndOffset()

      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "elite_soldier_crouch_anim") {
          // Stay in crouch state after animation completes until key is released
          if (crouchKey.isUp) {
            this.isCrouching = false
          }
        }
      })
    } else if (crouchKey.isUp && this.isCrouching) {
      this.isCrouching = false
    }
  }

  handleAttacks(shootKey, meleeKey) {
    // Shooting attack
    if (Phaser.Input.Keyboard.JustDown(shootKey) && !this.isAttacking) {
      this.isAttacking = true
      this.body.setVelocityX(0)

      this.play("elite_soldier_attack_anim", true)
      this.resetOriginAndOffset()
      this.rifleShootSound.play()

      // Calculate more precise bullet firing position
      const bulletDirection = this.facingDirection === "right" ? 1 : -1

      // Calculate gun muzzle position based on character's actual size and animation
      // Character height is 2 tiles (128px), gun muzzle approximately at 45% of character height (adjusted up by 10%)
      const characterHeight = 2 * 64 // Standard character height is 2 tiles
      const gunMuzzleHeightOffset = characterHeight * 0.45 // Gun muzzle height offset (adjusted from 0.35 to 0.45)

      // Horizontal position: gun length is approximately 40% of character width
      const gunLengthOffset = (this.collisionBoxWidth * 0.4) * bulletDirection

      const bulletX = this.x + gunLengthOffset
      const bulletY = this.y - gunMuzzleHeightOffset

      // Create bullet texture
      if (!this.scene.textures.exists('player_bullet')) {
        this.scene.createBulletTextures()
      }

      const bullet = this.scene.physics.add.sprite(bulletX, bulletY, 'player_bullet')
      bullet.setScale(0.5)
      bullet.body.setSize(8, 8)
      bullet.setVelocityX(bulletDirection * 600)
      bullet.body.setAllowGravity(false)

      if (this.scene.playerBullets) {
        this.scene.playerBullets.add(bullet)
      }

      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "elite_soldier_attack_anim") {
          this.isAttacking = false
        }
      })
    }

    // Melee attack
    if (Phaser.Input.Keyboard.JustDown(meleeKey) && !this.isAttacking) {
      this.currentMeleeTargets.clear()
      this.updateMeleeTrigger()
      this.isAttacking = true
      this.body.setVelocityX(0)

      this.play("elite_soldier_attack_anim", true)
      this.resetOriginAndOffset()

      this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation, frame) => {
        if (animation.key === "elite_soldier_attack_anim") {
          this.isAttacking = false
          this.currentMeleeTargets.clear()
        }
      })
    }
  }

  handleMovement(cursors) {
    // Normal mode movement control - support both arrow keys and WASD
    const leftPressed = cursors.left.isDown || cursors.wasdLeft.isDown
    const rightPressed = cursors.right.isDown || cursors.wasdRight.isDown
    
    if (leftPressed) {
      this.body.setVelocityX(-this.walkSpeed)
      this.facingDirection = "left"
    } else if (rightPressed) {
      this.body.setVelocityX(this.walkSpeed)
      this.facingDirection = "right"
    } else {
      this.body.setVelocityX(0)
    }

    // Update facing direction
    this.setFlipX(this.facingDirection === "left")

    // Jump - support both arrow keys and WASD
    const upPressed = cursors.up.isDown || cursors.wasdUp.isDown
    if (upPressed && this.body.blocked.down) {
      this.body.setVelocityY(-this.jumpPower)
    }

    // Update animation
    if (!this.body.blocked.down) {
      if (this.body.velocity.y < 0) {
        // Ascending phase
        this.play("elite_soldier_jump_up_anim", true)
        this.resetOriginAndOffset()
      } else {
        // Descending phase
        this.play("elite_soldier_jump_down_anim", true)
        this.resetOriginAndOffset()
      }
    } else if (Math.abs(this.body.velocity.x) > 0) {
      // Walking
      this.play("elite_soldier_walk_anim", true)
      this.resetOriginAndOffset()
    } else {
      // Idle
      this.play("elite_soldier_idle_anim", true)
      this.resetOriginAndOffset()
    }
  }

  resetOriginAndOffset() {
    // Return corresponding origin data based on different animations
    let baseOriginX = 0.5;
    let baseOriginY = 1.0;
    const currentAnim = this.anims.currentAnim;
    if (currentAnim) {
      switch(currentAnim.key) {
        case "elite_soldier_idle_anim":
          baseOriginX = 0.5;
          baseOriginY = 1.0;
          break;
        case "elite_soldier_walk_anim":
          baseOriginX = 0.433;
          baseOriginY = 1.0;
          break;
        case "elite_soldier_jump_up_anim":
        case "elite_soldier_jump_down_anim":
          baseOriginX = 0.269;
          baseOriginY = 1.0;
          break;
        case "elite_soldier_attack_anim":
          baseOriginX = 0.19;
          baseOriginY = 1.0;
          break;
        case "elite_soldier_die_anim":
          baseOriginX = 0.503;
          baseOriginY = 1.0;
          break;
        case "elite_soldier_crouch_anim":
          baseOriginX = 0.307;
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

    // Notify UI to update health
    this.scene.events.emit('playerHealthChanged', this.getHealthPercentage())

    // Hurt stun logic
    this.scene.time.delayedCall(this.hurtingDuration, () => {
      this.isHurting = false
    })

    // Flash logic during invulnerability time
    let blinkCount = 0
    const blinkInterval = 100
    const maxBlinks = this.invulnerableTime / blinkInterval

    const blinkTimer = this.scene.time.addEvent({
      delay: blinkInterval,
      callback: () => {
        this.setAlpha(this.alpha === 1 ? 0.5 : 1)
        blinkCount++
        if (blinkCount >= maxBlinks) {
          this.setAlpha(1)
          this.isInvulnerable = false
          blinkTimer.destroy()
        }
      },
      repeat: maxBlinks - 1
    })
  }

  getHealthPercentage() {
    return (this.health / this.maxHealth) * 100
  }

  // Create melee attack trigger
  createMeleeTrigger() {
    // Use utility method to create melee attack trigger
    this.meleeTrigger = createTrigger(this.scene, 0, 0, 200, 120)
  }

  // Update melee attack trigger
  updateMeleeTrigger() {
    let triggerX = 0
    let triggerY = 0
    let triggerWidth = 200
    let triggerHeight = 120

    const playerCenterX = this.x
    // Character origin is at bottom, need to compensate
    const playerCenterY = this.y - this.body.height / 2

    switch(this.facingDirection) {
      case "right":
        triggerWidth = 200
        triggerHeight = 120
        triggerX = playerCenterX + triggerWidth / 2 // Character center point shifted right
        triggerY = playerCenterY
        break;
      case "left":
        triggerWidth = 200
        triggerHeight = 120
        triggerX = playerCenterX - triggerWidth / 2 // Character center point shifted left
        triggerY = playerCenterY
        break;
    }

    this.meleeTrigger.setPosition(triggerX, triggerY)
    this.meleeTrigger.body.setSize(triggerWidth, triggerHeight)
  }
}