const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.GAME_HTML||'index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const harness=require('./harness.cjs');

function simLevel(lv, weaponName='scatter'){
 const {run}=harness(script);
 return run(`
  options=cleanOptions({campaign:'50',duration:'unlimited',pickups:'normal'});
  progress.cheat=true;progress.maxLevel=50;progress.hangar=true;progress.ship='interceptor';saveProgress();
  pickStartLevel(${lv});
  resetGame();running=true;paused=false;invuln=9999;
  const locked='${weaponName}';
  weapon=locked;weaponUnlimited=true;wepT=0;
  pSpawnT=99999; // no random weapon swaps — measure gun vs spawn density
  const goal=levelLen(level);
  const maxFrames=Math.ceil(goal/(.5*levelBase(level))*1.2);
  let minPower=100,maxEnemies=0,spawns=0,kills=0,clears=0,emptyFrames=0,lastCount=0;
  const _spawn=spawnEnemy,_credit=creditKill;
  spawnEnemy=function(k,x,y){const before=enemies.length;_spawn(k,x,y);if(enemies.length>before)spawns+=enemies.length-before};
  creditKill=function(e){kills++;_credit(e)};
  for(let f=0;f<maxFrames && phase==='fly';f++){
   let target=null,best=-1;
   for(const e of enemies){if(e.dead)continue;const threat=e.y+e.h*2-Math.abs(e.x+e.w/2-(player.x+player.w/2))*.15;if(threat>best){best=threat;target=e}}
   if(target)player.x=target.x+target.w/2-player.w/2;
   else player.x=W/2-player.w/2;
   player.x=clamp(player.x,...enemyBounds(player.w));
   weapon=locked;weaponUnlimited=true; // lock loadout for the trial
   update(1);
   if(enemies.length===0)emptyFrames++;
   if(enemies.length===0 && lastCount>0)clears++;
   lastCount=enemies.length;
   maxEnemies=Math.max(maxEnemies,enemies.length);
   minPower=Math.min(minPower,power);
   if(power<=0)break;
  }
  const cap=enemyCap(level);
  const spawnMean=spawnInterval(level,levelRush(level,levelGoal,levelGoal))*(.85+.45/2);
  ({lv:level,weapon:locked,phase,spawns,kills,maxEnemies,cap,minPower:+minPower.toFixed(1),power:+power.toFixed(1),clears,emptyFrames,
    spawnMean:+spawnMean.toFixed(1),speed:+speedScale(levelRush(level,levelGoal,levelGoal)).toFixed(2),
    killRatio:spawns?+(kills/spawns).toFixed(3):1,survived:power>0});
 `);
}

{
 const {run}=harness(script);
 run(`
  assert.equal(levelBase(10),1.9);
  assert(levelBase(50)<2.3 && levelBase(50)>2.1);
  assert.equal(enemyCap(1),4);assert.equal(enemyCap(10),4);assert.equal(enemyCap(11),5);assert.equal(enemyCap(50),7);
  const s10=spawnInterval(10,levelRush(10,1e9,1));
  const s50=spawnInterval(50,levelRush(50,1e9,1));
  assert(s10>=40 && s10<=50, 'L10 spawn '+s10);
  assert(s50>=36, 'L50 spawn floor '+s50);
  assert(s10/s50 <= 1.55, 'L50 spawn rate vs L10 '+ (s10/s50));
  assert(speedScale(3)<=2.05);
  assert.equal(enemyHpFor(ET.tank,50),ET.tank.hp);
  assert(drainScale(50)>=.78 && drainScale(50)<=.85);
  assert.equal(bossStats(50).hp,281);
  // drone packs never exceed cap
  options=cleanOptions({campaign:'50'});resetGame();running=true;level=50;syncUnlocks(50);enemies=[];
  for(let i=0;i<40;i++){if(enemies.length<enemyCap(50))spawnEnemy();}
  assert(enemies.length<=enemyCap(50), 'drone pack cap '+enemies.length);
 `);
 console.log('PASS difficulty formula bounds + drone cap');
}

const results=[];
for(const [lv,wep] of [[10,'single'],[10,'scatter'],[30,'scatter'],[50,'scatter'],[50,'single']]){
 const r=simLevel(lv,wep);
 results.push(r);
 console.log('SIM', JSON.stringify(r));
 assert(r.survived, 'must survive L'+lv+' with '+wep+' (power='+r.power+')');
 assert(r.maxEnemies<=r.cap, 'enemy cap held got '+r.maxEnemies+' cap '+r.cap);
 const leftover=r.spawns-r.kills;
 if(wep==='scatter'){
  assert(r.minPower>=40, 'scatter homeland pressure '+r.minPower);
  assert(r.killRatio>=0.75 || leftover<=r.cap+2, 'scatter clear rate '+r.killRatio+' leftover '+leftover);
 }else if(lv<=30){
  assert(r.minPower>=15, 'early/mid single homeland '+r.minPower);
 }
}
const s50=results.find(r=>r.lv===50&&r.weapon==='scatter');
assert(s50.clears>=2, 'L50 scatter should clear the board periodically');
assert(s50.minPower>=40, 'L50 scatter base stable');
const u50=results.find(r=>r.lv===50&&r.weapon==='single');
assert(u50.survived && u50.killRatio>=0.55, 'L50 single keeps pace enough to finish');
assert(html.includes('v4.3.0')&&html.includes("k!=='rss-v4.3.0'"));
assert(fs.readFileSync('sw.js','utf8').includes("V='rss-v4.3.0'"));
console.log('PASS difficulty sims L10/30/50 + version');
