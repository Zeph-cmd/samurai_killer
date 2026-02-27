import Phaser from 'phaser'
import { EliteSoldier } from '../EliteSoldier.js'
import { MaskedMilitant } from '../MaskedMilitant.js'
import { MedicalKit } from '../MedicalKit.js'
import { EnemyBullet } from '../EnemyBullet.js'
import gameConfig from '../gameConfig.json'

export class BaseLevelScene extends Phaser.Scene {
  constructor(config) {
    super(config)
  }

  // Called in preload, generates bullet textures
  createBulletTextures() {
    // Create enemy bullet texture
    EnemyBullet.preload(this)

    // Create player bullet texture
    if (!this.textures.exists('player_bullet')) {
      this.add.graphics()
        .fillStyle(0xffff00)
        .fillCircle(4, 4, 4)
        .generateTexture('player_bullet', 8, 8)
        .destroy()
    }
  }

  // Level order list
  static LEVEL_ORDER = [
    "Level1Scene"
  ]

  // Get next level scene key
  getNextLevelScene() {
    const currentIndex = BaseLevelScene.LEVEL_ORDER.indexOf(this.scene.key)
    const nextIndex = currentIndex + 1
    return nextIndex < BaseLevelScene.LEVEL_ORDER.length ? BaseLevelScene.LEVEL_ORDER[nextIndex] : null
  }

  // Check if this is the last level
  isLastLevel() {
    const currentIndex = BaseLevelScene.LEVEL_ORDER.indexOf(this.scene.key)
    return currentIndex === BaseLevelScene.LEVEL_ORDER.length - 1
  }

  // Get first level scene key
  static getFirstLevelScene() {
    return BaseLevelScene.LEVEL_ORDER[0]
  }

  // General creation method
  createBaseElements() {
    // Initialize gameCompleted flag
    this.gameCompleted = false

    // Set map size
    this.setupMapSize()

    // Create background
    this.createBackground()

    // Create tile map
    this.createTileMap()

    // Create decoration elements
    this.decorations = this.add.group()
    this.createDecorations()

    // Create enemies
    this.enemies = this.add.group()
    this.createEnemies()

    // Create Boss (if any)
    this.boss = null
    this.createBoss()

    // Create enemy bullets group
    this.enemyBullets = this.add.group()

    // Create medical kits group
    this.medicalKits = this.add.group()
    this.createMedicalKits()

    // Create player
    this.createPlayer()

    // Setup base collisions
    this.setupBaseCollisions()

    // Set player world bounds collision
    this.player.body.setCollideWorldBounds(true)

    // Setup camera
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight)
    this.cameras.main.startFollow(this.player)
    this.cameras.main.setLerp(0.1, 0.1)

    // Set world bounds (side-scroll game: disable bottom boundary collision)
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight, true, true, true, false)

    // Create input controls
    this.setupInputs()

    // Setup attack collision detection
    this.setupAttackCollision()

    // Show UI
    this.scene.launch("UIScene", { playerHealth: this.player.getHealthPercentage() })
  }

  setupBaseCollisions() {
    // Player collision with ground
    this.physics.add.collider(this.player, this.groundLayer)

    // Enemy collision with ground
    this.physics.add.collider(this.enemies, this.groundLayer)

    // Boss collision with ground (if Boss exists)
    if (this.boss) {
      this.physics.add.collider(this.boss, this.groundLayer)
    }

    // Player collision with platforms (if platform layer exists)
    if (this.platformsLayer) {
      this.physics.add.collider(this.player, this.platformsLayer)
      this.physics.add.collider(this.enemies, this.platformsLayer)
      if (this.boss) {
        this.physics.add.collider(this.boss, this.platformsLayer)
      }
    }

    // Player collision with obstacles (if obstacles exist)
    if (this.obstacles) {
      this.physics.add.collider(this.player, this.obstacles)
      this.physics.add.collider(this.enemies, this.obstacles)
      if (this.boss) {
        this.physics.add.collider(this.boss, this.obstacles)
      }
    }

    // Player takes damage and gets knocked back when colliding with enemies
    this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
      if (player.isInvulnerable || player.isHurting || player.isDead || enemy.isDead) return

      // Knockback effect
      const knockbackForce = 200
      const direction = player.x > enemy.x ? 1 : -1
      player.body.setVelocityX(direction * knockbackForce)

      // Player takes damage
      player.takeDamage(20)
    })

    // Player takes damage and gets knocked back when colliding with Boss (if Boss exists)
    if (this.boss) {
      this.physics.add.overlap(this.player, this.boss, (player, boss) => {
        if (player.isInvulnerable || player.isHurting || player.isDead || boss.isDead) return

        // Knockback effect
        const knockbackForce = 300 // Boss collision force is greater
        const direction = player.x > boss.x ? 1 : -1
        player.body.setVelocityX(direction * knockbackForce)

        // Player takes damage
        player.takeDamage(30) // Boss collision damage is higher
      })
    }

    // Player collision with medical kits
    this.physics.add.overlap(this.player, this.medicalKits, (player, medicalKit) => {
      if (!player.isDead && !medicalKit.isPickedUp) {
        medicalKit.pickup(player)
      }
    })

    // Player collision with enemy bullets
    this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
      if (player.isInvulnerable || player.isHurting || player.isDead) return

      // Knockback effect
      const knockbackForce = 150
      // For normal sprite bullets, judge direction by velocity; for EnemyBullet, use direction property
      const direction = bullet.direction !== undefined ? bullet.direction : (bullet.body.velocity.x > 0 ? 1 : -1)
      player.body.setVelocityX(direction * knockbackForce)

      // Player takes damage - use default damage for normal sprite bullets; use damage property for EnemyBullet
      const damage = bullet.damage !== undefined ? bullet.damage : 15
      player.takeDamage(damage)

      // Destroy bullet - check if hit method exists
      if (typeof bullet.hit === 'function') {
        bullet.hit()
      } else {
        bullet.destroy()
      }
    })

    // Enemy bullets collision with ground
    this.physics.add.collider(this.enemyBullets, this.groundLayer, (bullet, tile) => {
      if (typeof bullet.hit === 'function') {
        bullet.hit()
      } else {
        bullet.destroy()
      }
    })

    // Enemy bullets collision with platforms (if platform layer exists)
    if (this.platformsLayer) {
      this.physics.add.collider(this.enemyBullets, this.platformsLayer, (bullet, tile) => {
        if (typeof bullet.hit === 'function') {
          bullet.hit()
        } else {
          bullet.destroy()
        }
      })
    }

    // Enemy bullets collision with obstacles (if obstacles exist)
    if (this.obstacles) {
      this.physics.add.collider(this.enemyBullets, this.obstacles, (bullet, obstacle) => {
        if (typeof bullet.hit === 'function') {
          bullet.hit()
        } else {
          bullet.destroy()
        }
      })
    }
  }

  setupInputs() {
    // Create custom key controls
    const keyConfig = gameConfig.keyConfig
    
    // Create movement keys (both arrow keys and WASD)
    this.cursors = {
      up: this.input.keyboard.addKey(keyConfig.up.value),
      down: this.input.keyboard.addKey(keyConfig.down.value),
      left: this.input.keyboard.addKey(keyConfig.left.value),
      right: this.input.keyboard.addKey(keyConfig.right.value),
      // Add WASD keys
      wasdUp: this.input.keyboard.addKey(keyConfig.wasdUp.value),
      wasdDown: this.input.keyboard.addKey(keyConfig.wasdDown.value),
      wasdLeft: this.input.keyboard.addKey(keyConfig.wasdLeft.value),
      wasdRight: this.input.keyboard.addKey(keyConfig.wasdRight.value)
    }
    
    // Create attack keys
    this.shootKey = this.input.keyboard.addKey(keyConfig.shoot.value)
    this.meleeKey = this.input.keyboard.addKey(keyConfig.melee.value)
    this.interactKey = this.input.keyboard.addKey(keyConfig.interact.value)
    
    // Add crouch key (use down key as crouch key)
    this.crouchKey = this.cursors.down
    
    // Create player bullets group
    this.playerBullets = this.add.group()
    
    // Set player bullets collision with enemies
    this.physics.add.overlap(this.playerBullets, this.enemies, (bullet, enemy) => {
      if (enemy.isDead || enemy.isHurting) return

      // Knockback effect
      const knockbackForce = 200
      const direction = bullet.body.velocity.x > 0 ? 1 : -1
      enemy.body.setVelocityX(direction * knockbackForce)

      // Enemy takes damage
      enemy.takeDamage(gameConfig.playerConfig.attackDamage.value)

      // Destroy bullet
      bullet.destroy()
    })

    // Set player bullets collision with Boss (if Boss exists)
    if (this.boss) {
      this.physics.add.overlap(this.playerBullets, this.boss, (bullet, boss) => {
        if (boss.isDead || boss.isHurting) return

        // Knockback effect (Boss is harder to knock back)
        const knockbackForce = 100
        const direction = bullet.body.velocity.x > 0 ? 1 : -1
        boss.body.setVelocityX(direction * knockbackForce)

        // Boss takes damage
        boss.takeDamage(gameConfig.playerConfig.attackDamage.value)

        // Destroy bullet
        bullet.destroy()
      })
    }

    // Set player bullets collision with ground
    this.physics.add.collider(this.playerBullets, this.groundLayer, (bullet, tile) => {
      bullet.destroy()
    })

    // Set player bullets collision with platforms (if platform layer exists)
    if (this.platformsLayer) {
      this.physics.add.collider(this.playerBullets, this.platformsLayer, (bullet, tile) => {
        bullet.destroy()
      })
    }

    // Set player bullets collision with obstacles (if obstacles exist)
    if (this.obstacles) {
      this.physics.add.collider(this.playerBullets, this.obstacles, (bullet, obstacle) => {
        bullet.destroy()
      })
    }
  }

  // Setup attack collision detection
  setupAttackCollision() {
    // Setup player melee trigger collision detection with enemies
    this.physics.add.overlap(
      this.player.meleeTrigger,
      this.enemies,
      (trigger, enemy) => {
        if (this.player.isAttacking && !this.player.currentMeleeTargets.has(enemy)) {
          // Don't respond when dead or hurt
          if (enemy.isHurting || enemy.isDead) return
          // Add enemy to attacked list
          this.player.currentMeleeTargets.add(enemy)

          // Knockback effect
          const knockbackForce = 300
          const direction = enemy.x > this.player.x ? 1 : -1
          enemy.body.setVelocityX(direction * knockbackForce)

          // Finally call takeDamage
          enemy.takeDamage(gameConfig.playerConfig.attackDamage.value)
        }
      }
    )

    // Setup player melee trigger collision detection with Boss (if Boss exists)
    if (this.boss) {
      this.physics.add.overlap(
        this.player.meleeTrigger,
        this.boss,
        (trigger, boss) => {
          if (this.player.isAttacking && !this.player.currentMeleeTargets.has(boss)) {
            // Don't respond when dead or hurt
            if (boss.isHurting || boss.isDead) return
            // Add Boss to attacked list
            this.player.currentMeleeTargets.add(boss)

            // Knockback effect (Boss is harder to knock back)
            const knockbackForce = 150
            const direction = boss.x > this.player.x ? 1 : -1
            boss.body.setVelocityX(direction * knockbackForce)

            // Finally call takeDamage
            boss.takeDamage(gameConfig.playerConfig.attackDamage.value)
          }
        }
      )

      // Setup Boss attack trigger collision detection with player
      this.physics.add.overlap(
        this.boss.attackTrigger,
        this.player,
        (trigger, player) => {
          if (this.boss.isAttacking && !this.boss.currentAttackTargets.has(player)) {
            // Don't respond when dead, hurt, or invulnerable
            if (player.isHurting || player.isDead || player.isInvulnerable) return
            // Add player to attacked list
            this.boss.currentAttackTargets.add(player)

            // Knockback effect (Boss attack force is very high)
            const knockbackForce = 400
            const direction = player.x > this.boss.x ? 1 : -1
            player.body.setVelocityX(direction * knockbackForce)

            // Finally call takeDamage
            player.takeDamage(gameConfig.bossConfig.attackDamage.value)
          }
        }
      )
    }
  }

  // General update method
  baseUpdate() {
    // Update player
    this.player.update(this.cursors, this.shootKey, this.meleeKey, this.crouchKey)

    // Update enemies
    this.enemies.children.entries.forEach(enemy => {
      if (enemy.active) {
        enemy.update()
      }
    })

    // Update Boss (if exists)
    if (this.boss && this.boss.active) {
      this.boss.update(this.time.now, this.player)
    }

    // Update enemy bullets
    this.enemyBullets.children.entries.forEach(bullet => {
      if (bullet.active) {
        bullet.update()
      }
    })

    // Check if all enemies are defeated
    this.checkEnemiesDefeated()
  }

  // Check if all enemies are defeated (general method)
  checkEnemiesDefeated() {
    const currentEnemyCount = this.enemies.children.entries.filter(enemy => enemy.active).length
    const bossAlive = this.boss && this.boss.active && !this.boss.isDead

    // If all enemies are defeated and Boss is also defeated (if Boss exists), launch corresponding UI scene
    if (currentEnemyCount === 0 && !bossAlive && !this.gameCompleted) {
      this.gameCompleted = true

      if (this.isLastLevel()) {
        console.log("Game completed!")
        this.scene.launch("GameCompleteUIScene", { 
          currentLevelKey: this.scene.key
        })
      } else {
        this.scene.launch("VictoryUIScene", { 
          currentLevelKey: this.scene.key
        })
      }
    }
  }

  // Method to set map size - subclass needs to override
  setupMapSize() {
    throw new Error("setupMapSize method must be implemented by subclass")
  }

  // Method to create medical kits - subclass needs to override
  createMedicalKits() {
    // Subclass needs to override this method to create medical kits
  }

  // Create player - subclass needs to override
  createPlayer() {
    throw new Error("createPlayer method must be implemented by subclass")
  }

  // Create enemies - subclass needs to override
  createEnemies() {
    throw new Error("createEnemies method must be implemented by subclass")
  }

  // Create Boss - subclass can override (default no Boss)
  createBoss() {
    // Default no Boss, subclass can override this method to create Boss
  }

  // Create background - subclass needs to override
  createBackground() {
    throw new Error("createBackground method must be implemented by subclass")
  }

  // Create map - subclass needs to override
  createTileMap() {
    throw new Error("createTileMap method must be implemented by subclass")
  }

  // Create decorations - subclass needs to override
  createDecorations() {
    throw new Error("createDecorations method must be implemented by subclass")
  }
}