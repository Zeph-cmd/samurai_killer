import { BaseLevelScene } from './BaseLevelScene.js'
import { EliteSoldier } from '../EliteSoldier.js'
import { FemaleCommando } from '../FemaleCommando.js'
import { MaskedMilitant } from '../MaskedMilitant.js'
import { MedicalKit } from '../MedicalKit.js'
import { JapaneseSamuraiBoss } from '../JapaneseSamuraiBoss.js'
import gameConfig from '../gameConfig.json'

export class Level1Scene extends BaseLevelScene {
  constructor() {
    super({
      key: "Level1Scene",
    })
  }

  preload() {
    // Create bullet textures
    this.createBulletTextures()
  }

  create() {
    // Create base game elements
    this.createBaseElements()

    // Listen for Boss defeated event
    this.events.on('bossDefeated', () => {
      console.log("Boss has been defeated!")
    })

    // Play background music
    this.backgroundMusic = this.sound.add("battle_theme", {
      volume: 0.6,
      loop: true
    })
    this.backgroundMusic.play()
  }

  update() {
    // Call base update method
    this.baseUpdate()
  }

  // Method to set map size, map is 40x20
  setupMapSize() {
    this.mapWidth = 40 * gameConfig.mapConfig.tileSize.value
    this.mapHeight = 20 * gameConfig.mapConfig.tileSize.value
  }

  // Create player
  createPlayer() {
    // Place player on flat ground (tile coordinates: 3, 18)
    const playerX = 3 * gameConfig.mapConfig.tileSize.value
    const playerY = 18 * gameConfig.mapConfig.tileSize.value

    // Create player based on selected character
    const selectedCharacter = gameConfig.gameSettings.selectedCharacter.value
    if (selectedCharacter === "female_commando") {
      this.player = new FemaleCommando(this, playerX, playerY)
    } else {
      this.player = new EliteSoldier(this, playerX, playerY)
    }
  }

  // Create background
  createBackground() {
    // Calculate background scale ratio
    const bgScale = this.mapHeight / 1024 // Background height adapts to map height

    // Create multiple backgrounds for horizontal stitching
    const bgWidth = 1536 * bgScale
    const numBackgrounds = Math.ceil(this.mapWidth / bgWidth) + 1

    for (let i = 0; i < numBackgrounds; i++) {
      const bg = this.add.image(i * bgWidth, this.mapHeight / 2, "jungle_battlefield_bg")
      bg.setScale(bgScale)
      bg.setOrigin(0, 0.5)
      bg.setScrollFactor(0.2) // Parallax scrolling
    }
  }

  // Create tile map
  createTileMap() {
    // Use new simplified map (platforms only, no obstacles)
    this.map = this.make.tilemap({ key: "simple_jungle_level_map" })

    // Add tileset
    this.tileset = this.map.addTilesetImage("jungle_ground_tileset", "jungle_ground_tileset")

    // Create layers
    this.groundLayer = this.map.createLayer("ground", this.tileset, 0, 0)
    this.platformsLayer = this.map.createLayer("platforms", this.tileset, 0, 0)

    // Set ground and platform collisions - exclude blank tiles (index -1)
    this.groundLayer.setCollisionByExclusion([-1])
    this.platformsLayer.setCollisionByExclusion([-1])

    // No longer create obstacle sprites
  }

  // Create decoration elements
  createDecorations() {
    // Add decorations on ground (jungle style, fewer obstacles)

    // Left decorations
    this.createDecoration("jungle_plants_variant_1", 1 * gameConfig.mapConfig.tileSize.value, 18 * gameConfig.mapConfig.tileSize.value, 0.4)
    this.createDecoration("jungle_rocks_variant_1", 8.5 * gameConfig.mapConfig.tileSize.value, 18 * gameConfig.mapConfig.tileSize.value, 0.3)

    // Center decorations
    this.createDecoration("jungle_plants_variant_2", 16 * gameConfig.mapConfig.tileSize.value, 18 * gameConfig.mapConfig.tileSize.value, 0.4)
    this.createDecoration("jungle_rocks_variant_2", 24 * gameConfig.mapConfig.tileSize.value, 18 * gameConfig.mapConfig.tileSize.value, 0.3)

    // Right decorations
    this.createDecoration("jungle_plants_variant_3", 30 * gameConfig.mapConfig.tileSize.value, 18 * gameConfig.mapConfig.tileSize.value, 0.4)
    this.createDecoration("jungle_rocks_variant_3", 37 * gameConfig.mapConfig.tileSize.value, 18 * gameConfig.mapConfig.tileSize.value, 0.3)
  }

  // Helper method to create single decoration
  createDecoration(assetName, x, y, scale) {
    const decoration = this.add.image(x, y, assetName)
    decoration.setOrigin(0.5, 1) // Bottom center alignment
    decoration.setScale(scale)
    this.decorations.add(decoration)
  }

  // Create enemies
  createEnemies() {
    // Place enemies on platforms and ground (simplified version)

    // Ground enemies (reduced count)
    const enemy1X = 18 * gameConfig.mapConfig.tileSize.value
    const enemy1Y = 18 * gameConfig.mapConfig.tileSize.value
    const enemy1 = new MaskedMilitant(this, enemy1X, enemy1Y)
    this.enemies.add(enemy1)

    const enemy2X = 36 * gameConfig.mapConfig.tileSize.value
    const enemy2Y = 18 * gameConfig.mapConfig.tileSize.value
    const enemy2 = new MaskedMilitant(this, enemy2X, enemy2Y)
    this.enemies.add(enemy2)

    // Platform enemies (adjusted according to new map positions)
    const enemy3X = 12 * gameConfig.mapConfig.tileSize.value
    const enemy3Y = 15 * gameConfig.mapConfig.tileSize.value // Left platform
    const enemy3 = new MaskedMilitant(this, enemy3X, enemy3Y)
    this.enemies.add(enemy3)

    const enemy4X = 22 * gameConfig.mapConfig.tileSize.value
    const enemy4Y = 13 * gameConfig.mapConfig.tileSize.value // Center platform
    const enemy4 = new MaskedMilitant(this, enemy4X, enemy4Y)
    this.enemies.add(enemy4)

    // Reset enemy attack collision detection
    this.setupEnemyAttackCollision()
  }

  // Setup enemy attack collision detection separately
  setupEnemyAttackCollision() {
    this.enemies.children.entries.forEach(enemy => {
      this.physics.add.overlap(
        enemy.attackTrigger,
        this.player,
        (trigger, player) => {
          if (enemy.isAttacking && !enemy.currentAttackTargets.has(player)) {
            // Don't respond when dead, hurt, or invulnerable
            if (player.isHurting || player.isDead || player.isInvulnerable) return
            // Add player to attacked list
            enemy.currentAttackTargets.add(player)

            // Knockback effect
            const knockbackForce = 250
            const direction = player.x > enemy.x ? 1 : -1
            player.body.setVelocityX(direction * knockbackForce)

            // Finally call takeDamage
            player.takeDamage(20)
          }
        }
      )
    })
  }

  // Create Boss
  createBoss() {
    // Place Boss closer to player for easier debugging
    const bossX = 10 * gameConfig.mapConfig.tileSize.value  // Position adjusted to tile 10
    const bossY = 18 * gameConfig.mapConfig.tileSize.value

    console.log('Creating boss at position:', bossX, bossY)
    console.log('Map size:', this.mapWidth, 'x', this.mapHeight)

    this.boss = new JapaneseSamuraiBoss(this, bossX, bossY)

    console.log('Boss created:', this.boss)
    console.log('Boss position:', this.boss.x, this.boss.y)
    console.log('Boss scale:', this.boss.scaleX, this.boss.scaleY)
    console.log('Boss active:', this.boss.active)
    console.log('Boss visible:', this.boss.visible)
  }

  // Create medical kits
  createMedicalKits() {
    // Place medical kits on ground and platforms

    // Ground medical kits
    const medKit1 = new MedicalKit(this, 8 * gameConfig.mapConfig.tileSize.value, 18 * gameConfig.mapConfig.tileSize.value)
    this.medicalKits.add(medKit1)

    const medKit2 = new MedicalKit(this, 28 * gameConfig.mapConfig.tileSize.value, 18 * gameConfig.mapConfig.tileSize.value)
    this.medicalKits.add(medKit2)

    // Platform medical kits (adjusted according to new map)
    const medKit3 = new MedicalKit(this, 32 * gameConfig.mapConfig.tileSize.value, 15 * gameConfig.mapConfig.tileSize.value) // Right platform
    this.medicalKits.add(medKit3)
  }
}