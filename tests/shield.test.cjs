const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.GAME_HTML||'index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const {run}=require('./harness.cjs')(script);
run(`
function fresh(){resetGame();running=true;paused=false;invuln=0;phase='fly';pSpawnT=9999;spawnT=9999;}
function collect(k){const x=player.x+player.w/2-13;powerups=[{k,x,y:player.y+12,w:26,h:26,age:0}];pSpawnT=9999;updatePowerups(0);assert.equal(powerups.length,0)}

// Start each life with 1 of 2 charges; stock gun hides the meter.
fresh();assert.equal(SHIELD_MAX,2);assert.equal(SHIELD_INVULN,36);
assert.equal(shieldCharges,1);assert.equal(weapon,'single');
let m=weaponMeter();assert.equal(m.visible,false);assert.equal(m.frac,0);

// A hit with a charge up absorbs, keeps the life and gun, and grants ~0.6s i-frames.
runOptions.duration='1';acquireWeapon('scatter');assert.equal(wepT,900);assert.equal(wepMax,900);
const lives0=lives;takeHit('HIT BY ENEMY FIRE');
assert.equal(lives,lives0);assert.equal(shieldCharges,0);assert.equal(invuln,36);assert.equal(weapon,'scatter');assert.equal(wepT,900);
assert.equal(banner.t,'SHIELD DOWN');

// While invulnerable, further hits are ignored.
takeHit('HIT BY ENEMY FIRE');assert.equal(lives,lives0);assert.equal(shieldCharges,0);

// After i-frames, a hit with 0 charges costs a life and respawns with 1 charge.
invuln=0;takeHit('HIT BY ENEMY FIRE');
assert.equal(lives,lives0-1);assert.equal(shieldCharges,1);assert.equal(invuln,120);assert.equal(weapon,'single');

// Shield pickup restores to 2; a second collect stays at 2.
collect('shield');assert.equal(shieldCharges,2);collect('shield');assert.equal(shieldCharges,2);

// Two charges absorb two hits; the third costs a life. Weapon survives the absorbs.
invuln=0;acquireWeapon('laser');const L=lives;
takeHit('x');assert.equal(lives,L);assert.equal(shieldCharges,1);assert.equal(weapon,'laser');
invuln=0;takeHit('x');assert.equal(lives,L);assert.equal(shieldCharges,0);assert.equal(weapon,'laser');
invuln=0;takeHit('x');assert.equal(lives,L-1);assert.equal(shieldCharges,1);assert.equal(weapon,'single');

// Real bullet and ram collisions go through takeHit.
fresh();shieldCharges=1;lives=3;weapon='rapid';wepT=400;wepMax=900;
eb=[{x:player.x+player.w/2,y:player.y+player.h/2,vx:0,vy:0}];
update(1);assert.equal(lives,3);assert.equal(shieldCharges,0);assert.equal(invuln,36);assert.equal(weapon,'rapid');

fresh();shieldCharges=1;lives=3;invuln=0;enemies=[];
spawnEnemy('ram',player.x,player.y);enemies[0].x=player.x;enemies[0].y=player.y;
collideEnemies();assert.equal(lives,3);assert.equal(shieldCharges,0);assert.equal(invuln,36);

// Beam is absorbed, then a second beam after i-frames costs a life.
fresh();level=40;phase='boss';startBoss();boss.mode='beam';boss.modeT=BEAM_WARN;invuln=0;lives=3;shieldCharges=1;
player.x=boss.x+boss.w/2-player.w/2;updateBossMode(1);
assert.equal(lives,3);assert.equal(shieldCharges,0);
invuln=0;boss.mode='beam';boss.modeT=BEAM_WARN;updateBossMode(1);assert.equal(lives,2);

// Homeland breach still costs a life directly (not a ship-shield hit) and the new life starts with 1 charge.
fresh();shieldCharges=2;lives=3;invuln=0;loseLife('HOMELAND BREACH! -1 LIFE');
assert.equal(lives,2);assert.equal(shieldCharges,1);

// All five ships get a starting charge and can absorb a hit.
for(const k of SHIP_KEYS){
 pickShip(k);resetGame();running=true;invuln=0;assert.equal(shieldCharges,1);
 const before=lives;takeHit('x');assert.equal(lives,before);assert.equal(shieldCharges,0);
}

// Meter: hidden on stock, matches weapon colors, depletes smoothly, flashes in last 2s.
fresh();runOptions.duration='1';
const colors={dual:'#0ff',scatter:'#ff0',rapid:'#f0f',laser:'#f33',rocket:'#fa4'};
for(const [k,c] of Object.entries(colors)){
 acquireWeapon(k);m=weaponMeter();assert.equal(m.visible,true);assert.equal(m.frac,1);assert.equal(m.color,c);assert.equal(m.flash,false);
 tickWeapon(wepMax/2);m=weaponMeter();assert(Math.abs(m.frac-.5)<1e-9);assert.equal(m.flash,false);
 wepT=120;m=weaponMeter();assert.equal(m.flash,true);assert(Math.abs(m.frac-120/wepMax)<1e-9);
 tickWeapon(120);assert.equal(weapon,'single');m=weaponMeter();assert.equal(m.visible,false);
}
runOptions.duration='unlimited';acquireWeapon('scatter');m=weaponMeter();
assert.equal(m.visible,true);assert.equal(m.frac,1);assert.equal(m.flash,false);tickWeapon(10000);assert.equal(weapon,'scatter');

// Save/restore keeps charges and meter fraction. Legacy saves without shieldCharges get 1.
fresh();shieldCharges=2;runOptions.duration='1';acquireWeapon('rocket');tickWeapon(300);saveRun();
const saved=loadRun();assert.equal(saved.shieldCharges,2);assert.equal(saved.wepMax,900);assert.equal(saved.wepT,600);
resetGame();assert(applyRun(saved));assert.equal(shieldCharges,2);assert.equal(weapon,'rocket');
m=weaponMeter();assert.equal(m.visible,true);assert(Math.abs(m.frac-600/900)<1e-9);assert.equal(m.color,'#fa4');
const legacy=loadRun();delete legacy.shieldCharges;delete legacy.wepMax;legacy.wepT=300;legacy.weapon='laser';legacy.weaponUnlimited=false;
assert(applyRun(legacy));assert.equal(shieldCharges,1);assert.equal(weapon,'laser');assert(weaponMeter().frac>0&&weaponMeter().frac<=1);

// Modest shield drop weight sits with the existing table and stays in the 0–8 band.
assert.equal(powerWeights(1,100,3).shield,1.2);
for(let lv=1;lv<=50;lv++)for(const p of [0,50,100])for(const l of [1,3,5]){
 const w=powerWeights(lv,p,l);assert(w.shield>0&&w.shield<=8);
 const total=Object.values(w).reduce((a,b)=>a+b,0);
 assert(w.shield/total<0.15);
}
assert(PKEYS.includes('shield'));assert.equal(PT.shield.c,'#6ef');

draw();
console.log('PASS shield charges/absorb (bullet, ram, beam), respawn charge, all five ships, meter colors/deplete/flash, save/legacy, modest drop weight');
`);
assert(html.includes('v4.5.0')&&html.includes('sw.js?v=4.5.0')&&html.includes("k!=='rss-v4.5.0'"));
assert(fs.readFileSync('sw.js','utf8').includes("V='rss-v4.5.0'"));
console.log('PASS v4.5.0 version consistency');

// Headless gameplay screenshot: bright 2-charge glow + yellow spread meter.
const {run:run2,sandbox}=require('./harness.cjs')(script);
sandbox.window.innerWidth=390;sandbox.window.innerHeight=844;
run2(`
resize();resetGame();running=true;paused=false;invuln=0;shieldCharges=2;shieldFlash=0;frame=40;
runOptions.duration='1';acquireWeapon('scatter');wepT=540;wepMax=900;level=6;syncUnlocks(6);
initStars();pSpawnT=9999;spawnT=9999;enemies=[];eb=[];bullets=[];
spawnEnemy('diver',80,120);spawnEnemy('weaver',200,180);spawnEnemy('tank',300,90);
player.x=W/2-player.w/2;player.y=homeY()-20;draw();
`);
const out=process.env.PROOF_SHOT||'/workspace/shooter-art-review/v45-shield-meter.png';
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,run2("canvas.toBuffer('image/png')"));
console.log('WROTE',out);
