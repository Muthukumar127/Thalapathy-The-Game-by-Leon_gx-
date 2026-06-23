# THALAPATHY EXPANSION — Quick Start

## What You're Getting ✅

Three fully updated game files that preserve everything you love about the original while adding:

### 🎮 **10-Level Campaign** (was 5)
- Levels 4, 7, and 10 are boss fights
- Story progresses through 10 unique locations
- Final victory after defeating the ultimate boss

### 💪 **Improved Boss AI**
- Bosses now **punch, kick, AND shoot** randomly
- Smarter attack selection instead of just one move
- Higher health and damage per boss level

### ⚡ **Fuse System**
- Bosses drop fuses when defeated
- Player collects fuse to continue progression
- Score bonuses for collection

### 🔌 **Current Kambam Collectible**
- After collecting fuse, a transformer spawns
- Must reach it to complete the mission
- HUD shows `CURRENT: OFF` → `CURRENT: ON`

### 🌊 **Wave Mode** (Infinite Enemies)
- Fight endless waves with increasing difficulty
- Boss every 5 waves
- Track your max wave with localStorage

### 📊 **High Score Tracking**
- Best score saved automatically
- Max wave reached saved automatically
- Persists across browser sessions

### 🎯 **Complete UI Overhaul**
- Mission Complete screen
- Enhanced victory screen with high score
- Proper Game Over screen for both modes
- Separated campaign vs wave mode menus

---

## 📥 Installation (30 seconds)

### Option 1: Direct Replacement
1. Download the 3 files from the outputs folder:
   - `game.js`
   - `index.html`
   - `style.css`

2. Replace them in your game directory

3. Open `index.html` in browser

**That's it!** All your existing sprites and audio work unchanged.

### Option 2: Fresh Start
```bash
# If you don't have the game yet
git clone your-game-repo
# Replace the 3 files
cp game.js index.html style.css your-game-repo/
cd your-game-repo
python3 -m http.server 8000
# Visit http://localhost:8000
```

---

## 🎮 What Hasn't Changed (Preserved)

✅ All sprite loading and animation timing  
✅ HUD layout and styling  
✅ Canvas rendering system  
✅ Player movement and physics  
✅ Enemy AI (enhanced, not replaced)  
✅ Touch and keyboard controls  
✅ All HTML IDs and CSS classes  
✅ Audio system  
✅ File structure  

**Your sprite folder works exactly as before.**

---

## 🚀 New Features at a Glance

| Feature | How It Works |
|---------|--------------|
| **10 Levels** | Progress through 10 stages; bosses at 4, 7, 10 |
| **Fuse System** | Boss drops fuse → collect it → proceed to next level |
| **Kambam** | Collect fuse → kambam spawns → touch it to complete mission |
| **Boss Variety** | Bosses punch, kick, and shoot (not just one attack) |
| **Wave Mode** | Infinite enemies, boss every 5 waves, unlimited fun |
| **High Scores** | Automatic localStorage tracking of score and max wave |

---

## 🕹️ Controls (Unchanged)

**Keyboard:**
- ← / → : Move
- ↑ : Jump
- Shift : Sprint
- J : Punch
- K : Kick
- L : Shoot

**Touch:**
- Left pad: Move
- Right pad: Punch, Kick, Jump, Shoot

---

## 📝 Next Steps

1. **Read EXPANDED_FEATURES_README.md** for detailed feature list
2. **Read CHANGELOG.md** to see exactly what changed
3. **Replace the 3 files** and test
4. **Customize** difficulty in game.js if needed (see EXPANDED_FEATURES_README.md)

---

## 🔧 Customization Quick Reference

Open `game.js` and find these sections to tweak:

```javascript
// Edit levels (line 52)
const LEVELS = [ ... ];

// Edit damage (line 47)
const PUNCH_DMG = 8;
const KICK_DMG = 13;
const SHOOT_DMG = 10;

// Edit jump feel (lines 50-51)
const GRAVITY = 0.85;
const JUMP_VELOCITY = -14.5;

// Edit boss health (line 648)
this.maxHealth = isBoss ? 320 : 32;

// Edit boss attack rates (lines 651-654)
this.gunCooldown = isBoss ? 2000 : Infinity;
this.punchCooldown = isBoss ? 0 : Infinity;
this.kickCooldown = isBoss ? 0 : Infinity;
```

---

## 📱 Device Support

✅ **Desktop** — Full experience with keyboard controls  
✅ **Tablet** — Touch pad + full HUD  
✅ **Mobile** — Responsive touch controls, optimized HUD  
✅ **Landscape** — Special adjustments for landscape orientation  

---

## 🎨 Sprite Integration (Optional)

Drop your PNGs into `assets/sprites/` using exact filenames:

**Hero:** `idel.png`, `Walking 1.png`, `Walking 2.png`, `Walking 3.png`, `Sprint 1.png`, `Sprint 2.png`, `jump.png`, `Punch.png`, `Kick 1.png`, `Kick 2.png`, `Aim.png`, `Shoot.png`, `Crouch.png`, `Death.png`

**Villain:** `Villan idel.png`, `villan walk 1.png`, `villan walk 2.png`, `Villan Attack 1.png`, `villsn attack 2.png`, `villsn attack 3.png`, `villain hurt 1.png`, `villain hurt 2.png`, `villan death 1.png`, `villan death 2.png`, `Villan 2.png`, `Sprint villan .png`

If sprites are missing, the game uses stylized placeholder fighters (fully playable).

---

## 🔊 Audio (Optional)

Add to `assets/audio/`:
- `Bgm.mp3` — Background music
- `sfx_shoo.wav` — Shoot sound
- `sfx_hit.wav` — Hit sound
- `sfx_collect.wav` — Pickup sound
- `sfx_empty.wav` — Empty ammo sound
- `sfx_gameover.mp3` — Game over music

Missing audio is silently skipped; game runs fine without it.

---

## ❓ FAQ

**Q: Will my existing sprites break?**  
A: No! All sprite filenames and loading are identical.

**Q: Do I need to remove old files?**  
A: Just replace the 3 files (game.js, index.html, style.css). Everything else stays.

**Q: How do I change difficulty?**  
A: Edit `LEVELS` array in game.js to adjust enemy counts and speed. See EXPANDED_FEATURES_README.md for details.

**Q: Can I go back to the 5-level version?**  
A: Yes, keep your backup. But the expanded version includes all original content + more.

**Q: Does wave mode save progress?**  
A: Wave max is saved. Campaign progress requires completing levels in order.

**Q: Can I customize boss names?**  
A: Yes! Each level has a `bossName` property in the LEVELS array (game.js line ~85).

---

## 🎯 Game Flow Summary

```
START GAME
  ↓
CAMPAIGN MODE
  Level 1-3 (regular enemies)
  → Level 4 (BOSS + collect fuse + activate kambam)
  → Level 5-6 (regular enemies)
  → Level 7 (BOSS + collect fuse + activate kambam)
  → Level 8-9 (regular enemies)
  → Level 10 (FINAL BOSS + collect fuse + activate kambam)
  → VICTORY!
  ↓
MAIN MENU (or jump to Wave Mode)
  ↓
WAVE MODE
  Wave 1-4: Regular enemies
  Wave 5: BOSS
  Wave 6-9: Regular enemies
  Wave 10: BOSS
  (continues infinitely with scaling difficulty)
```

---

## ✨ What's Actually New (Technical)

- **10 levels** instead of 5 (all new locations and stories)
- **3 bosses** instead of 1 (levels 4, 7, 10)
- **Boss AI variety** — attacks now punch/kick/shoot randomly
- **Fuse + Kambam system** — two-stage boss completion
- **Mission Complete screen** — new overlay for boss missions
- **High score tracking** — localStorage integration
- **Wave mode enhancements** — proper endless scaling
- **Game state tracking** — `fuseCollected`, `kambamFound` flags

**Everything else preserved:** Sprites, animations, physics, HUD, controls, audio.

---

## 🏁 Ready to Play?

1. **Copy the 3 files** to your game directory
2. **Open index.html** in your browser
3. **Click START** to begin the 10-level campaign
4. **Collect fuses and activate kambams** to complete missions
5. **Try Wave Mode** for endless fun

---

**THALAPATHY — The Game [EXPANDED]**  
*10 levels. 3 bosses. Infinite waves. Full backward compatibility.*

Enjoy! 🎮⚡
