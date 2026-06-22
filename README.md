# GOAT — Power of the Streets

A 2D side-scrolling action game set in Salem's Naripaddi street. Someone stole
the fuse carrier from the current kambam — fight through 5 levels of street
gangs and a final boss to get it back.

## Run it
Just open `index.html` in a browser (or serve the folder with any static
server — double-clicking works fine too). No build step, no dependencies.

## Adding your real sprites
The game runs immediately with stylised placeholder fighters, but it's wired
up to use your actual art the moment you drop it in.

Put your PNGs into **`assets/sprites/`** using these **exact filenames**
(this matches the "Thalapathy Sprite" folder you already have — you can copy
the whole folder in and just rename it to `sprites`):

**Hero**
| Animation | File(s) |
|---|---|
| Idle | `idel.png` |
| Walk (3 frames) | `Walking 1.png`, `Walking 2.png`, `Walking 3.png` |
| Sprint (2 frames) | `Sprint 1.png`, `Sprint 2.png` |
| Jump | `jump.png` |
| Punch | `Punch.png` |
| Kick (2 frames) | `Kick 1.png`, `Kick 2.png` |
| Shoot (aim → fire) | `Aim.png`, `Shoot.png` |
| Hurt | `Crouch.png` |
| Death | `Death.png` |

**Villain (used for every regular enemy AND the boss)**
| Animation | File(s) |
|---|---|
| Idle | `Villan idel.png` |
| Walk (2 frames) | `villan walk 1.png`, `villan walk 2.png` |
| Attack (3 frames) | `Villan Attack 1.png`, `villsn attack 2.png`, `villsn attack 3.png` |
| Hurt (2 frames) | `villain hurt 1.png`, `villain hurt 2.png` |
| Death (3 frames) | `villan death 1.png`, `villan death 2.png`, `Villan 2.png` |
| Sprint/charge (boss only) | `Sprint villan .png` (note the space before `.png`) |

Filenames (including capitalisation and spaces) must match exactly — they're
listed at the top of `game.js` in the `SPRITE_FILES` object if you ever want
to rename or remap anything.

## Controls
- **Keyboard:** ← → move, ↑ jump, Shift to sprint, J punch, K kick, L shoot
- **Touch:** on-screen pad bottom-left (move), bottom-right (jump/punch/kick/shoot)

## Structure
- `index.html` — markup, HUD, menus, touch controls
- `style.css` — all visual styling
- `game.js` — full game engine (physics, combat, AI, levels, boss fight)
- `assets/sprites/` — drop your PNGs here

## Levels
1. Naripaddi Street — street gang (5 enemies)
2. Market Fight (6 enemies)
3. Bus Stand Fight (7 enemies)
4. Factory Hideout (8 enemies)
5. Boss Fight — the fuse thief himself (melee + gun attacks)

## Tweaking
Everything balance-related lives near the top of `game.js`:
- `LEVELS` — enemy counts, speed, story text per level
- `GRAVITY`, `JUMP_VELOCITY` — jump feel
- `PUNCH_DMG`, `KICK_DMG`, `SHOOT_DMG` — damage values
- `FRAME_MS` — animation speed per move
