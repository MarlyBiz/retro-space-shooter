const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.GAME_HTML||'index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);new vm.Script(fs.readFileSync('sw.js','utf8'));
const harness=require('./harness.cjs');const {run,listeners}=harness(script);
run(`
assert.equal(options.duration,'1');assert.equal(options.pickups,'normal');
for(const bad of [null,[],3,'bad',{duration:Infinity,pickups:true},{duration:'4',pickups:'fast'}]){
 const clean=cleanOptions(bad);assert.equal(clean.duration,'1');assert.equal(clean.pickups,'normal');
}
function collect(k){const x=player.x+player.w/2-13;powerups=[{k,x,y:player.y+12,w:26,h:26,age:0}];pSpawnT=9999;updatePowerups(0);assert.equal(powerups.length,0)}
for(const duration of ['1','2','3','unlimited'])for(const k of ['dual','scatter','rapid','laser','rocket']){
 options=cleanOptions({duration});resetGame();running=true;paused=false;assert.equal(weapon,'single');collect(k);
 assert.equal(weapon,k);assert.equal(weaponUnlimited,duration==='unlimited');
 if(duration==='unlimited'){
  assert.equal(wepT,0);tickWeapon(100000);assert.equal(weapon,k);updateHUD();assert(hw.textContent.includes('∞'));
 }else{
  assert.equal(wepT,900*Number(duration));tickWeapon(wepT-1);assert.equal(weapon,k);tickWeapon(1);assert.equal(weapon,'single');assert.equal(wepT,0);
 }
}
// The actual normal/boss update paths both use the chosen lifetime policy.
for(const mode of ['fly','boss']){
 options=cleanOptions(null);resetGame();running=true;level=2;phase=mode;if(mode==='boss')startBoss();invuln=9999;spawnT=9999;
 acquireWeapon('laser');wepT=1;update(1);assert.equal(weapon,'single');
 runOptions.duration='unlimited';acquireWeapon('rocket');update(3);assert.equal(weapon,'rocket');assert(weaponUnlimited);draw();
}
// Applying a duration change never refills, shortens or alters the current gun.
options=cleanOptions(null);resetGame();running=true;acquireWeapon('laser');tickWeapon(450);pauseGame();openOptions();
$('durationOption').value='unlimited';$('pickupsOption').value='more';applyOptions();
assert(paused);assert.equal(wepT,450);assert.equal(weaponUnlimited,false);assert.equal(runOptions.duration,'unlimited');
collect('rocket');assert(weaponUnlimited);tickWeapon(100000);assert.equal(weapon,'rocket');
const before=lives;loseLife('TEST HIT');assert.equal(lives,before-1);assert.equal(weapon,'rocket');assert.equal(invuln,120);
for(const k of ['repair','life','bomb']){collect(k);assert.equal(weapon,'rocket');assert(weaponUnlimited)}
openOptions();$('durationOption').value='2';applyOptions();assert(weaponUnlimited);assert.equal(weapon,'rocket');
collect('scatter');assert.equal(weapon,'scatter');assert(!weaponUnlimited);assert.equal(wepT,1800);
// Per-run settings, active gun lifetime and finite JSON survive saving/restoring.
runOptions=cleanOptions({duration:'unlimited',pickups:'more'});acquireWeapon('rocket');saveRun();
const saved=loadRun();assert.equal(saved.weaponUnlimited,true);assert.equal(saved.wepT,0);assert(!localStorage.getItem(SAVE_KEY).includes('"wepT":null'));
options=cleanOptions(null);resetGame();assert(applyRun(saved));assert.equal(runOptions.pickups,'more');assert(weaponUnlimited);assert.equal(weapon,'rocket');
runOptions.duration='3';acquireWeapon('dual');tickWeapon(100);saveRun();const timed=loadRun();resetGame();applyRun(timed);assert.equal(wepT,2600);assert(!weaponUnlimited);
// Old v6 saves keep normal options and exactly their old remaining weapon timer.
const old={...timed,options:undefined,weaponUnlimited:undefined,wepT:321};assert(applyRun(old));assert.equal(runOptions.duration,'1');assert.equal(runOptions.pickups,'normal');assert.equal(wepT,321);
const corrupt={...timed,options:{duration:'nope',pickups:'nope'},weaponUnlimited:'true',wepT:Infinity};assert(applyRun(corrupt));assert.equal(weapon,'single');assert.equal(wepT,0);assert.equal(runOptions.duration,'1');
// Default cadence stays unchanged; More speeds only the existing pickup clock.
options=cleanOptions(null);resetGame();powerups=[];pSpawnT=100;updatePowerups(10);assert.equal(pSpawnT,90);
runOptions.pickups='more';pSpawnT=100;updatePowerups(10);assert.equal(pSpawnT,85);
// Home preferences persist for new runs; Continue restores its own saved options.
running=false;openOptions();$('durationOption').value='3';$('pickupsOption').value='more';applyOptions();assert.equal(JSON.parse(localStorage.getItem(OPTIONS_KEY)).duration,'3');
resetGame();assert.equal(runOptions.duration,'3');assert.equal(weapon,'single');assert(!weaponUnlimited);assert.equal(lives,3);
applyRun(old);assert.equal(runOptions.duration,'1');assert.equal(options.duration,'3');
$('resetOptions').onclick();assert.equal(options.duration,'1');assert.equal(options.pickups,'normal');
// Cancel leaves settings alone and menu/pause hooks are actually installed.
assert.equal($('homeOptions').onclick,openOptions);assert.equal($('pauseOptions').onclick,openOptions);
openOptions();$('durationOption').value='unlimited';$('cancelOptions').onclick();assert.equal(options.duration,'1');
// Small regression smoke only: existing final multi-bullet kill still animates to victory.
options=cleanOptions(null);resetGame();running=true;paused=false;level=10;phase='boss';startBoss();boss.hp=1;
bullets=[0,1].map(()=>({x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#fff',d:1}));update(1);draw();assert.equal(phase,'breakup');
for(let i=0;i<140;i++){if(running)update(3);draw()}assert.equal(phase,'win');
console.log('PASS all five timed weapons × four durations; expiry/unlimited/replacement/life loss; next-pickup policy; finite saved timers; legacy/invalid saves; defaults/cadence; home/pause/reset/cancel; native-rendered finale smoke');
`);
for(const value of ['broken JSON',JSON.stringify({duration:'invalid',pickups:5}),JSON.stringify({duration:'unlimited',pickups:'more'})]){
 const {run:r}=harness(script,{rssOptions:value});
 assert.equal(r('options.duration'),value.includes('unlimited')?'unlimited':'1');
 assert.equal(r('options.pickups'),value.includes('unlimited')?'more':'normal');
}
assert(html.includes('sw.js?v=4.1.8')&&html.includes("k!=='rss-v4.1.8'"));assert(fs.readFileSync('sw.js','utf8').includes("V='rss-v4.1.8'"));
console.log('PASS guarded persisted preferences, syntax and consistent v4.1.8 HTML/SW versions');
