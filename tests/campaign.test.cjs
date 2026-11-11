// v4.0: 50-level campaign, five bosses, unlock schedule, picker persistence, saves, boss attacks.
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const {run}=require('./harness.cjs')(script);
run(`
assert.deepEqual(Array.from({length:50},(_,i)=>levelLen(i+1)).slice(0,8),[2000,2500,3000,3500,4000,4500,5000,5000]);
assert(Array.from({length:44},(_,i)=>levelLen(i+7)).every(v=>v===5000));
assert.equal(BOSS_ORDER.join(),'gunship,dreadnought,hive,eclipse,warlord');
for(let lv=1;lv<=50;lv++)assert.equal(bossKey(lv),BOSS_ORDER[Math.floor((lv-1)/10)]);
const NEW=['ram','mortar','drone','spinner','wraith','phantom','lancer','bulwark'];
assert.deepEqual(NEW.map(k=>ET[k].at),[11,16,21,26,31,36,41,46]);
for(const [i,k] of UNLOCK_ORDER.slice(0,6).entries())assert.equal(ET[k].at,i+1);
syncUnlocks(15);assert(unlocked.has('ram')&&!unlocked.has('mortar'));syncUnlocks(50);assert.equal(unlocked.size,14);
// within-block ramp unchanged for boss 1, and every later boss is tougher block-for-block
assert.deepEqual([2,4,6,8,10].map(l=>bossStats(l).hp),[36,54,72,90,108]);
for(let b=1;b<5;b++)for(const e of [2,4,6,8,10]){const a=bossStats((b-1)*10+e),c=bossStats(b*10+e);assert(c.hp>a.hp&&c.interval<=a.interval&&c.speed>a.speed&&c.shotSpeed>a.shotSpeed)}
assert(levelBase(50)<2.6&&levelBase(10)===1.9);
// picker persistence and campaign length
assert.equal(options.campaign,'10');
$('campaignPick').value='30';$('campaignPick').onchange();
assert.equal(JSON.parse(localStorage.getItem(OPTIONS_KEY)).campaign,'30');
resetGame();assert.equal(MAX_LEVEL,30);
running=true;level=25;phase='fly';saveRun();const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
options=cleanOptions({...options,campaign:'50'});resetGame();assert.equal(MAX_LEVEL,50);
assert(applyRun(saved));assert.equal(MAX_LEVEL,30);assert.equal(level,25);
const old=JSON.parse(JSON.stringify(saved));delete old.options.campaign;old.level=8;assert(applyRun(old));assert.equal(MAX_LEVEL,10);
const old2=JSON.parse(JSON.stringify(saved));old2.level=25;delete old2.options.campaign;assert(applyRun(old2));assert.equal(level,10);
assert.deepEqual(Array.from({length:50},(_,i)=>i+1).filter(isBossLevel).length,5);
// block finale continues the campaign; final boss ends it
options=cleanOptions({...options,campaign:'20'});resetGame();running=true;paused=false;invuln=9999;
level=10;phase='boss';startBoss();assert.equal(boss.k,'gunship');boss.hp=1;bullets=[{x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#fff',d:1}];
update(1);assert.equal(phase,'breakup');assert.equal(ending.k,'gunship');
for(let i=0;i<200&&phase!=='fly';i++){update(3);draw()}
assert.equal(phase,'fly');assert.equal(level,11);assert(running);
level=12;phase='boss';startBoss();assert.equal(boss.k,'dreadnought');boss.hp=1;invuln=9999;bullets=[{x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#fff',d:1}];
update(1);assert(boss&&boss.fleeing,'non-final dreadnought retreats');
level=20;phase='boss';startBoss();boss.hp=1;invuln=9999;bullets=[{x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#fff',d:1}];
update(1);assert.equal(ending.k,'dreadnought');while(running){update(3)}assert.equal(phase,'win');
// each boss attack runs: spreads, swarms, cloak/teleport/beam, ring
options=cleanOptions({...options,campaign:'50'});
const seen={};
for(const lv of [10,20,30,40,50]){
 resetGame();running=true;paused=false;level=lv;phase='boss';startBoss();const k=boss.k;seen[k]={drones:0,modes:new Set(),shots:0};
 for(let i=0;i<1500&&boss&&running;i++){invuln=9999;lives=3;fireCd=9999;bullets=[];const n=eb.length;update(1);draw();
  if(!boss)break;seen[k].shots+=Math.max(0,eb.length-n);seen[k].drones=Math.max(seen[k].drones,enemies.filter(e=>e.k==='drone').length);if(boss.mode)seen[k].modes.add(boss.mode);
  assert(boss.x>=-1e-8&&boss.x+boss.w<=W+1e-8)}
}
assert(seen.gunship.shots>5&&seen.dreadnought.shots>10);
assert(seen.hive.drones>=2 && seen.hive.drones<=2);assert(seen.eclipse.modes.has('cloak')&&seen.eclipse.modes.has('beam'));
assert(seen.warlord.shots>10&&seen.warlord.modes.has('beam'));
// beam actually hits a player standing under it once active
resetGame();running=true;level=40;phase='boss';startBoss();boss.mode='beam';boss.modeT=BEAM_WARN;invuln=0;lives=3;
player.x=boss.x+boss.w/2-player.w/2;updateBossMode(1);assert.equal(lives,2);
// new enemies: behaviour smoke with fire at any distance
resetGame();running=true;level=50;syncUnlocks(50);invuln=9999;
for(const k of NEW){enemies=[];eb=[];spawnEnemy(k,100,60);for(let i=0;i<200;i++){update(1);draw();if(!enemies.length)spawnEnemy(k,100,60)}}
`);
console.log('PASS v4.0 50-level lengths, 5-boss schedule/scaling, 8 unlocks at 11..46, picker persistence, save/legacy campaign length, block finale -> next level, final victory, all boss attacks, beam hit, new-enemy smoke');
