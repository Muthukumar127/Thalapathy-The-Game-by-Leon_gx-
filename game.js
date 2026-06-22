/* ===================================================================
   GOAT — Power of the Streets
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
    death:  ["villan death 1.png","villan death 2.png","Villan 2.png"],
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
    outro: "There is a gang here. But the fuse carrier is not with them. Go deeper and continue."
  },

  {
    name: "MARKET FIGHT",
    enemyCount: 6,
    enemySpeed: 1.08,
    theme: "market",
    intro: "The market is full of gang members. Someone must reveal who stole it... but first, clear this area.",
    outro: "The market gang is defeated. The next clue says the thief was seen near the bus stand."
  },

  {
    name: "BUS STAND FIGHT",
    enemyCount: 7,
    enemySpeed: 1.15,
    theme: "busstand",
    intro: "A stronger gang is waiting at the bus stand. This was only the warm-up. The truth about the thief will be revealed here.",
    outro: "One of them confessed — the fuse carrier was taken to the factory hideout."
  },

  {
    name: "FACTORY HIDEOUT",
    enemyCount: 8,
    enemySpeed: 1.2,
    theme: "factory",
    intro: "This is the hideout. The boss’s guards are waiting inside. This is the final gang. Cross this and the thief will be revealed.",
    outro: "The hideout is clear. Only one step remains — the real thief is waiting face to face."
  },

  {
    name: "BOSS FIGHT",
    enemyCount: 1,
    enemySpeed: 1.35,
    theme: "boss",
    isBoss: true,
    intro: "This is the man who stole the fuse carrier from the electric pole. He has both a gun and deadly melee skills. Defeat him, and Naripaddi will get its power back.",
    outro: "The fuse carrier has been recovered. The electric pole is back online. Naripaddi is safe again."
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
        entry.img.onload = ()=>{ entry.ok = true; };
        entry.img.onerror = ()=>{ entry.ok = false; };
        entry.img.src = SPRITE_DIR + encodeURIComponent(file).replace(/%20/g,"%20");
        imageCache[key] = entry;
      });
    }
  }
}
loadAll();

function getFrame(role, anim, index){
  const key = `${role}.${anim}.${index}`;
  return imageCache[key];
}

/* ============================ AUDIO / SFX ============================ */
// audio files should be placed in assets/audio/ (optional). Missing files are silently ignored.
const AUDIO = {
  music: new Audio("assets/audio/Bgm.mp3"),
  sfxShoot: new Audio("assets/audio/sfx_shoo.wav"),
  sfxHit: new Audio("assets/audio/sfx_hit.wav"),
  sfxCollect: new Audio("assets/audio/sfx_collect.wav"),
  sfxEmpty: new Audio("assets/audio/sfx_empty.wav"),
  sfxGameOver: new Audio("assets/audio/sfx_gameover.mp3")
};
let audioEnabled = true;
for(const k of Object.keys(AUDIO)){
  AUDIO[k].preload = 'auto';
  AUDIO[k].loop = (k==='music');
  AUDIO[k].volume = (k==='music')?0.45:0.9;
  AUDIO[k].onerror = ()=>{};
}
function playSfx(key){ if(!audioEnabled) return; try{ const a=AUDIO[key]; if(a){ a.currentTime=0; a.play().catch(()=>{}); } }catch(e){} }
function playMusic(){ if(!audioEnabled) return; try{ AUDIO.music.play().catch(()=>{}); }catch(e){} }
function stopMusic(){ try{ AUDIO.music.pause(); AUDIO.music.currentTime=0; }catch(e){} }


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
}
function drawParticles(camX){
  particles.forEach(p=>{
    ctx.globalAlpha = Math.max(p.life/18,0);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x-camX, p.y, 4,4);
  });
  ctx.globalAlpha = 1;
}

/* ============================ PICKUPS (FUSES) ============================ */
let pickups = [];
function spawnFuse(x){
  pickups.push({ x:x, y: GROUND_Y-28, collected:false });
}
function spawnPickupsForLevel(lvl){
  pickups = [];
  // spawn 1-3 fuses for non-boss levels, boss level gives a larger ammo pack
  if(lvl.isBoss){ spawnFuse(Math.min(game.world.width-120, game.player.x+420));
  } else {
    const count = 1 + Math.floor(Math.random()*2);
    for(let i=0;i<count;i++) spawnFuse(Math.min(game.world.width-120, game.player.x + 300 + i*140 + Math.random()*180));
  }
}
function drawPickups(camX){
  pickups.forEach(p=>{
    if(p.collected) return;
    ctx.save();
    ctx.translate(p.x-camX, p.y);
    // simple fuse sprite: glowing cylinder
    const gx = 0, gy = 0;
    ctx.fillStyle = "#ffcc33";
    ctx.fillRect(gx-10, gy-8, 20,16);
    ctx.fillStyle = "#333";
    ctx.fillRect(gx-10, gy-8, 4,16);
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
  ctx.translate(x + w/2, y + h);
  ctx.scale(facing, 1);
  const headR = w*0.22;
  ctx.fillStyle = roleColor;
  ctx.strokeStyle = "#00000055";
  ctx.lineWidth = 2;

  // legs
  let legSpread = pose==="walk"||pose==="sprint" ? w*0.18 : w*0.08;
  ctx.fillRect(-w*0.16-legSpread*0.3, -h*0.42, w*0.14, h*0.42);
  ctx.fillRect(w*0.02+legSpread*0.3, -h*0.42, w*0.14, h*0.42);

  // torso
  ctx.fillRect(-w*0.22, -h*0.78, w*0.44, h*0.4);

  // arms by pose
  ctx.fillStyle = roleColor;
  if(pose==="punch"){
    ctx.fillRect(w*0.18, -h*0.7, w*0.42, h*0.13);
  } else if(pose==="kick"){
    ctx.fillRect(-w*0.1, -h*0.45, w*0.55, h*0.13);
  } else if(pose==="shoot"){
    ctx.fillRect(w*0.18, -h*0.62, w*0.5, h*0.08);
  } else if(pose==="hurt"){
    ctx.fillRect(-w*0.32, -h*0.6, w*0.2, h*0.18);
    ctx.fillRect(w*0.12, -h*0.6, w*0.2, h*0.18);
  } else {
    ctx.fillRect(-w*0.3, -h*0.74, w*0.12, h*0.32);
    ctx.fillRect(w*0.18, -h*0.74, w*0.12, h*0.32);
  }

  // head
  ctx.beginPath();
  ctx.arc(0, -h*0.78-headR*0.7, headR, 0, Math.PI*2);
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
    this.maxHealth = isBoss ? 260 : 32;
    this.health = this.maxHealth;
    this.speed = (isBoss?2.6:1.6) * speedMult;
    this.aggroRange = isBoss?900:520;
    this.attackRange = isBoss?100:72;
    this.attackCooldown = 0;
    this.attackDealt = false;
    this.hurtTimer = 0;
    this.deadTimer = 0;
    this.removeMe = false;
    this.gunCooldown = isBoss ? 1800 : Infinity;
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
          this.attackCooldown = this.isBoss?900:1500;
          this.attackDealt = false;
          this._attackPlayer = player;
          if(this.isBoss && Math.random()<0.5 && onShoot){
            onShoot(this.x, this.y+this.h*0.4, this.facing);
          }
        }
        if(this.state==="attack"){
          const arr = SPRITE_FILES.villain.attack;
          const finished = this.advanceFrame(dt, arr.length, false, 150);
          if(!this.attackDealt && this.frame>=Math.floor(arr.length/2)){
            this.attackDealt = true;
            if(Math.abs(player.x-this.x) < this.attackRange+20){
              player.takeDamage(this.isBoss?16:7);
            }
          }
          if(finished){ this.setState("idle"); }
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
    busstand:"SALEM BUS STAND", factory:"VEERA STEEL WORKS", boss:"OLD POWER GODOWN"
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

const STATE = { MENU:"menu", STORY:"story", PLAYING:"playing", LEVEL_DONE:"level_done", BOSS_INTRO:"boss_intro", VICTORY:"victory", GAMEOVER:"gameover" };

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
  lastTime: 0
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
  if(isBoss) elBossName.textContent = "MOOTHA THALAIVAN — THE FUSE THIEF";
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

function meleeHit(range, dmg){
  const p = game.player;
  for(const e of game.enemies){
    if(e.health<=0) continue;
    const dx = (e.x+e.w/2) - (p.x+p.w/2);
    if(Math.sign(dx||1)===p.facing && Math.abs(dx) < range){
      e.takeDamage(dmg);
      spawnSpark(e.x+e.w/2 - game.camX, e.y+e.h*0.4, "#ffcc33");
      if(e.health<=0) onEnemyKilled();
    }
  }
}

function onEnemyKilled(){
  game.kills++;
  playSfx('sfxCollect');
  const lvl = LEVELS[game.levelIndex];
  if(!lvl.isBoss){
    elKillLabel.textContent = `TARGETS DOWN: ${game.kills} / ${lvl.enemyCount}`;
  }
}

function update(dt){
  if(game.state===STATE.PLAYING || game.state===STATE.BOSS_INTRO){
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
      if(game.endless){
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
            if(e.health<=0) onEnemyKilled();
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
      if(Math.abs((p.x+p.w/2) - pk.x) < 48){
        pk.collected = true;
        p.ammo = Math.min(p.maxAmmo, p.ammo + 2);
        p.score += 40;
        playSfx('sfxCollect');
        updateAmmoHUD();
      }
    });

    updateParticles();

    // camera
    const targetCam = p.x - CW*0.42;
    game.camX = Math.max(0, Math.min(game.world.width-CW, targetCam));

    // HUD updates
    elPlayerHealth.style.width = `${p.health}%`;
    if(lvl.isBoss){
      const boss = game.enemies.find(e=>e.isBoss);
      if(boss) elBossHealth.style.width = `${(boss.health/boss.maxHealth)*100}%`;
    }

    // win/lose checks
    if(p.health<=0 && p.deathTimer>900){
      triggerGameOver();
    }
    if(lvl.isBoss){
      const boss = game.enemies.find(e=>e.isBoss);
      if(boss && boss.health<=0 && boss.removeMe){
        triggerVictory();
      }
    } else {
      if(game.kills>=lvl.enemyCount){
        triggerLevelComplete();
      }
    }
  }
}

function triggerLevelComplete(){
  game.state = STATE.LEVEL_DONE;
  hud.classList.add("hidden");
  document.getElementById("level-complete-text").textContent = LEVELS[game.levelIndex].outro;
  showScreen("level-complete-screen");
}
function triggerVictory(){
  // show victory popup after beating boss
  game.state = STATE.VICTORY;
  hud.classList.add("hidden");
  playSfx('sfxCollect');
  stopMusic();
  const victoryStats = document.getElementById('victory-stats');
  if(victoryStats){
    victoryStats.textContent = `FINAL SCORE: ${game.player.score} | HERO HEALTH: ${game.player.health}%`;
  }
  showScreen("victory-screen");
}
function triggerGameOver(){
  game.state = STATE.GAMEOVER;
  hud.classList.add("hidden");
  playSfx('sfxGameOver');
  stopMusic();
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
    ctx.fillText("MOOTHA THALAIVAN APPEARS", CW/2, CH*0.52);
  }
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

/* ============================ UI WIRING ============================ */

document.getElementById("start-btn").addEventListener("click", ()=>{
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
if(exitBtn) exitBtn.addEventListener('click', ()=>{ if(confirm('Exit to menu?')) location.reload(); });

document.getElementById("next-level-btn").addEventListener("click", ()=>{
  showScreen(null);
  const next = game.levelIndex+1;
  if(next < LEVELS.length) startLevel(next);
  else triggerVictory();
});
document.getElementById("restart-btn").addEventListener("click", ()=>{
  showScreen(null);
  startLevel(0);
});
document.getElementById("retry-btn").addEventListener("click", ()=>{
  showScreen(null);
  startLevel(game.levelIndex);
});

// Victory screen Main Menu button
const victoryMenuBtn = document.getElementById('victory-menu-btn');
if(victoryMenuBtn) victoryMenuBtn.addEventListener('click', ()=>{ showScreen(null); document.getElementById('start-screen').classList.remove('hidden'); location.reload(); });

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
}

const endlessBtn = document.getElementById('endless-btn');
if(endlessBtn) endlessBtn.addEventListener('click', ()=>{ showScreen(null); startEndless(); });

// gameover endless retry button (if present)
const retryEndless = document.getElementById('retry-endless-btn');
if(retryEndless) retryEndless.addEventListener('click', ()=>{ showScreen(null); startEndless(); });

// mission complete overlay buttons
const missionExitBtn = document.getElementById('mission-exit-btn');
if(missionExitBtn) missionExitBtn.addEventListener('click', ()=>{ showScreen(null); document.getElementById('start-screen').classList.remove('hidden'); location.reload(); });
const missionWaveBtn = document.getElementById('mission-wave-btn');
if(missionWaveBtn) missionWaveBtn.addEventListener('click', ()=>{ showScreen(null); startEndless(); });

// main menu buttons
const menuBtns = document.querySelectorAll('#menu-btn-story, #menu-btn-endless');
menuBtns.forEach(b=> b.addEventListener('click', ()=>{ location.reload(); }));

})();