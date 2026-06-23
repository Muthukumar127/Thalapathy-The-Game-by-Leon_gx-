/* ===================================================================
   GOAT — Power of the Streets [EXPANDED]
   2D side-scrolling action game. Salem / Naripaddi setting.
   Drop real sprite PNGs into assets/sprites/ using the EXACT filenames
   listed in SPRITE_FILES below (matches the "Thalapathy Sprite" folder
   naming). Until real art is added, stylised placeholder fighters are
   drawn automatically so the game is fully playable out of the box.
=================================================================== */

(function(){
"use strict";

/* ============================ CONFIG ============================ */

const SPRITE_DIR = "assets/sprites/";

// Exact filenames as they appear in the user's sprite folder.
const SPRITE_FILES = {
  hero: {
    idle:   ["idel.png"],
    walk:   ["Walking 1.png","Walking 2.png","Walking 3.png"],
    sprint: ["Sprint 1.png","Sprint 2.png"],
    jump:   ["jump.png"],
    punch:  ["Punch.png"],
    kick:   ["Kick 1.png","Kick 2.png"],
    shoot:  ["Aim.png","Shoot.png"],
    hurt:   ["Crouch.png"],
    death:  ["Death.png"]
  },
  villain: {
    idle:   ["Villan idel.png"],
    walk:   ["villan walk 1.png","villan walk 2.png"],
    attack: ["Villan Attack 1.png","villsn attack 2.png","villsn attack 3.png"],
    hurt:   ["villain hurt 1.png","villain hurt 2.png"],
    death:  ["villan death 1.png","villan death 2.png"],
    sprint: ["Sprint villan .png"]
  }
};

const FRAME_MS = { // duration per frame, by animation name
  idle:140, walk:140, sprint:95, jump:120, punch:130, kick:130,
  shoot:160, hurt:160, death:220, attack:160
};

// If a character's art faces the "wrong" way when walking/attacking toward
// the other character, flip the corresponding value below between 1 / -1.
// hero:1, villain:-1 matches the supplied Thalapathy Sprite set.
const FLIP_CORRECTION = { hero: 1, villain: -1 };

const GRAVITY = 0.85;
const JUMP_VELOCITY = -14.5;
const GROUND_Y_RATIO = 0.82; // fraction of canvas height where feet stand
const WORLD_WIDTH = 2600;

const LEVELS = [
  {
    name: "NARIPADDI STREET",
    enemyCount: 5,
    enemySpeed: 1.0,
    theme: "street",
    intro: "The fuse carrier from the electric pole is missing. The whole Naripaddi area is in a power cut.",
    outro: "There is a gang here. But the fuse carrier is not with them. Go deeper and continue.",
    isBoss: false
  },
  {
    name: "MARKET FIGHT",
    enemyCount: 6,
    enemySpeed: 1.08,
    theme: "market",
    intro: "The market is full of gang members. Someone must reveal who stole it... but first, clear this area.",
    outro: "The market gang is defeated. The next clue says the thief was seen near the bus stand.",
    isBoss: false
  },
  {
    name: "BUS STAND FIGHT",
    enemyCount: 7,
    enemySpeed: 1.15,
    theme: "busstand",
    intro: "A stronger gang is waiting at the bus stand. This was only the warm-up. The truth about the thief will be revealed here.",
    outro: "One of them confessed — the fuse carrier was taken to the factory hideout.",
    isBoss: false
  },
  {
    name: "FACTORY HIDEOUT",
    enemyCount: 8,
    enemySpeed: 1.2,
    theme: "factory",
    intro: "The first boss guard arrives. Defeat him and the real thief's location will be revealed.",
    outro: "The first boss is defeated. But there are more powerful forces ahead.",
    isBoss: true,
    bossName: "FIRST BOSS GUARD"
  },
  {
    name: "WAREHOUSE DISTRICT",
    enemyCount: 9,
    enemySpeed: 1.25,
    theme: "warehouse",
    intro: "The warehouse district is a stronghold. More gang members await. Push forward.",
    outro: "The warehouse is clear. But something bigger awaits ahead.",
    isBoss: false
  },
  {
    name: "DOCKSIDE BRAWL",
    enemyCount: 10,
    enemySpeed: 1.3,
    theme: "dock",
    intro: "At the docks, rival gang territories collide. The strongest fighters guard this place.",
    outro: "The docks are yours now. One more major obstacle remains.",
    isBoss: false
  },
  {
    name: "SECOND BOSS ENCOUNTER",
    enemyCount: 1,
    enemySpeed: 1.4,
    theme: "garage",
    intro: "The second boss appears. This one is faster and more brutal. No mercy.",
    outro: "The second boss is down. Only one final confrontation remains.",
    isBoss: true,
    bossName: "SECOND GUARDIAN"
  },
  {
    name: "UNDERPASS GANG",
    enemyCount: 11,
    enemySpeed: 1.35,
    theme: "underpass",
    intro: "The underpass is controlled by a ruthless faction. Fight through them.",
    outro: "The underpass is cleared. The path to the final confrontation is open.",
    isBoss: false
  },
  {
    name: "INDUSTRIAL CORE",
    enemyCount: 12,
    enemySpeed: 1.4,
    theme: "industrial",
    intro: "This is the inner sanctum. The most dangerous fighters defend this fortress.",
    outro: "The industrial core falls. The thief is cornered.",
    isBoss: false
  },
  {
    name: "FINAL SHOWDOWN",
    enemyCount: 1,
    enemySpeed: 1.5,
    theme: "boss",
    intro: "This is the man who stole the fuse carrier from the electric pole. MOOTHA THALAIVAN — THE FUSE THIEF. He has both a gun and deadly melee skills. Defeat him, and Naripaddi will get its power back.",
    outro: "The fuse carrier has been recovered. The electric pole is back online. Naripaddi is safe again.",
    isBoss: true,
    bossName: "MOOTHA THALAIVAN — THE FUSE THIEF"
  }
];


/* ============================ CANVAS / GLOBAL ============================ */

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
let CW = 0, CH = 0, GROUND_Y = 0;

// Detect device type for responsive behavior
const DEVICE = {
  isMobile: window.innerWidth < 480,
  isTablet: window.innerWidth >= 480 && window.innerWidth < 900,
  isDesktop: window.innerWidth >= 900,
  isTouchDevice: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (window.matchMedia && window.matchMedia("(pointer:coarse)").matches),
  isLandscape: window.innerHeight < window.innerWidth,
  get width() { return window.innerWidth; },
  get height() { return window.innerHeight; }
};

function updateDeviceType() {
  DEVICE.isMobile = window.innerWidth < 480;
  DEVICE.isTablet = window.innerWidth >= 480 && window.innerWidth < 900;
  DEVICE.isDesktop = window.innerWidth >= 900;
  DEVICE.isLandscape = window.innerHeight < window.innerWidth;
  
  // Dynamically show/hide touch controls based on device
  const touchControls = document.getElementById("touch-controls");
  if (touchControls) {
    touchControls.style.display = DEVICE.isMobile || DEVICE.isTablet ? "flex" : "flex";
    touchControls.style.opacity = DEVICE.isMobile || DEVICE.isTablet ? "1" : "0.85";
  }
}

function resize(){
  const wrap = document.getElementById("game-wrap");
  CW = canvas.width = wrap.clientWidth;
  CH = canvas.height = wrap.clientHeight;
  GROUND_Y = CH * GROUND_Y_RATIO;
  updateDeviceType();
}
window.addEventListener("resize", resize);
resize();

// Handle orientation change for mobile
window.addEventListener("orientationchange", () => {
  setTimeout(resize, 100);
});

/* ============================ ASSET LOADING ============================ */

const imageCache = {}; // key "hero.walk.0" -> {img, ok}

function loadAll(){
  for(const role of Object.keys(SPRITE_FILES)){
    for(const anim of Object.keys(SPRITE_FILES[role])){
      SPRITE_FILES[role][anim].forEach((file, i)=>{
        const key = `${role}.${anim}.${i}`;
        const entry = { img: new Image(), ok: false };
        const path = SPRITE_DIR + file;
        entry.img.onload = ()=>{ entry.ok = true; console.log("✓ Loaded:", path); };
        entry.img.onerror = ()=>{ entry.ok = false; console.warn("✗ Failed:", path); };
        entry.img.src = path;
        imageCache[key] = entry;
      });
    }
  }
  console.log("Sprite loading initiated. Cache keys:", Object.keys(imageCache).length);
}
loadAll();

function getFrame(role, anim, index){
  const key = `${role}.${anim}.${index}`;
  return imageCache[key];
}

/* ============================ AUDIO / SFX ============================ */
// Initialize audio using files in assets/audio/ when available, with fallbacks.
const AUDIO_FILES = {
  music: "assets/audio/Bgm.mp3",
  sfxShoot: "assets/audio/sfx_shoo.wav",
  sfxHit: "assets/audio/sfx_hit.wav",
  sfxCollect: "assets/audio/sfx_collect.wav",
  sfxEmpty: "assets/audio/sfx_shoo.wav",
  sfxGameOver: "assets/audio/sfx_gameover.mp3"
};

const AUDIO = {};
for(const k of Object.keys(AUDIO_FILES)){
  try{
    AUDIO[k] = new Audio(AUDIO_FILES[k]);
    AUDIO[k].preload = 'auto';
    AUDIO[k].loop = (k==='music');
    AUDIO[k].volume = (k==='music')?0.45:0.9;
    AUDIO[k].onerror = ()=>{ /* ignore load errors */ };
  }catch(e){
    AUDIO[k] = { play: ()=>Promise.resolve(), pause: ()=>{}, currentTime:0, preload:'auto', loop:false, volume:1, onerror: ()=>{} };
  }
}
AUDIO.sfxEmpty = {
  play: () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch(e) {}
    return Promise.resolve();
  },
  pause: () => {},
  currentTime: 0,
  volume: 1
};
let audioEnabled = true;
function playSfx(key){ if(!audioEnabled) return; try{ const a=AUDIO[key]; if(a){ a.currentTime=0; a.play().catch(()=>{}); } }catch(e){} }
function playMusic(){ if(!audioEnabled) return; try{ AUDIO.music.play().catch(()=>{}); }catch(e){} }
function stopMusic(){ try{ AUDIO.music.pause(); AUDIO.music.currentTime=0; }catch(e){} }

/* ============================ HIGH SCORE TRACKING ============================ */

function loadHighScore(){
  const saved = localStorage.getItem('thalapathy_high_score');
  return saved ? parseInt(saved, 10) : 0;
}

function saveHighScore(score){
  const current = loadHighScore();
  if(score > current) localStorage.setItem('thalapathy_high_score', score);
}

function loadMaxWave(){
  const saved = localStorage.getItem('thalapathy_max_wave');
  return saved ? parseInt(saved, 10) : 0;
}

function saveMaxWave(wave){
  const current = loadMaxWave();
  if(wave > current) localStorage.setItem('thalapathy_max_wave', wave);
}

/* ============================ INPUT ============================ */

const keys = {};
window.addEventListener("keydown", e=>{
  keys[e.key] = true;
  if(["ArrowLeft","ArrowRight","ArrowUp"," "].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", e=>{ keys[e.key] = false; });

const touch = { left:false, right:false, jump:false, punch:false, kick:false, shoot:false };
function bindTouchBtn(id, prop){
  const el = document.getElementById(id);
  const set = (v)=> (e)=>{ e.preventDefault(); touch[prop]=v; el.classList.toggle("active-touch", v); };
  el.addEventListener("touchstart", set(true), {passive:false});
  el.addEventListener("touchend", set(false), {passive:false});
  el.addEventListener("touchcancel", set(false), {passive:false});
  el.addEventListener("mousedown", set(true));
  el.addEventListener("mouseup", set(false));
  el.addEventListener("mouseleave", set(false));
}
bindTouchBtn("btn-left","left");
bindTouchBtn("btn-right","right");
bindTouchBtn("btn-jump","jump");
bindTouchBtn("btn-punch","punch");
bindTouchBtn("btn-kick","kick");
bindTouchBtn("btn-shoot","shoot");

function pressed(k){ return !!keys[k]; }

/* ============================ PARTICLES (impact sparks) ============================ */

let particles = [];
let floatTexts = [];
let screenShake = 0;

function spawnFloatText(x, y, text, color){
  floatTexts.push({ x, y, text, color, life: 40, vy: -1.2 });
}
function spawnSpark(x,y,color){
  for(let i=0;i<6;i++){
    particles.push({
      x,y,
      vx:(Math.random()-0.5)*6,
      vy:(Math.random()-1.2)*5,
      life:18, color
    });
  }
}
function updateParticles(){
  particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.3; p.life--; });
  particles = particles.filter(p=>p.life>0);
  
  floatTexts.forEach(ft => { ft.y += ft.vy; ft.life--; });
  floatTexts = floatTexts.filter(ft => ft.life > 0);
}
function drawParticles(camX){
  particles.forEach(p=>{
    ctx.globalAlpha = Math.max(p.life/18,0);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x-camX, p.y, 4,4);
  });
  ctx.globalAlpha = 1;
  
  floatTexts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.life / 40);
    ctx.fillStyle = ft.color || "#ffffff";
    ctx.font = "bold 16px Rajdhani";
    ctx.textAlign = "center";
    ctx.fillText(ft.text, ft.x - camX, ft.y);
    ctx.restore();
  });
}

/* ============================ PICKUPS (FUSES & KAMBAM) ============================ */
let pickups = [];
function spawnFuse(x){
  pickups.push({ x:x, y: GROUND_Y-28, collected:false, type: 'fuse' });
}
function spawnKambam(x){
  pickups.push({ x:x, y: GROUND_Y-28, collected:false, type: 'kambam' });
}
function spawnPickupsForLevel(lvl){
  pickups = [];
  // spawn 1-3 fuses for non-boss levels, boss level gives a larger ammo pack
  if(lvl.isBoss){
    spawnFuse(Math.min(game.world.width-120, (game.player?game.player.x:0)+420));
  } else {
    const count = 1 + Math.floor(Math.random()*3);
    for(let i=0;i<count;i++){
      const x = 200 + Math.floor(Math.random()*(Math.max(0, game.world.width-400)));
      spawnFuse(x);
    }
  }
}

function drawPickups(camX){
  pickups.forEach(pk=>{
    if(pk.collected) return;
    const sx = pk.x - camX;
    if(sx < -50 || sx > CW+50) return; // cull off-screen
    ctx.save();
    ctx.fillStyle = pk.type==="fuse" ? "#ffd700" : pk.type==="ammo" ? "#00ffcc" : pk.type==="health" ? "#ff3333" : "#ff6b9d";
    ctx.shadowColor = pk.type==="fuse" ? "#ffd700" : pk.type==="ammo" ? "#00ffcc" : pk.type==="health" ? "#ff3333" : "#ff6b9d";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sx, pk.y, 14, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
}
function updateAmmoHUD(){
  const el = document.getElementById("ammo-pips");
  el.innerHTML = '';
  const p = game.player;
  if(!p) return;
  for(let i=0;i<p.maxAmmo;i++){
    const span = document.createElement('span');
    span.className = 'ammo-pip' + (i<p.ammo? ' filled':'');
    el.appendChild(span);
  }
  const scoreEl = document.getElementById('score-label');
  scoreEl.textContent = `SCORE: ${p.score}`;
}

/* ============================ FALLBACK FIGHTER DRAWING ============================ */
// Used automatically whenever a sprite PNG hasn't been dropped into assets/sprites/.

function drawFallback(roleColor, x, y, w, h, facing, pose){
  ctx.save();
  ctx.translate(x + w/2, y);
  ctx.scale(facing, 1);
  const headR = w*0.22;
  ctx.fillStyle = roleColor;
  ctx.strokeStyle = "#00000055";
  ctx.lineWidth = 2;

  // legs
  let legSpread = pose==="walk"||pose==="sprint" ? w*0.18 : w*0.08;
  ctx.fillRect(-w*0.16-legSpread*0.3, h*0.58, w*0.14, h*0.42);
  ctx.fillRect(w*0.02+legSpread*0.3, h*0.58, w*0.14, h*0.42);

  // torso
  ctx.fillRect(-w*0.22, h*0.22, w*0.44, h*0.4);

  // arms by pose
  ctx.fillStyle = roleColor;
  if(pose==="punch"){
    ctx.fillRect(w*0.18, h*0.3, w*0.42, h*0.13);
  } else if(pose==="kick"){
    ctx.fillRect(-w*0.1, h*0.55, w*0.55, h*0.13);
  } else if(pose==="shoot"){
    ctx.fillRect(w*0.18, h*0.38, w*0.5, h*0.08);
  } else if(pose==="hurt"){
    ctx.fillRect(-w*0.32, h*0.4, w*0.2, h*0.18);
    ctx.fillRect(w*0.12, h*0.4, w*0.2, h*0.18);
  } else {
    ctx.fillRect(-w*0.3, h*0.26, w*0.12, h*0.32);
    ctx.fillRect(w*0.18, h*0.26, w*0.12, h*0.32);
  }

  // head
  ctx.beginPath();
  ctx.arc(0, h*0.22-headR*0.7, headR, 0, Math.PI*2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/* ============================ ENTITY BASE ============================ */

class Entity{
  constructor(x,y,w,h){
    this.x=x; this.y=y; this.w=w; this.h=h;
    this.vx=0; this.vy=0;
    this.facing=1;
    this.onGround=true;
    this.state="idle";
    this.frame=0;
    this.frameTimer=0;
    this.dead=false;
  }
  setState(s){
    if(this.state!==s){ this.state=s; this.frame=0; this.frameTimer=0; }
  }
  advanceFrame(dt, frames, loop, msOverride){
    const ms = msOverride || FRAME_MS[this.state] || 150;
    this.frameTimer += dt;
    if(this.frameTimer >= ms){
      this.frameTimer = 0;
      this.frame++;
      if(this.frame >= frames){
        this.frame = loop ? 0 : frames-1;
        return true; // finished a cycle
      }
    }
    return false;
  }
  get feetY(){ return this.y + this.h; }
}

/* ============================ PLAYER ============================ */

const PLAYER_W = 86, PLAYER_H = 150;
const PUNCH_RANGE = 78, KICK_RANGE = 92, PUNCH_DMG = 8, KICK_DMG = 13;
const SHOOT_DMG = 10, BULLET_SPEED = 13;
const ATTACK_LOCK_MS = { punch:240, kick:300, shoot:280 };

class Player extends Entity{
  constructor(){
    super(120, 0, PLAYER_W, PLAYER_H);
    this.y = GROUND_Y - this.h;
    this.maxHealth = 100;
    this.health = 100;
    this.speed = 3.6;
    this.sprintSpeed = 6.2;
    this.attackLock = 0;
    this.cooldowns = {punch:0, kick:0, shoot:0};
    this.hitApplied = false;
    this.invuln = 0;
    this.deathTimer = 0;
    this.maxAmmo = 6;
    this.ammo = 3; // starting ammo (fuses)
    this.score = 0;
  }

  attackActive(){ return this.attackLock>0; }

  tryAttack(type, dmgFn){
    if(this.attackActive() || this.cooldowns[type]>0 || this.health<=0) return;
    if(type==="shoot" && this.ammo<=0){
      // play empty click
      playSfx("sfxEmpty");
      return;
    }
    this.setState(type);
    this.attackLock = ATTACK_LOCK_MS[type];
    this.cooldowns[type] = ATTACK_LOCK_MS[type] + 120;
    this.hitApplied = false;
    this._pendingDmg = dmgFn;
  }

  update(dt, world){
    if(this.health<=0){
      this.setState("death");
      this.advanceFrame(dt, SPRITE_FILES.hero.death.length, false);
      this.deathTimer += dt;
      return;
    }
    if(this.invuln>0) this.invuln -= dt;
    for(const k in this.cooldowns) if(this.cooldowns[k]>0) this.cooldowns[k]-=dt;
    if(this.attackLock>0){
      this.attackLock -= dt;
      // apply damage at mid-point of swing
      if(!this.hitApplied && this.attackLock <= ATTACK_LOCK_MS[this.state]*0.55){
        this.hitApplied = true;
        if(this._pendingDmg) this._pendingDmg();
      }
      if(this.attackLock<=0){
        this.attackLock=0;
        this.setState("idle");
      }
    }

    const attacking = this.attackActive();
    const left = pressed("ArrowLeft")||touch.left;
    const right = pressed("ArrowRight")||touch.right;
    const sprinting = pressed("Shift");

    // allow movement during attacks for a combo feel (reduced speed while attacking)
    const moveFactor = attacking ? 0.62 : 1;
    this.vx = 0;
    if(left){ this.vx = -(sprinting?this.sprintSpeed:this.speed) * moveFactor; this.facing=-1; }
    if(right){ this.vx = (sprinting?this.sprintSpeed:this.speed) * moveFactor; this.facing=1; }
    this.x += this.vx;
    this.x = Math.max(20, Math.min(world.width-this.w-20, this.x));

    // jump
    if((pressed("ArrowUp")||touch.jump) && this.onGround && !attacking){
      this.vy = JUMP_VELOCITY;
      this.onGround = false;
    }
    this.vy += GRAVITY;
    this.y += this.vy;
    if(this.y + this.h >= GROUND_Y){
      this.y = GROUND_Y - this.h;
      this.vy = 0;
      this.onGround = true;
    }

    // pick animation state if not locked in attack/hurt/death
    if(!attacking){
      if(!this.onGround) this.setState("jump");
      else if(this.vx!==0) this.setState(sprinting ? "sprint" : "walk");
      else this.setState("idle");
    }

    const framesArr = SPRITE_FILES.hero[this.state] || SPRITE_FILES.hero.idle;
    this.advanceFrame(dt, framesArr.length, this.state!=="punch"&&this.state!=="kick"&&this.state!=="shoot");
  }

  takeDamage(dmg){
    if(this.invuln>0 || this.health<=0) return;
    this.health = Math.max(0, this.health-dmg);
    this.invuln = 380;
    screenShake = Math.max(screenShake, 8);
    spawnFloatText(this.x + this.w/2, this.y + 20, `-${dmg} HP`, "#ff4444");
    if(this.health>0){ this.setState("hurt"); this.attackLock=0; playSfx('sfxHit'); }
  }

  draw(camX){
    const drawX = this.x - camX;
    const role = "hero";
    const framesArr = SPRITE_FILES.hero[this.state] || SPRITE_FILES.hero.idle;
    const idx = Math.min(this.frame, framesArr.length-1);
    const sprite = getFrame(role, this.state, idx);
    if(this.invuln>0 && Math.floor(this.invuln/80)%2===0){
      ctx.globalAlpha = 0.45;
    }
    if(sprite && sprite.ok){
      const targetH = this.h;
      const targetW = targetH * (sprite.img.width/sprite.img.height);
      ctx.save();
      ctx.translate(drawX + this.w/2, this.y);
      ctx.scale(this.facing,1);
      ctx.drawImage(sprite.img, -targetW/2, 0, targetW, targetH);
      ctx.restore();
    } else {
      const pose = this.state==="punch"?"punch":this.state==="kick"?"kick":this.state==="shoot"?"shoot":this.state==="hurt"?"hurt":(this.vx!==0?"walk":"idle");
      drawFallback("#3a7bd5", drawX, this.y, this.w, this.h, this.facing, pose);
    }
    ctx.globalAlpha = 1;
  }
}

/* ============================ PROJECTILE ============================ */

class Bullet{
  constructor(x,y,dir,owner,dmg,speed){
    this.x=x; this.y=y; this.dir=dir; this.owner=owner; this.dmg=dmg;
    this.speed = speed||BULLET_SPEED; this.dead=false;
  }
  update(){ this.x += this.speed*this.dir; }
  draw(camX){
    ctx.save();
    ctx.fillStyle = this.owner==="player" ? "#ffd23f" : "#ff5454";
    ctx.shadowColor = this.owner==="player" ? "#ffd23f" : "#ff5454";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(this.x-camX, this.y, 8,3,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

/* ============================ ENEMY ============================ */

const ENEMY_W = 80, ENEMY_H = 148;

class Enemy extends Entity{
  constructor(x, speedMult, isBoss){
    super(x, GROUND_Y-ENEMY_H, isBoss?ENEMY_W*1.25:ENEMY_W, isBoss?ENEMY_H*1.2:ENEMY_H);
    this.isBoss = isBoss;
    this.maxHealth = isBoss ? 320 : 32;
    this.health = this.maxHealth;
    this.speed = (isBoss?2.6:1.6) * speedMult;
    this.aggroRange = isBoss?900:520;
    this.attackRange = isBoss?100:72;
    this.attackCooldown = 0;
    this.attackDealt = false;
    this.hurtTimer = 0;
    this.deadTimer = 0;
    this.removeMe = false;
    this.gunCooldown = isBoss ? 2000 : Infinity;
    this.punchCooldown = isBoss ? 0 : Infinity;
    this.kickCooldown = isBoss ? 0 : Infinity;
    this.attackType = null; // 'punch', 'kick', or 'shoot' for boss
  }

  update(dt, player, onShoot){
    if(this.health<=0){
      this.setState("death");
      const finished = this.advanceFrame(dt, SPRITE_FILES.villain.death.length, false, 200);
      this.deadTimer += dt;
      if(this.deadTimer>900) this.removeMe = true;
      return;
    }
    if(this.hurtTimer>0){
      this.hurtTimer -= dt;
      this.setState("hurt");
      this.advanceFrame(dt, SPRITE_FILES.villain.hurt.length, true);
      return;
    }
    if(this.attackCooldown>0) this.attackCooldown -= dt;
    if(this.gunCooldown>0 && this.gunCooldown!==Infinity) this.gunCooldown -= dt;
    if(this.punchCooldown>0 && this.punchCooldown!==Infinity) this.punchCooldown -= dt;
    if(this.kickCooldown>0 && this.kickCooldown!==Infinity) this.kickCooldown -= dt;

    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    this.facing = dx<0 ? -1 : 1;

    if(dist < this.aggroRange){
      if(dist > this.attackRange){
        const useSprint = this.isBoss && dist < this.aggroRange*0.55;
        this.x += Math.sign(dx) * this.speed * (useSprint?1.6:1);
        this.setState(useSprint?"sprint":"walk");
        const arr = SPRITE_FILES.villain[this.state] || SPRITE_FILES.villain.walk;
        this.advanceFrame(dt, arr.length, true);
      } else {
        // in range: attack
        if(this.attackCooldown<=0){
          this.setState("attack");
          this.attackCooldown = this.isBoss?700:1500;
          this.attackDealt = false;
          this._attackPlayer = player;
          
          if(this.isBoss){
            // Boss AI: vary attacks
            const rand = Math.random();
            if(rand < 0.35 && this.gunCooldown <= 0){
              this.attackType = 'shoot';
              this.gunCooldown = 2000;
              onShoot(this.x, this.y+this.h*0.4, this.facing);
            } else if(rand < 0.65 && this.punchCooldown <= 0){
              this.attackType = 'punch';
              this.punchCooldown = 1200;
            } else if(this.kickCooldown <= 0){
              this.attackType = 'kick';
              this.kickCooldown = 1400;
            }
          }
        }
        if(this.state==="attack"){
          const arr = SPRITE_FILES.villain.attack;
          const finished = this.advanceFrame(dt, arr.length, false, 150);
          if(!this.attackDealt && this.frame>=Math.floor(arr.length/2)){
            this.attackDealt = true;
            if(Math.abs(player.x-this.x) < this.attackRange+20){
              const dmg = this.isBoss ? 18 : 7;
              player.takeDamage(dmg);
            }
          }
          if(finished){ 
            this.setState("idle"); 
            this.attackType = null;
          }
        } else {
          this.setState("idle");
          this.advanceFrame(dt, SPRITE_FILES.villain.idle.length, true, 400);
        }
      }
    } else {
      this.setState("idle");
      this.advanceFrame(dt, SPRITE_FILES.villain.idle.length, true, 400);
    }
  }

  takeDamage(dmg){
    if(this.health<=0) return;
    this.health = Math.max(0, this.health-dmg);
    // play hit sound for enemy when damaged
    playSfx('sfxHit');
    screenShake = Math.max(screenShake, 3);
    spawnFloatText(this.x + this.w/2, this.y + 20, `-${dmg}`, "#ffd23f");
    if(this.health<=0){
      this.setState("death");
    } else {
      this.hurtTimer = 260;
      this.setState("hurt");
    }
  }

  draw(camX){
    const drawX = this.x - camX;
    const framesArr = SPRITE_FILES.villain[this.state] || SPRITE_FILES.villain.idle;
    const idx = Math.min(this.frame, framesArr.length-1);
    const sprite = getFrame("villain", this.state, idx);
    if(sprite && sprite.ok){
      const targetH = this.h;
      const targetW = targetH * (sprite.img.width/sprite.img.height);
      ctx.save();
      ctx.translate(drawX + this.w/2, this.y);
      ctx.scale(this.facing,1);
      ctx.drawImage(sprite.img, -targetW/2, 0, targetW, targetH);
      ctx.restore();
    } else {
      const pose = this.state==="attack"?"kick":this.state==="hurt"?"hurt":(this.state==="walk"||this.state==="sprint")?"walk":"idle";
      drawFallback(this.isBoss?"#8a1020":"#b53030", drawX, this.y, this.w, this.h, this.facing, pose);
    }
    // mini health bar
    if(!this.isBoss && this.health<this.maxHealth && this.health>0){
      const bw = this.w*0.8;
      ctx.fillStyle="#000a";
      ctx.fillRect(drawX+this.w*0.1, this.y-12, bw, 5);
      ctx.fillStyle="#ff4324";
      ctx.fillRect(drawX+this.w*0.1, this.y-12, bw*(this.health/this.maxHealth), 5);
    }
  }
}

/* ============================ BACKGROUND ============================ */

function drawBackground(camX, theme){
  // sky
  const grad = ctx.createLinearGradient(0,0,0,CH);
  grad.addColorStop(0, "#1a1f33");
  grad.addColorStop(0.6, "#11141f");
  grad.addColorStop(1, "#05060a");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,CW,CH);

  // distant building silhouettes (parallax 0.3)
  ctx.fillStyle = "#171c2c";
  for(let i=-1;i<12;i++){
    const bx = i*220 - (camX*0.3)%220;
    const bh = 90 + ((i*53)%140);
    ctx.fillRect(bx, GROUND_Y-bh-10, 150, bh);
    // windows
    ctx.fillStyle = "#2b3450";
    for(let wy=0; wy<bh-20; wy+=22){
      for(let wx=10; wx<130; wx+=28){
        if((wx+wy)%56<28) ctx.fillRect(bx+wx, GROUND_Y-bh+wy, 10,12);
      }
    }
    ctx.fillStyle = "#171c2c";
  }

  // electric poles with wires (parallax 0.6) - one missing fuse carrier
  const poleSpacing = 380;
  ctx.strokeStyle = "#0e1118";
  for(let i=-1;i<10;i++){
    const px = i*poleSpacing - (camX*0.6)%poleSpacing + 90;
    const topY = GROUND_Y-220;
    ctx.fillStyle = "#2a2e3a";
    ctx.fillRect(px-5, topY, 10, 220);
    ctx.fillRect(px-32, topY+14, 64, 7);
    // wires
    ctx.beginPath();
    ctx.moveTo(px-32, topY+18);
    ctx.lineTo(px+poleSpacing-32, topY+18);
    ctx.stroke();
    // fuse carrier (small grey box) - missing on pole index 2
    const missing = (i===2);
    if(!missing){
      ctx.fillStyle = "#555b6b";
      ctx.fillRect(px-10, topY+24, 20,14);
    } else {
      ctx.strokeStyle = "#ff4324aa";
      ctx.lineWidth = 2;
      ctx.strokeRect(px-10, topY+24, 20,14);
      ctx.fillStyle = "#ff4324";
      ctx.font = "10px Rajdhani";
      ctx.textAlign = "center";
      ctx.fillText("MISSING", px, topY+50);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#0e1118";
    }
  }

  // shop boards (parallax 0.75)
  const boardX = 640 - (camX*0.75)%2400;
  drawShopBoard(boardX, GROUND_Y-150, "LEON  MAGIC  STUDIO");
  drawShopBoard(boardX+900, GROUND_Y-150, themeShopName(theme));

  // ground
  ctx.fillStyle = "#15161c";
  ctx.fillRect(0, GROUND_Y, CW, CH-GROUND_Y);
  ctx.fillStyle = "#1d1f27";
  for(let i=0;i<40;i++){
    const lx = i*70 - (camX*1)%70;
    ctx.fillRect(lx, GROUND_Y+18, 40,4);
  }

  // streetlight glow pools
  ctx.save();
  for(let i=-1;i<8;i++){
    const lx = i*poleSpacing - (camX*0.6)%poleSpacing + 90;
    const glow = ctx.createRadialGradient(lx,GROUND_Y,5, lx,GROUND_Y,90);
    glow.addColorStop(0,"#ffcc3322");
    glow.addColorStop(1,"#ffcc3300");
    ctx.fillStyle = glow;
    ctx.fillRect(lx-90, GROUND_Y-40, 180,100);
  }
  ctx.restore();
}

function themeShopName(theme){
  return ({
    street:"SARAVANA TEA KADAI", market:"NARIPADDI SANDHAI",
    busstand:"SALEM BUS STAND", factory:"VEERA STEEL WORKS", warehouse:"WAREHOUSE", dock:"DOCK",
    garage:"GARAGE", underpass:"UNDERPASS", industrial:"INDUSTRIAL", boss:"OLD POWER GODOWN"
  })[theme] || "SALEM TOWN";
}

function drawShopBoard(x,y,text){
  ctx.fillStyle = "#202637";
  ctx.fillRect(x, y, 220, 40);
  ctx.strokeStyle = "#ffcc3366";
  ctx.strokeRect(x,y,220,40);
  ctx.fillStyle = "#ffcc33";
  ctx.font = "bold 13px Rajdhani";
  ctx.textAlign = "center";
  ctx.fillText(text, x+110, y+24);
}

/* ============================ GAME STATE ============================ */

const STATE = { 
  MENU:"menu", 
  STORY:"story", 
  PLAYING:"playing", 
  LEVEL_DONE:"level_done", 
  BOSS_INTRO:"boss_intro", 
  MISSION_COMPLETE:"mission_complete", 
  VICTORY:"victory", 
  GAMEOVER:"gameover",
  WAVE_DEFENSE:"wave_defense", 
  SURVIVAL:"survival"
};

const game = {
  state: STATE.MENU,
  levelIndex: 0,
  kills: 0,
  player: null,
  enemies: [],
  bullets: [],
  camX: 0,
  world: { width: WORLD_WIDTH },
  spawnTimer: 0,
  enemiesSpawned: 0,
  bossIntroTimer: 0,
  lastTime: 0,
  endless: false,
  wave: 0,
  fuseCollected: false,
  kambamFound: false,
  gameMode: "story", // "story", "wave", "defense", "survival"
  kambamHealth: 100,
  kambamMaxHealth: 100
};

const hud = document.getElementById("hud");
const elPlayerHealth = document.getElementById("player-health");
const elLevelLabel = document.getElementById("level-label");
const elKillLabel = document.getElementById("kill-label");
const elBossWrap = document.getElementById("boss-health-wrap");
const elBossHealth = document.getElementById("boss-health");
const elBossName = document.getElementById("boss-name");

function showScreen(id){
  document.querySelectorAll(".overlay").forEach(o=>o.classList.add("hidden"));
  if(id) document.getElementById(id).classList.remove("hidden");
}

function startLevel(idx){
  game.levelIndex = idx;
  game.kills = 0;
  game.enemiesSpawned = 0;
  game.enemies = [];
  game.bullets = [];
  game.spawnTimer = 600;
  game.player = new Player();
  game.camX = 0;
  game.fuseCollected = false;
  game.kambamFound = false;
  const lvl = LEVELS[idx];
  elLevelLabel.textContent = `LEVEL ${idx+1} / ${LEVELS.length} — ${lvl.name}`;
  elKillLabel.textContent = lvl.isBoss ? "DEFEAT THE BOSS" : `TARGETS DOWN: 0 / ${lvl.enemyCount}`;
  elBossWrap.classList.toggle("hidden", !lvl.isBoss);
  const elWave = document.getElementById('wave-hud');
  if(elWave) elWave.textContent = `WAVE: 1  MODE: CAMPAIGN`;
  // spawn level pickups and reset HUD
  spawnPickupsForLevel(lvl);
  updateAmmoHUD();
  document.getElementById('current-status').textContent = `CURRENT: ${lvl.isBoss? 'THREAT':'OFF'}`;
  playMusic();
  showStory(lvl.intro, ()=>{
    if(lvl.isBoss){
      game.state = STATE.BOSS_INTRO;
      game.bossIntroTimer = 1600;
      hud.classList.remove("hidden");
      spawnEnemy(true); // spawn boss immediately, walks in during intro
    } else {
      game.state = STATE.PLAYING;
      hud.classList.remove("hidden");
    }
  });
}

function showStory(text, onContinue){
  game.state = STATE.STORY;
  hud.classList.add("hidden");
  document.getElementById("story-text").textContent = text;
  document.getElementById("story-eyebrow").textContent = LEVELS[game.levelIndex].name;
  showScreen("story-overlay");
  const btn = document.getElementById("story-continue");
  const handler = ()=>{
    btn.removeEventListener("click", handler);
    showScreen(null);
    onContinue();
  };
  btn.addEventListener("click", handler);
}

function spawnEnemy(isBoss){
  const lvl = LEVELS[game.levelIndex];
  const spawnX = isBoss
    ? game.player.x + 480
    : game.player.x + 420 + Math.random()*220;
  const clampedX = Math.min(spawnX, game.world.width-100);
  const e = new Enemy(clampedX, lvl.enemySpeed, !!isBoss);
  if(isBoss) elBossName.textContent = lvl.bossName || "THE BOSS";
  game.enemies.push(e);
  game.enemiesSpawned++;
}

// spawn for endless mode with scaling per wave
function spawnEndlessEnemy(isBoss){
  const wave = game.wave || 1;
  const baseSpeed = 1.0 + (wave-1) * 0.06; // increase speed each wave
  const speedMult = 1 * baseSpeed;
  const spawnX = isBoss ? game.player.x + 480 : game.player.x + 420 + Math.random()*220;
  const clampedX = Math.min(spawnX, game.world.width-100);
  const e = new Enemy(clampedX, speedMult, !!isBoss);
  // scale health
  const healthMult = 1 + (wave-1) * 0.12;
  e.maxHealth = Math.floor(e.maxHealth * healthMult);
  e.health = e.maxHealth;
  game.enemies.push(e);
  game.enemiesSpawned++;
}

function onPlayerShootBullet(){
  const p = game.player;
  if(!p || p.ammo<=0) { playSfx("sfxEmpty"); return; }
  p.ammo = Math.max(0, p.ammo-1);
  updateAmmoHUD();
  playSfx("sfxShoot");
  screenShake = Math.max(screenShake, 4);
  const bx = p.x + (p.facing===1 ? p.w : 0);
  game.bullets.push(new Bullet(bx, p.y+p.h*0.45, p.facing, "player", SHOOT_DMG));
}
function onEnemyShootBullet(x,y,dir){
  game.bullets.push(new Bullet(x + (dir===1?60:-10), y, dir, "enemy", 14, 9));
  playSfx('sfxShoot');
}

function handleAttackInput(){
  const p = game.player;
  if(p.health<=0) return;
  const j = pressed("j")||pressed("J")||touch.punch;
  const k = pressed("k")||pressed("K")||touch.kick;
  const l = pressed("l")||pressed("L")||touch.shoot;
  if(j) p.tryAttack("punch", ()=>meleeHit(PUNCH_RANGE, PUNCH_DMG));
  if(k) p.tryAttack("kick", ()=>meleeHit(KICK_RANGE, KICK_DMG));
  if(l) p.tryAttack("shoot", ()=>onPlayerShootBullet());
}

function spawnEnemyDrop(x){
  const rand = Math.random();
  if(rand < 0.25){
    pickups.push({ x: x, y: GROUND_Y-28, collected: false, type: 'ammo' });
  } else if(rand < 0.45){
    pickups.push({ x: x, y: GROUND_Y-28, collected: false, type: 'health' });
  }
}

function meleeHit(range, dmg){
  const p = game.player;
  for(const e of game.enemies){
    if(e.health<=0) continue;
    const dx = (e.x+e.w/2) - (p.x+p.w/2);
    if(Math.sign(dx||1)===p.facing && Math.abs(dx) < range){
      e.takeDamage(dmg);
      spawnSpark(e.x+e.w/2 - game.camX, e.y+e.h*0.4, "#ffcc33");
      if(e.health<=0) onEnemyKilled(e);
    }
  }
}

function onEnemyKilled(enemy){
  game.kills++;
  playSfx('sfxCollect');
  const lvl = LEVELS[game.levelIndex];
  if(!lvl.isBoss){
    elKillLabel.textContent = `TARGETS DOWN: ${game.kills} / ${lvl.enemyCount}`;
  }
  if(enemy){
    spawnEnemyDrop(enemy.x + enemy.w/2);
  }
}

function triggerLevelComplete(){
  game.state = STATE.LEVEL_DONE;
  hud.classList.add("hidden");
  document.getElementById("level-complete-text").textContent = LEVELS[game.levelIndex].outro;
  showScreen("level-complete-screen");
}

function triggerMissionComplete(){
  // Boss defeated + fuse collected + kambam activated
  game.state = STATE.MISSION_COMPLETE;
  hud.classList.add("hidden");
  stopMusic();
  showScreen("mission-complete-screen");
}

function triggerVictory(){
  // show victory popup after beating final boss (level 10)
  game.state = STATE.VICTORY;
  hud.classList.add("hidden");
  playSfx('sfxCollect');
  stopMusic();
  
  const victoryStats = document.getElementById('victory-stats');
  if(victoryStats){
    const highScore = loadHighScore();
    victoryStats.textContent = `FINAL SCORE: ${game.player.score} | HIGH SCORE: ${highScore}`;
  }
  
  saveHighScore(game.player.score);
  showScreen("victory-screen");
}

function triggerGameOver(){
  game.state = STATE.GAMEOVER;
  hud.classList.add("hidden");
  playSfx('sfxGameOver');
  stopMusic();
  
  if(game.endless){
    document.getElementById('gameover-story-buttons').classList.add('hidden');
    document.getElementById('gameover-endless-buttons').classList.remove('hidden');
    saveMaxWave(game.wave);
  } else {
    document.getElementById('gameover-story-buttons').classList.remove('hidden');
    document.getElementById('gameover-endless-buttons').classList.add('hidden');
  }
  
  showScreen("gameover-screen");
}

/* ============================ RENDER ============================ */

function render(){
  ctx.clearRect(0,0,CW,CH);
  if(game.state===STATE.MENU || game.state===STATE.STORY && game.levelIndex===0 && !game.player){
    drawBackground(0,"street");
    return;
  }
  if(!game.player) return;
  const lvl = LEVELS[game.levelIndex];

  ctx.save();
  if(screenShake > 0){
    const dx = (Math.random() - 0.5) * screenShake;
    const dy = (Math.random() - 0.5) * screenShake;
    ctx.translate(dx, dy);
    screenShake = Math.max(0, screenShake - 0.85);
  }

  drawBackground(game.camX, lvl.theme);

  // sort by x for simple depth
  drawPickups(game.camX);
  const drawables = [...game.enemies].sort((a,b)=>a.x-b.x);
  drawables.forEach(e=>e.draw(game.camX));
  game.player.draw(game.camX);
  game.bullets.forEach(b=>b.draw(game.camX));
  drawParticles(game.camX);

  if(game.state===STATE.BOSS_INTRO){
    ctx.fillStyle = "#000000aa";
    ctx.fillRect(0,CH*0.42,CW,CH*0.16);
    ctx.textAlign="center";
    ctx.fillStyle="#ff4324";
    ctx.font = "bold 28px Anton, sans-serif";
    ctx.fillText("BOSS APPROACHING", CW/2, CH*0.52);
  }

  // low health red vignette
  if(game.player && game.player.health > 0 && game.player.health <= 30){
    const pulse = Math.sin(Date.now() / 150) * 0.15 + 0.25;
    const grad = ctx.createRadialGradient(CW/2, CH/2, CW*0.3, CW/2, CH/2, CW*0.6);
    grad.addColorStop(0, "rgba(255, 0, 0, 0)");
    grad.addColorStop(1, `rgba(255, 0, 0, ${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);
  }

  // Draw offscreen enemy indicators
  if(game.player){
    game.enemies.forEach(e => {
      if(e.health <= 0) return;
      const ex = e.x - game.camX;
      if(ex < 0){
        ctx.fillStyle = e.isBoss ? "#ff3333" : "#ffcc33";
        ctx.beginPath();
        ctx.moveTo(15, CH * 0.5);
        ctx.lineTo(25, CH * 0.5 - 8);
        ctx.lineTo(25, CH * 0.5 + 8);
        ctx.fill();
      } else if(ex > CW){
        ctx.fillStyle = e.isBoss ? "#ff3333" : "#ffcc33";
        ctx.beginPath();
        ctx.moveTo(CW - 15, CH * 0.5);
        ctx.lineTo(CW - 25, CH * 0.5 - 8);
        ctx.lineTo(CW - 25, CH * 0.5 + 8);
        ctx.fill();
      }
    });
  }

  ctx.restore();
}

/* ============================ LOOP ============================ */

function loop(t){
  const dt = Math.min(40, t-(game.lastTime||t));
  game.lastTime = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ============================ UPDATE ============================ */

function update(dt){
  if(game.state===STATE.PLAYING || game.state===STATE.BOSS_INTRO || game.state===STATE.WAVE_DEFENSE || game.state===STATE.SURVIVAL){
    const lvl = LEVELS[game.levelIndex];
    const p = game.player;

    if(game.state===STATE.BOSS_INTRO){
      game.bossIntroTimer -= dt;
      if(game.bossIntroTimer<=0) game.state = STATE.PLAYING;
    } else {
      p.update(dt, game.world);
      handleAttackInput();
    }

    // spawn waves for non-boss levels or endless mode
    if(!lvl.isBoss || game.endless){
      game.spawnTimer -= dt;
      const activeAlive = game.enemies.filter(e=>e.health>0).length;
      if(game.endless && game.gameMode === "story"){
        // Infinite wave mode: spawn by wave, scaling stats; boss every 5 waves
        if(!game.wave) { game.wave = 1; game.waveEnemyCount = 3; game.waveSpawned = 0; game.waveBossSpawned = false; }
        // Boss wave every 5th wave
        if(game.wave % 5 === 0){
          if(!game.waveBossSpawned && game.spawnTimer <= 0){
            spawnEndlessEnemy(true);
            game.waveBossSpawned = true;
            game.spawnTimer = 1200;
          }
          // if boss present check if cleared
          const bossAlive = game.enemies.find(e=>e.isBoss && e.health>0);
          if(!bossAlive && game.waveBossSpawned){
            // boss defeated -> next wave
            game.wave++;
            game.waveSpawned = 0;
            game.waveBossSpawned = false;
            game.spawnTimer = 900;
            screenShake = Math.max(screenShake, 18);
          }
        } else {
          // normal wave spawning
          if(game.waveSpawned < game.waveEnemyCount && game.spawnTimer <= 0){
            spawnEndlessEnemy(false);
            game.waveSpawned++;
            game.spawnTimer = 420;
          }
          // when all spawned and no active enemies -> advance wave
          const alive = game.enemies.filter(e=>e.health>0).length;
          if(game.waveSpawned >= game.waveEnemyCount && alive===0){
            game.wave++;
            game.waveSpawned = 0;
            game.waveEnemyCount = 3 + Math.floor((game.wave-1)*0.5);
            game.spawnTimer = 1000;
          }
        }
        // update wave HUD
        const elWave = document.getElementById('wave-hud');
        if(elWave) elWave.textContent = `WAVE: ${game.wave}  MODE: INFINITE`;
      } else if(game.gameMode === "defense"){
        // ===== WAVE DEFENSE MODE: Defend the kambam =====
        if(!game.wave) { 
          game.wave = 1; 
          game.waveEnemyCount = 3; 
          game.waveSpawned = 0; 
          game.waveBossSpawned = false; 
        }
        
        // Boss wave every 5th wave
        if(game.wave % 5 === 0){
          if(!game.waveBossSpawned && game.spawnTimer <= 0){
            spawnEndlessEnemy(true);
            game.waveBossSpawned = true;
            game.spawnTimer = 1200;
          }
          const bossAlive = game.enemies.find(e=>e.isBoss && e.health>0);
          if(!bossAlive && game.waveBossSpawned){
            game.wave++;
            game.waveSpawned = 0;
            game.waveBossSpawned = false;
            game.spawnTimer = 900;
          }
        } else {
          // Normal enemy spawning
          if(game.waveSpawned < game.waveEnemyCount && game.spawnTimer <= 0){
            spawnEndlessEnemy(false);
            game.waveSpawned++;
            game.spawnTimer = 420;
          }
          const alive = game.enemies.filter(e=>e.health>0).length;
          if(game.waveSpawned >= game.waveEnemyCount && alive===0){
            game.wave++;
            game.waveSpawned = 0;
            game.waveEnemyCount = 3 + Math.floor((game.wave-1)*0.5);
            game.spawnTimer = 1000;
          }
        }
        
        // Enemies attack the kambam (only if close to it, e.g. x = 300)
        game.enemies.forEach(e=>{
          if(e.health > 0 && Math.abs(e.x - 300) < e.attackRange + 30 && Math.random() < 0.004){
            // Boss deals more damage to kambam
            const dmg = e.isBoss ? 8 : 3;
            game.kambamHealth = Math.max(0, game.kambamHealth - dmg);
            if(game.kambamHealth <= 0){
              triggerGameOver();
            }
          }
        });
        
        // Update kambam health HUD
        const elWaveDefense = document.getElementById('wave-hud');
        if(elWaveDefense) {
          elWaveDefense.textContent = `WAVE: ${game.wave}  KAMBAM: ${game.kambamHealth}%`;
        }
        
      } else if(game.gameMode === "survival"){
        // ===== SURVIVAL MODE: Pure infinite fighting =====
        if(!game.wave) { 
          game.wave = 1; 
          game.waveEnemyCount = 4; 
          game.waveSpawned = 0; 
          game.waveBossSpawned = false; 
        }
        
        // Boss wave every 5th wave
        if(game.wave % 5 === 0){
          if(!game.waveBossSpawned && game.spawnTimer <= 0){
            spawnEndlessEnemy(true);
            game.waveBossSpawned = true;
            game.spawnTimer = 1200;
          }
          const bossAlive = game.enemies.find(e=>e.isBoss && e.health>0);
          if(!bossAlive && game.waveBossSpawned){
            game.wave++;
            game.waveSpawned = 0;
            game.waveBossSpawned = false;
            game.spawnTimer = 900;
          }
        } else {
          // Faster enemy spawning in survival
          if(game.waveSpawned < game.waveEnemyCount && game.spawnTimer <= 0){
            spawnEndlessEnemy(false);
            game.waveSpawned++;
            game.spawnTimer = 300; // Faster than wave defense
          }
          const alive = game.enemies.filter(e=>e.health>0).length;
          if(game.waveSpawned >= game.waveEnemyCount && alive===0){
            game.wave++;
            game.waveSpawned = 0;
            // Faster scaling in survival
            game.waveEnemyCount = 4 + Math.floor((game.wave-1)*0.7);
            game.spawnTimer = 800;
          }
        }
        
        // Update survival HUD
        const elWaveSurvival = document.getElementById('wave-hud');
        if(elWaveSurvival) {
          elWaveSurvival.textContent = `WAVE: ${game.wave}  SURVIVAL: ON`;
        }

      } else {
        if(game.spawnTimer<=0 && activeAlive<3 && game.enemiesSpawned<lvl.enemyCount){
          spawnEnemy(false);
          game.spawnTimer = 900;
        }
      }
    }

    game.enemies.forEach(e=>{
      e.update(dt, p, onEnemyShootBullet);
    });
    
    // Check boss defeat BEFORE filtering out dead enemies
    if(lvl.isBoss && !game.endless){
      const boss = game.enemies.find(e=>e.isBoss);
      if(boss && boss.health<=0){
        playSfx('sfxCollect'); // Boss defeat sound
        screenShake = Math.max(screenShake, 18);
        if(game.levelIndex === LEVELS.length - 1){
          // Final boss -> Victory screen
          triggerVictory();
        } else {
          // Regular boss -> Auto-advance to next level
          showScreen(null);
          startLevel(game.levelIndex + 1);
        }
      }
    }
    
    game.enemies = game.enemies.filter(e=>!e.removeMe);

    game.bullets.forEach(b=>{
      b.update();
      if(b.owner==="player"){
        for(const e of game.enemies){
          if(e.health<=0) continue;
          if(Math.abs(b.x-(e.x+e.w/2))<36 && Math.abs(b.y-(e.y+e.h*0.45))<60){
            e.takeDamage(SHOOT_DMG);
            spawnSpark(b.x-game.camX, b.y, "#ffd23f");
            b.dead = true;
            if(e.health<=0) onEnemyKilled(e);
          }
        }
      } else {
        if(Math.abs(b.x-(p.x+p.w/2))<34 && Math.abs(b.y-(p.y+p.h*0.45))<70){
          p.takeDamage(12);
          spawnSpark(b.x-game.camX,b.y,"#ff5454");
          b.dead = true;
        }
      }
      if(b.x<-50 || b.x>game.world.width+50) b.dead = true;
    });
    game.bullets = game.bullets.filter(b=>!b.dead);

    // pickups collection
    pickups.forEach(pk=>{
      if(pk.collected) return;
      const p = game.player;
      if(pk.type === 'kambam_defense') return; // Do not collect the defense kambam!
      if(Math.abs((p.x+p.w/2) - pk.x) < 48){
        pk.collected = true;
        playSfx('sfxCollect');
        
        if(pk.type === 'fuse'){
          p.ammo = Math.min(p.maxAmmo, p.ammo + 2);
          p.score += 40;
          game.fuseCollected = true;
          // If this is a boss level, spawn kambam
          if(LEVELS[game.levelIndex].isBoss && !game.endless){
            spawnKambam(Math.min(game.world.width-120, p.x+520));
          }
          updateAmmoHUD();
        } else if(pk.type === 'kambam'){
          p.score += 200;
          game.kambamFound = true;
          document.getElementById('current-status').textContent = `CURRENT: ON`;
          updateAmmoHUD();
        } else if(pk.type === 'ammo'){
          p.ammo = Math.min(p.maxAmmo, p.ammo + 5);
          p.score += 50;
          spawnFloatText(p.x + p.w/2, p.y + 20, `+5 Ammo`, "#00ffcc");
          updateAmmoHUD();
        } else if(pk.type === 'health'){
          p.health = Math.min(p.maxHealth, p.health + 20);
          p.score += 50;
          spawnFloatText(p.x + p.w/2, p.y + 20, `+20 HP`, "#00ff66");
          elPlayerHealth.style.width = `${p.health}%`;
        }
      }
    });

    updateParticles();

    // camera
    const targetCam = p.x - CW*0.42;
    game.camX = Math.max(0, Math.min(game.world.width-CW, targetCam));

    // HUD updates
    elPlayerHealth.style.width = `${p.health}%`;
    const activeBoss = game.enemies.find(e=>e.isBoss && e.health>0);
    if(activeBoss){
      elBossWrap.classList.remove("hidden");
      elBossName.textContent = game.endless ? `WAVE BOSS` : lvl.bossName || "THE BOSS";
      elBossHealth.style.width = `${(activeBoss.health/activeBoss.maxHealth)*100}%`;
    } else {
      elBossWrap.classList.add("hidden");
    }

    // win/lose checks
    if(p.health<=0 && p.deathTimer>900){
      triggerGameOver();
    }
    if(!lvl.isBoss){
      if(game.kills>=lvl.enemyCount){
        triggerLevelComplete();
      }
    }
  }
}

/* ============================ UI WIRING ============================ */

const startBtnEl = document.getElementById("start-btn");
if(startBtnEl) startBtnEl.addEventListener("click", ()=>{
  showScreen(null);
  startLevel(0);
});

// options & exit wiring
const optionsBtn = document.getElementById('options-btn');
if(optionsBtn) optionsBtn.addEventListener('click', ()=>{ showScreen('options-overlay'); });
const optionsClose = document.getElementById('options-close');
if(optionsClose) optionsClose.addEventListener('click', ()=>{ showScreen(null); });
const optionsReset = document.getElementById('options-reset');
if(optionsReset) optionsReset.addEventListener('click', ()=>{ if(confirm('Reset progress and reload?')) location.reload(); });

const optMusic = document.getElementById('opt-music-toggle');
const optSfx = document.getElementById('opt-sfx-toggle');
if(optMusic){ optMusic.addEventListener('change', (e)=>{ audioEnabled = optMusic.checked || (optSfx && optSfx.checked); if(audioEnabled) playMusic(); else stopMusic(); }); }
if(optSfx){ optSfx.addEventListener('change', (e)=>{ if(!optSfx.checked) { for(const k of Object.keys(AUDIO)) if(k!=='music') AUDIO[k].muted = true; } else { for(const k of Object.keys(AUDIO)) AUDIO[k].muted = false; } }); }

const exitBtn = document.getElementById('exit-btn');
if(exitBtn) exitBtn.addEventListener('click', ()=>{ location.reload(); });

const nextLevelBtn = document.getElementById("next-level-btn");
if(nextLevelBtn) nextLevelBtn.addEventListener("click", ()=>{
  showScreen(null);
  const next = game.levelIndex+1;
  if(next < LEVELS.length) startLevel(next);
  else triggerVictory();
});

const restartBtn = document.getElementById("restart-btn");
if(restartBtn) restartBtn.addEventListener("click", ()=>{
  showScreen(null);
  startLevel(0);
});

const retryBtn = document.getElementById("retry-btn");
if(retryBtn) retryBtn.addEventListener("click", ()=>{
  showScreen(null);
  startLevel(game.levelIndex);
});

// Victory screen Main Menu button
const victoryMenuBtn = document.getElementById('victory-menu-btn');
if(victoryMenuBtn) victoryMenuBtn.addEventListener('click', ()=>{ location.reload(); });

// mute toggle
const btnMute = document.getElementById('btn-mute');
btnMute.addEventListener('click', ()=>{
  audioEnabled = !audioEnabled;
  if(!audioEnabled) stopMusic(); else playMusic();
  btnMute.textContent = audioEnabled? '🔊' : '🔈';
});

// endless mode starter
function startEndless(){
  // configure infinite wave mode
  game.endless = true;
  game.state = STATE.PLAYING;
  hud.classList.remove('hidden');
  game.enemies = [];
  game.bullets = [];
  game.spawnTimer = 400;
  game.enemiesSpawned = 0;
  game.player = new Player();
  game.player.ammo = game.player.maxAmmo;
  game.player.score = 0;
  game.world.width = 99999;
  // initialize wave properties
  game.wave = 1;
  game.waveEnemyCount = 3;
  game.waveSpawned = 0;
  game.waveBossSpawned = false;
  // initial small wave
  for(let i=0;i<3;i++) spawnEndlessEnemy(false);
  updateAmmoHUD();
  playMusic();
  
  // Set level label for endless mode
  elLevelLabel.textContent = `WAVE MODE`;
  elKillLabel.textContent = `SURVIVE THE WAVES`;
  elBossWrap.classList.add('hidden');
  const elWave = document.getElementById('wave-hud');
  if(elWave) elWave.textContent = `WAVE: 1  MODE: INFINITE`;
}

const endlessBtn = document.getElementById('endless-btn');
if(endlessBtn) endlessBtn.addEventListener('click', ()=>{ showScreen(null); startEndless(); });

// gameover endless retry button (if present)
const retryEndless = document.getElementById('retry-endless-btn');
if(retryEndless) retryEndless.addEventListener('click', ()=>{ showScreen(null); startEndless(); });

// mission complete overlay buttons
const missionExitBtn = document.getElementById('mission-exit-btn');
if(missionExitBtn) missionExitBtn.addEventListener('click', ()=>{ location.reload(); });
const missionWaveBtn = document.getElementById('mission-wave-btn');
if(missionWaveBtn) missionWaveBtn.addEventListener('click', ()=>{ showScreen(null); startEndless(); });

/* ============================ GAME MODE STARTERS ============================ */

// Wave Defense mode: Defend the kambam against waves
function startWaveDefense(){
  game.gameMode = "defense";
  game.endless = true;
  game.state = STATE.WAVE_DEFENSE;
  hud.classList.remove('hidden');
  game.enemies = [];
  game.bullets = [];
  game.spawnTimer = 400;
  game.enemiesSpawned = 0;
  game.player = new Player();
  game.player.ammo = game.player.maxAmmo;
  game.player.score = 0;
  game.world.width = 99999;
  
  // Wave Defense specific
  game.wave = 1;
  game.waveEnemyCount = 3;
  game.waveSpawned = 0;
  game.waveBossSpawned = false;
  game.kambamHealth = 100;
  game.kambamMaxHealth = 100;
  
  pickups = [];
  pickups.push({ x: 300, y: GROUND_Y-28, collected: false, type: 'kambam_defense' });
  
  for(let i=0;i<3;i++) spawnEndlessEnemy(false);
  updateAmmoHUD();
  playMusic();
  
  elLevelLabel.textContent = `WAVE DEFENSE`;
  elKillLabel.textContent = `PROTECT THE KAMBAM`;
  elBossWrap.classList.add('hidden');
  const elWave = document.getElementById('wave-hud');
  if(elWave) elWave.textContent = `WAVE: 1  DEFENSE: ON`;
}

// Survival mode: Pure infinite fighting
function startSurvival(){
  game.gameMode = "survival";
  game.endless = true;
  game.state = STATE.SURVIVAL;
  hud.classList.remove('hidden');
  game.enemies = [];
  game.bullets = [];
  game.spawnTimer = 300;
  game.enemiesSpawned = 0;
  game.player = new Player();
  game.player.ammo = game.player.maxAmmo;
  game.player.score = 0;
  game.world.width = 99999;
  
  game.wave = 1;
  game.waveEnemyCount = 4;
  game.waveSpawned = 0;
  game.waveBossSpawned = false;
  
  for(let i=0;i<4;i++) spawnEndlessEnemy(false);
  updateAmmoHUD();
  playMusic();
  
  elLevelLabel.textContent = `SURVIVAL MODE`;
  elKillLabel.textContent = `ENDLESS FIGHTING`;
  elBossWrap.classList.add('hidden');
  const elWave = document.getElementById('wave-hud');
  if(elWave) elWave.textContent = `WAVE: 1  SURVIVAL: ON`;
}

// Fullscreen toggle
function toggleFullscreen(){
  if(!document.fullscreenElement){
    document.documentElement.requestFullscreen().catch(()=>{});
  } else {
    if(document.exitFullscreen) document.exitFullscreen();
  }
}

/* ============================ NEW BUTTON WIRING ============================ */

// Menu buttons for new game modes
const defenseBtn = document.getElementById('menu-defense-btn');
if(defenseBtn) defenseBtn.addEventListener('click', ()=>{ showScreen(null); startWaveDefense(); });

const survivalBtn = document.getElementById('menu-survival-btn');
if(survivalBtn) survivalBtn.addEventListener('click', ()=>{ showScreen(null); startSurvival(); });

// Victory screen buttons for new modes
const victoryDefenseBtn = document.getElementById('victory-defense-btn');
if(victoryDefenseBtn) victoryDefenseBtn.addEventListener('click', ()=>{ showScreen(null); startWaveDefense(); });

const victorySurvivalBtn = document.getElementById('victory-survival-btn');
if(victorySurvivalBtn) victorySurvivalBtn.addEventListener('click', ()=>{ showScreen(null); startSurvival(); });

// Main menu wiring
const menuStoryBtn = document.getElementById('menu-story-btn');
if(menuStoryBtn) menuStoryBtn.addEventListener('click', ()=>{ showScreen(null); startLevel(0); });

const menuWaveBtn = document.getElementById('menu-wave-btn');
if(menuWaveBtn) menuWaveBtn.addEventListener('click', ()=>{ showScreen(null); startEndless(); });

const menuOptionsBtn = document.getElementById('menu-options-btn');
if(menuOptionsBtn) menuOptionsBtn.addEventListener('click', ()=>{ showScreen('options-overlay'); });

// Fullscreen button
const fullscreenBtn = document.getElementById('menu-fullscreen-btn');
if(fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);

// main menu buttons
const menuBtns = document.querySelectorAll('#menu-btn-story, #menu-btn-endless');
menuBtns.forEach(b=> b.addEventListener('click', ()=>{ location.reload(); }));

// Expose key starter functions to the global scope for inline handlers
if(typeof window !== 'undefined'){
  window.startLevel = startLevel;
  window.startEndless = startEndless;
  window.startWaveDefense = startWaveDefense;
  window.startSurvival = startSurvival;
  window.toggleFullscreen = toggleFullscreen;
  window.showScreen = showScreen;
}

})();
