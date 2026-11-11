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
  let spawnDepth=0;
  spawnEnemy=function(k,x,y){const before=enemies.length;spawnDepth++;_spawn(k,x,y);spawnDepth--;if(spawnDepth===0&&enemies.length>before)spawns+=enemies.length-before};
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
  assert.equal(levelBase(1),1);
  assert.equal(levelBase(10),1.9);
  assert(levelBase(50)<2.3 && levelBase(50)>2.1);
  assert.equal(enemyCap(1),4);assert.equal(enemyCap(10),4);assert.equal(enemyCap(11),5);assert.equal(enemyCap(21),5);assert.equal(enemyCap(30),5);assert.equal(enemyCap(50),6);
  const s10=spawnInterval(10,levelRush(10,1e9,1));
  const s21=spawnInterval(21,levelRush(21,1e9,1));
  const s50=spawnInterval(50,levelRush(50,1e9,1));
  assert(s10>=40 && s10<=50, 'L10 spawn '+s10);
  assert(s21>=54 && s50>=54, 'late spawn floor '+s21+'/'+s50);
  assert(s50>=s10, 'L50 spawn not faster than L10');
  assert(speedScale(3,10)<=2.05);
  assert(speedScale(3,21)<=1.8);
  assert(firePace(2.4,10)>1.2);
  assert(firePace(2.4,21)<=1.08);
  assert.equal(bulletCap(1),18);assert.equal(bulletCap(21),8);assert.equal(bulletCap(50),8);
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
for(const [lv,wep] of [[10,'single'],[10,'scatter'],[21,'scatter'],[21,'single'],[30,'scatter'],[50,'scatter'],[50,'single']]){
 const r=simLevel(lv,wep);
 results.push(r);
 console.log('SIM', JSON.stringify(r));
 assert(r.survived, 'must survive L'+lv+' with '+wep+' (power='+r.power+')');
 assert(r.maxEnemies<=r.cap, 'enemy cap held got '+r.maxEnemies+' cap '+r.cap);
 const leftover=r.spawns-r.kills;
 if(wep==='scatter'){
  assert(r.minPower>=40, 'scatter homeland pressure '+r.minPower);
  assert(r.killRatio>=0.72 || leftover<=r.cap+2, 'scatter clear rate '+r.killRatio+' leftover '+leftover);
 }else if(lv<=30){
  assert(r.minPower>=15, 'early/mid single homeland '+r.minPower);
 }
}
const s21=results.find(r=>r.lv===21&&r.weapon==='scatter');
assert(s21.survived && s21.minPower>=40, 'L21 scatter homeland '+s21.minPower);
assert(s21.clears>=2, 'L21 scatter should clear the board periodically');
const s50=results.find(r=>r.lv===50&&r.weapon==='scatter');
assert(s50.clears>=2, 'L50 scatter should clear the board periodically');
assert(s50.minPower>=40, 'L50 scatter base stable');
const u50=results.find(r=>r.lv===50&&r.weapon==='single');
assert(u50.survived && u50.killRatio>=0.55, 'L50 single keeps pace enough to finish');

function formulaRow(lv){
 const {run}=harness(script);
 return run(`
  const base=levelBase(${lv}), rush0=levelRush(${lv},0,levelLen(${lv})), rush1=levelRush(${lv},levelLen(${lv}),levelLen(${lv}));
  ({lv:${lv}, cap:enemyCap(${lv}),
    spawn0:+spawnInterval(${lv},rush0).toFixed(1), spawn1:+spawnInterval(${lv},rush1).toFixed(1),
    spawnMean:+(spawnInterval(${lv},rush1)*(.85+.45/2)).toFixed(1),
    speed0:+speedScale(rush0,${lv}).toFixed(2), speed1:+speedScale(rush1,${lv}).toFixed(2),
    fire0:+firePace(rush0,${lv}).toFixed(2), fire1:+firePace(rush1,${lv}).toFixed(2),
    bulletCap:bulletCap(${lv}), bulletSpd:+(3.2*firePace(rush1,${lv})).toFixed(2),
    drain:+drainScale(${lv}).toFixed(2)});
 `);
}
console.log('TABLE lv cap spawnStart spawnEnd spawnMean speedStart speedEnd fireStart fireEnd bulletCap bulletSpd drain');
for(const lv of [1,10,11,21,30,40,50]){
 const r=formulaRow(lv);
 console.log('ROW', JSON.stringify(r));
}

function survive30(lv, weaponName='scatter'){
 const {run}=harness(script);
 return run(`
  options=cleanOptions({campaign:'50',duration:'unlimited',pickups:'normal'});
  progress.cheat=true;progress.maxLevel=50;progress.hangar=true;progress.ship='interceptor';saveProgress();
  pickStartLevel(${lv});
  resetGame();running=true;paused=false;invuln=60;
  const locked='${weaponName}';
  weapon=locked;weaponUnlimited=true;wepT=0;pSpawnT=99999;
  let minLives=lives,maxEb=0,hits=0;
  const startLives=lives;
  for(let f=0;f<1800 && running && lives>0 && phase==='fly';f++){
   // dodge incoming shots, else track the nearest threat
   let dodge=null,bestD=1e9;
   for(const b of eb){
    if(b.vy<=0)continue;
    const t=(player.y-(b.y))/Math.max(.2,b.vy);
    if(t<0||t>50)continue;
    const ix=b.x+b.vx*t, cx=player.x+player.w/2;
    const dist=Math.abs(ix-cx);
    if(dist<player.w*.7 && dist<bestD){bestD=dist;dodge=ix<cx?1:-1}
   }
   if(dodge){player.x+=dodge*4.5}
   else{
    let target=null,best=-1;
    for(const e of enemies){if(e.dead)continue;const threat=e.y+e.h*2-Math.abs(e.x+e.w/2-(player.x+player.w/2))*.15;if(threat>best){best=threat;target=e}}
    if(target)player.x=target.x+target.w/2-player.w/2;
   }
   player.x=clamp(player.x,...enemyBounds(player.w));
   weapon=locked;weaponUnlimited=true;
   const livesBefore=lives;
   update(1);
   if(lives<livesBefore)hits++;
   minLives=Math.min(minLives,lives);
   maxEb=Math.max(maxEb,eb.length);
  }
  ({lv:level,weapon:locked,frames:1800,lives,minLives,hits,maxEb,bulletCap:bulletCap(level),phase,power:+power.toFixed(1),running,survived:running&&lives>0});
 `);
}
for(const [lv,wep,maxHits] of [[21,'scatter',1],[21,'single',2],[50,'scatter',1]]){
 const r=survive30(lv,wep);
 console.log('SURVIVE30', JSON.stringify(r));
 assert(r.survived, '30s L'+lv+' '+wep+' must survive (lives='+r.lives+')');
 assert(r.hits<=maxHits, '30s L'+lv+' '+wep+' hits '+r.hits+' > '+maxHits);
 assert(r.maxEb<=r.bulletCap, 'bullet cap held '+r.maxEb+'/'+r.bulletCap);
}
assert(html.includes('v4.4.0')&&html.includes("k!=='rss-v4.4.0'"));
assert(fs.readFileSync('sw.js','utf8').includes("V='rss-v4.4.0'"));
console.log('PASS difficulty sims L10/21/30/50 + 30s survival + version');
