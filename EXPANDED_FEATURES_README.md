# THALAPATHY — The Game [EXPANDED]

A 2D side-scrolling action game set in Salem's Naripaddi street. The fuse carrier from the current kambam (electrical transformer) was stolen — fight through 10 levels of street gangs and multiple bosses to recover it and restore power.

## What's New in This Version

### 1. **10-Level Campaign** (Previously 5)
- **Levels 1-3:** Regular gang levels (5-7 enemies each)
- **Level 4:** FIRST BOSS ENCOUNTER
- **Levels 5-6:** Stronger gangs (9-10 enemies each)
- **Level 7:** SECOND BOSS ENCOUNTER
- **Levels 8-9:** Elite forces (11-12 enemies each)
- **Level 10:** FINAL SHOWDOWN with MOOTHA THALAIVAN

### 2. **Improved Boss AI**
- Bosses now have **three attack types**:
  - **Punch** — powerful melee attack
  - **Kick** — extended range attack
  - **Shoot** — ranged gun attacks
- **Smarter attack selection** — bosses vary their attacks instead of just punching
- **Increased difficulty** — boss health scales from 320-380+ depending on level
- **Separate boss health bar** — always visible during boss fights

### 3. **Fuse Collection System**
- When a boss is defeated, it **drops the fuse**
- Player must collect the fuse to proceed
- Fuses restore ammo and give score bonus (40 pts for regular, 200 pts for boss fuse)

### 4. **Current Kambam Collectible**
- After collecting the fuse from a boss, a **current kambam (transformer) spawns**
- Player must reach and touch it to complete the mission
- HUD shows: `CURRENT: OFF` → `CURRENT: ON` when collected
- Massive score bonus (200 pts) for completing the mission

### 5. **Mission Complete Screen**
- Appears after defeating a boss AND collecting the fuse AND activating the kambam
- Gives option to:
  - Return to main menu
  - Jump into Wave Mode

### 6. **Final Victory Screen** (Level 10)
- After defeating the final boss and activating the final kambam
- Shows final score and high score (if beaten)
- Options: Play Again, Wave Mode, Main Menu

### 7. **Wave Mode** (Endless)
- Infinite enemy waves with increasing difficulty
- Boss appears every 5 waves
- Enemy speed and health scale with each wave
- Track max wave reached with localStorage
- Shows current wave in HUD

### 8. **High Score Tracking**
- **High Score** — best score across all playthroughs (saved in localStorage)
- **Max Wave** — furthest wave reached in Wave Mode (saved in localStorage)
- Automatically saved when beating previous scores

### 9. **Enhanced Game Over Screen**
- **Campaign Mode:** Retry Level / Main Menu
- **Wave Mode:** Retry Endless / Main Menu
- Clean separation between modes

## Installation & Running

1. **Copy all three files** into your game directory:
   - `index.html`
   - `style.css`
   - `game.js`

2. **Add sprite folder** (optional, but recommended):
   - Create `assets/sprites/` directory
   - Copy your PNGs matching the exact filenames from the README

3. **Open in browser** — just double-click `index.html` or serve with a static server:
   ```bash
   python3 -m http.server 8000
   # Then visit http://localhost:8000
   ```

## Controls

| Action | Keyboard | Touch |
|--------|----------|-------|
| Move Left | ← | Left Pad ◂ |
| Move Right | → | Right Pad ▸ |
| Jump | ↑ | Jump Button ▲ |
| Sprint | Shift (hold) | Move + direction |
| Punch | J | Punch Button 👊 |
| Kick | K | Kick Button 🦵 |
| Shoot | L | Shoot Button 🔫 |
| Mute | Click 🔊 Button | Click 🔊 Button |

## Game Structure

```
MAIN MENU
├── START → Story Mode
│   ├── Level 1-3: Regular Enemies
│   ├── Level 4: Boss 1
│   ├── Level 5-6: Regular Enemies
│   ├── Level 7: Boss 2
│   ├── Level 8-9: Regular Enemies
│   └── Level 10: Final Boss
│       └── Mission Complete
│           └── Victory Screen
├── WAVE MODE
│   ├── Infinite waves
│   ├── Boss every 5 waves
│   └── Track max wave
└── EXIT
```

## Level Details

| Level | Name | Enemies | Boss? | Theme |
|-------|------|---------|-------|-------|
| 1 | NARIPADDI STREET | 5 | No | street |
| 2 | MARKET FIGHT | 6 | No | market |
| 3 | BUS STAND FIGHT | 7 | No | busstand |
| 4 | FACTORY HIDEOUT | 1 | **YES** | factory |
| 5 | WAREHOUSE DISTRICT | 9 | No | warehouse |
| 6 | DOCKSIDE BRAWL | 10 | No | dock |
| 7 | SECOND BOSS ENCOUNTER | 1 | **YES** | garage |
| 8 | UNDERPASS GANG | 11 | No | underpass |
| 9 | INDUSTRIAL CORE | 12 | No | industrial |
| 10 | FINAL SHOWDOWN | 1 | **YES** | boss |

## Tweaking & Customization

All game balance settings are at the **top of `game.js`**:

```javascript
const LEVELS = [ ... ]; // Edit level properties
const GRAVITY = 0.85; // Jump feel
const JUMP_VELOCITY = -14.5; // Jump height
const PUNCH_DMG = 8; // Damage values
const KICK_DMG = 13;
const SHOOT_DMG = 10;
const FRAME_MS = { ... }; // Animation speed
```

### Boss Customization
```javascript
class Enemy {
  constructor(x, speedMult, isBoss) {
    this.maxHealth = isBoss ? 320 : 32; // Adjust boss health
    this.gunCooldown = isBoss ? 2000 : Infinity; // Boss gun fire rate
    this.punchCooldown = isBoss ? 0 : Infinity; // Boss punch rate
    this.kickCooldown = isBoss ? 0 : Infinity; // Boss kick rate
  }
}
```

### Wave Mode Settings
```javascript
function startEndless() {
  game.waveEnemyCount = 3; // Starting enemies per wave
  // Waves scale by: 3 + floor((wave-1)*0.5)
}
```

## Sprite Art Integration

Put your PNGs into **`assets/sprites/`** using these **exact filenames**:

### Hero Animations
- `idel.png` — Idle
- `Walking 1.png`, `Walking 2.png`, `Walking 3.png` — Walk cycle
- `Sprint 1.png`, `Sprint 2.png` — Sprint cycle
- `jump.png` — Jump
- `Punch.png` — Punch attack
- `Kick 1.png`, `Kick 2.png` — Kick cycle
- `Aim.png`, `Shoot.png` — Shoot sequence
- `Crouch.png` — Hurt/hurt reaction
- `Death.png` — Death animation

### Villain (Enemy & Boss) Animations
- `Villan idel.png` — Idle
- `villan walk 1.png`, `villan walk 2.png` — Walk cycle
- `Villan Attack 1.png`, `villsn attack 2.png`, `villsn attack 3.png` — Attack sequence
- `villain hurt 1.png`, `villain hurt 2.png` — Hurt reactions
- `villan death 1.png`, `villan death 2.png`, `Villan 2.png` — Death sequence
- `Sprint villan .png` — Sprint (boss only)

**Note:** Filenames must match **exactly** including capitalization and spaces. The game will use stylized placeholder fighters if sprites aren't found.

## What's Preserved

✅ All existing sprite loading system  
✅ All existing animations and frame timing  
✅ HUD system unchanged (same styling)  
✅ Canvas rendering pipeline  
✅ Player movement and physics  
✅ Enemy AI (enhanced)  
✅ Boss AI (upgraded)  
✅ Camera system  
✅ Touch & keyboard controls  
✅ All HTML IDs and CSS classes  
✅ All file paths and structure  
✅ Audio system (music & SFX)  
✅ Particle effects and sparks  

## Audio Files (Optional)

Place these in `assets/audio/` for sound/music:
- `Bgm.mp3` — Background music
- `sfx_shoo.wav` — Shoot sound
- `sfx_hit.wav` — Hit/impact sound
- `sfx_collect.wav` — Collectible pickup
- `sfx_empty.wav` — Empty ammo click
- `sfx_gameover.mp3` — Game over sound

Missing audio files are silently ignored; the game runs fine without them.

## Performance Notes

- The game runs at **60 FPS** target (capped at 40ms per frame)
- Fully playable on mobile, tablet, and desktop
- Responsive design automatically adjusts UI for screen size
- Canvas rendering uses image-rendering optimization for crisp sprites

## Browser Compatibility

- Modern browsers with HTML5 Canvas support
- Chrome, Firefox, Safari, Edge (current versions)
- Mobile browsers (iOS Safari, Chrome Android, Firefox Android)
- Works offline (no external dependencies)

## Credits & Attribution

- Game design and code: THALAPATHY Project
- Setting: Naripaddi, Salem
- Audio: Optional custom assets
- Sprites: Drop your own PNG files

---

**THALAPATHY — Power of the Streets**  
*An expanded 2D action game with 10 levels, 3 boss fights, and infinite wave mode.*
