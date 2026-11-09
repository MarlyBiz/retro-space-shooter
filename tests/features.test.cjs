const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.GAME_HTML||'index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);new vm.Script(fs.readFileSync('sw.js','utf8'));
const {run,sandbox,listeners}=require('./harness.cjs')(script);
sandbox.snapshot=name=>{if(process.env.PROOF_DIR){fs.mkdirSync(process.env.PROOF_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.PROOF_DIR,name+'.png'),run("canvas.toBuffer('image/png')"))}};
sandbox.background=()=>{sandbox.document.visibilityState='hidden';listeners.visibilitychange()};
run(`
function fresh(lv=10){resetGame();running=true;paused=false;level=lv;levelGoal=levelLen(lv);initStars();invuln=9999;}
function killFinal(){phase='boss';startBoss();boss.hp=1;
 bullets=[0,1,2].map(()=>({x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#ff0',d:1}));
 loop(last+16.667);assert.equal(phase,'breakup');assert.equal(score,500);assert.equal(boss,null);assert.equal(bullets.length,0);assert.equal(eb.length,0);}
// Exact v2.7 failure: multiple SPREAD bullets with the first killing the boss.
// Run actual update AND native Canvas draw each frame, not just utility functions.
for(const width of [240,390,844])for(const dt of [1,3]){
 window.innerWidth=width;window.innerHeight=844;resize();fresh();killFinal();
 let sawFlight=false;
 for(let i=0;i<405/dt+10;i++){
  if(running)update(dt);draw();if(phase==='escape')sawFlight=true;
 }
 assert(sawFlight);assert.equal(phase,'win');assert.equal(running,false);assert.equal(score,500);
 assert.equal(loadRun(),null);assert.equal($('win').hidden,false);
 victory();assert.equal(score,500);goMenu();assert.equal(phase,'fly');assert.equal(menu.hidden,false);
 startGame();assert.equal(level,1);assert.equal(running,true);assert.equal(phase,'fly');
}
console.log('PASS final multi-hit kill -> native-rendered breakup -> nebula flight -> victory/replay/home (six runs)');
// Pause/background/Continue each ending state, preserving elapsed time and debris.
window.innerWidth=390;resize();fresh();killFinal();
for(let i=0;i<35;i++){update(1);draw()}snapshot('breakup');
for(const targetPhase of ['breakup','escape']){
 while(phase!==targetPhase){update(1);draw()}
 if(targetPhase==='escape')for(let i=0;i<80;i++){update(1);draw()}
 snapshot(targetPhase==='escape'?'nebula-flight':'breakup');
 const elapsed=ending.t;const frags=JSON.stringify(ending.fragments);background();
 assert.equal(paused,true);const saved=loadRun();assert.equal(saved.phase,targetPhase);assert.equal(saved.ending.t,elapsed);
 loop(last+16.667);assert.equal(ending.t,elapsed);
 assert(applyRun(saved));enterRun({restored:1});assert.equal(paused,true);assert.equal(ending.t,elapsed);
 assert.equal(JSON.stringify(ending.fragments),frags);
 window.innerWidth=844;resize();draw();assert.equal(ending.t,elapsed);
 resumeGame();update(1);draw();assert.equal(ending.t,elapsed+1);
}
while(running){update(1);draw()}snapshot('victory');assert.equal(loadRun(),null);
for(const legacyPhase of ['celeb','clear']){
 fresh();saveRun();const data=loadRun();data.phase=legacyPhase;data.ending=undefined;data.clearing=0;
 assert(applyRun(data));assert.equal(phase,'breakup');
 for(let i=0;i<140;i++){if(running)update(3);draw()}assert.equal(phase,'win');
}
console.log('PASS ending background pause, saved Continue, resize, terminal migrations and save cleanup');
// Reachable pickup centers + full sprite bounds from spawn, sway, resize and save.
function pickupInvariant(p){const [lo,hi]=enemyBounds(p.w);assert(p.x>=lo-1e-8&&p.x<=hi+1e-8);assert(p.x>=0&&p.x+p.w<=W);assert(p.x+13>=20&&p.x+13<=W-20)}
let pickupChecks=0;
for(const width of [180,240,390,844,1440]){
 window.innerWidth=width;resize();fresh(6);
 for(let i=0;i<100;i++){spawnPower();pickupInvariant(powerups.at(-1));pickupChecks++}
 for(const side of [-9999,9999]){
  powerups=[{k:'repair',x:side,y:-26,w:26,h:26,age:0}];fitPower(powerups[0]);
  for(let i=0;i<1200;i++){powerups[0].y=-26;pSpawnT=9999;updatePowerups(3);pickupInvariant(powerups[0]);pickupChecks++}
 }
 for(const w of [240,1440,width]){window.innerWidth=w;resize();powerups.forEach(pickupInvariant)}
 powerups[0].x=-9999;saveRun();const saved=loadRun();saved.powerups.push({...saved.powerups[0],x:9999});applyRun(saved);powerups.forEach(pickupInvariant);
 for(const k of PKEYS)for(const edge of ['left','right']){
  player.x=edge==='left'?0:W-player.w;const [lo,hi]=enemyBounds(26);
  powerups=[{k,x:edge==='left'?lo:hi,y:player.y+12,w:26,h:26,age:0}];pSpawnT=9999;
  updatePowerups(0);assert.equal(powerups.length,0,'edge pickup unreachable '+k);
 }
}
console.log('PASS',pickupChecks,'pickup bounds checks, all item types collectible at both extreme lanes, rotation and legacy saves');
// Every even encounter harder, retaining sequential five guns and early retreats.
let lastStats=null,firstShots=0,lastShots=0;
for(const lv of [2,4,6,8,10]){
 window.innerWidth=390;resize();fresh(lv);phase='boss';startBoss();
 const stats=bossStats(lv);assert.equal(boss.hp,stats.hp);
 if(lastStats){assert(stats.hp>lastStats.hp);assert(stats.interval<lastStats.interval);assert(stats.speed>lastStats.speed);assert(stats.shotSpeed>lastStats.shotSpeed)}
 for(let i=0;i<600;i++){bullets=[];fireCd=9999;invuln=9999;pSpawnT=9999;update(1);draw();assert.equal(enemies.length,0)}
 if(lv===2)firstShots=boss.gun;if(lv===10)lastShots=boss.gun;
 assert(boss.gun>=5);lastStats=stats;
 if(lv<10){
  boss.hp=1;bullets=[0,1].map(()=>({x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#fff',d:1}));update(1);draw();
  assert(boss.fleeing);assert.equal(phase,'boss');
  for(let i=0;i<200&&phase==='boss';i++){update(1);draw()}
  assert.equal(phase,'clear');for(let i=0;i<80;i++)update(1);assert.equal(level,lv+1);assert.equal(phase,'fly');
 }
}
assert(lastShots>firstShots);assert.equal(bossMaxHp(10)/bossMaxHp(2),3);
fresh(2);levelDist=levelGoal;spawnT=0;update(1);assert.equal(phase,'boss');assert.equal(enemies.length,0);
// Preserve damaged old boss's remaining HP fraction; don't restart a half-won fight.
fresh();phase='boss';startBoss();saveRun();const old=loadRun();old.boss.maxHp=68;old.boss.hp=34;assert(applyRun(old));assert.equal(boss.maxHp,108);assert.equal(boss.hp,54);
console.log('PASS boss HP 36/54/72/90/108, cadence 60/57/54/51/48, speed 1.4/1.55/1.7/1.85/2, shots 3/3.1/3.2/3.3/3.4, five guns, retreats, boss-only transitions and old saves');
// Rocket pickup, finite homing steering, actual hits, no-target cleanup and saves.
fresh(6);player.x=20;spawnEnemy('tank',200,150);weapon='rocket';wepT=900;fireCd=0;shoot(1);
assert.equal(bullets.length,1);assert.equal(bullets[0].kind,'rocket');assert.equal(bullets[0].d,2);assert.equal(fireCd,32);
const initialX=bullets[0].x;for(let i=0;i<25;i++){advanceBullets(1);draw()}
assert(bullets[0].x>initialX+10,'rocket did not seek off-axis target');assert(Math.abs(Math.hypot(bullets[0].vx,bullets[0].vy)-7)<1e-8);
saveRun();const rocketSave=loadRun();assert.equal(rocketSave.weapon,'rocket');assert.equal(rocketSave.bullets[0].kind,'rocket');
const ttl=rocketSave.bullets[0].ttl;rocketSave.playerX=0;assert(applyRun(rocketSave));assert.equal(player.x,0);assert.equal(bullets[0].ttl,ttl);
enemies=[];for(let i=0;i<170;i++){advanceBullets(1);draw()}assert.equal(bullets.length,0);
// Real collision path applies the promised two damage.
fresh(6);spawnEnemy('tank',100,100);const tank=enemies[0];
bullets=[{x:tank.x+tank.w/2,y:tank.y+20,vx:0,vy:-7,w:8,h:18,c:'#fa4',d:2,kind:'rocket',ttl:150}];
spawnT=9999;fireCd=9999;update(1);draw();assert.equal(tank.hp,2);assert.equal(bullets.length,0);
// A launched rocket must actually intercept a moving off-axis enemy.
fresh(6);player.x=20;spawnEnemy('diver',220,100);weapon='rocket';wepT=900;shoot(1);fireCd=9999;spawnT=9999;invuln=9999;
for(let i=0;i<100;i++){update(1);draw()}assert.equal(score,10);assert.equal(enemies.length,0);
// Target selection also works during boss-only fights, including after restore.
fresh();phase='boss';startBoss();player.x=0;weapon='rocket';fireCd=0;shoot(1);advanceBullets(1);assert(bullets[0].vx>0);draw();
boss.fleeing=1;advanceBullets(1);draw();bullets[0].x=-100;advanceBullets(1);assert.equal(bullets.length,0);
// New rocket weights increase with stages; corresponding recovery weights still dominate when needed.
for(let lv=2;lv<=10;lv++)assert(powerWeights(lv).rocket>powerWeights(lv-1).rocket);
assert.equal(powerWeights(1).rocket,1);assert.equal(powerWeights(10).rocket,2);
console.log('PASS homing rocket acquisition/steering, native draw, 2-damage collisions, boss targeting, 150-frame TTL, offscreen cleanup, save restoration and bounded adaptive weights');
`);
assert(html.includes('v4.1.6')&&html.includes('sw.js?v=4.1.6')&&html.includes("k!=='rss-v4.1.6'"));
assert(fs.readFileSync('sw.js','utf8').includes("V='rss-v4.1.6'"));
console.log('PASS syntax and consistent v4.1.6 shell/service-worker cache version');
