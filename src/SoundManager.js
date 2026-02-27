import { Sound } from "@babylonjs/core";

const ASSET_BASE = "https://specai-game-assets.s3.us-west-1.amazonaws.com/632";

const SOUND_URLS = {
  // Sound effects
  ui_select: `${ASSET_BASE}/sound_effects/ui_select.mp3`,
  game_over: `${ASSET_BASE}/sound_effects/game_over.mp3`,
  rifle_shot: `${ASSET_BASE}/sound_effects/rifle_shot.mp3`,
  ak47_shot: `${ASSET_BASE}/sound_effects/ak47_shot.mp3`,
  explosion: `${ASSET_BASE}/sound_effects/explosion.mp3`,
  grenade_throw: `${ASSET_BASE}/sound_effects/grenade_throw.mp3`,
  footsteps_concrete: `${ASSET_BASE}/sound_effects/footsteps_concrete.mp3`,
  enemy_death: `${ASSET_BASE}/sound_effects/enemy_death.mp3`,
  medical_pickup: `${ASSET_BASE}/sound_effects/medical_pickup.mp3`,
  enemy_rifle_shot: `${ASSET_BASE}/sound_effects/enemy_rifle_shot.mp3`,
  samurai_battle_cry: `${ASSET_BASE}/sound_effects/samurai_battle_cry.mp3`,
  samurai_sword_slash: `${ASSET_BASE}/sound_effects/samurai_sword_slash.mp3`,
  boss_death: `${ASSET_BASE}/sound_effects/boss_death.mp3`,
  // Music
  battle_theme: `${ASSET_BASE}/music/battle_theme.wav`,
};

export class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
    this.music = null;
    this.musicKey = null;
    this.loaded = false;
  }

  async loadAll() {
    const loadPromises = Object.entries(SOUND_URLS).map(([key, url]) => {
      return new Promise((resolve) => {
        try {
          const isMusic = key.includes("theme");
          const sound = new Sound(
            key,
            url,
            this.scene,
            () => resolve(),
            {
              loop: isMusic,
              volume: isMusic ? 0.4 : 0.6,
              autoplay: false,
            }
          );
          this.sounds[key] = sound;
        } catch (e) {
          console.warn(`Failed to load sound: ${key}`, e);
          resolve(); // Don't block on individual sound failures
        }
      });
    });

    // Wait with timeout — don't block forever
    await Promise.race([
      Promise.all(loadPromises),
      new Promise((resolve) => setTimeout(resolve, 10000)),
    ]);

    this.loaded = true;
  }

  play(key) {
    const sound = this.sounds[key];
    if (sound && sound.isReady()) {
      // Stop any previous instance of this sound if it's currently playing
      if (sound.isPlaying) {
        sound.stop();
      }
      sound.play();
    }
  }

  playMusic(key) {
    // Stop current music
    this.stopMusic();

    const sound = this.sounds[key];
    if (sound && sound.isReady()) {
      sound.play();
      this.music = sound;
      this.musicKey = key;
    }
  }

  stopMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
    this.music = null;
    this.musicKey = null;
  }

  setMusicVolume(vol) {
    if (this.music) {
      this.music.setVolume(vol);
    }
  }

  dispose() {
    Object.values(this.sounds).forEach((s) => {
      if (s) s.dispose();
    });
    this.sounds = {};
    this.music = null;
  }
}
