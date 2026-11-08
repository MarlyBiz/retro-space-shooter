// Execute the real inline game with a minimal DOM and native CPU Canvas.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.GAME_HTML||'index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);new vm.Script(fs.readFileSync('sw.js','utf8'));
const {sandbox}=require('./harness.cjs')(script);
const run=s=>vm.runInContext(s,sandbox);
run(`
function invariant(e){
 const [lo,hi]=enemyBounds(e.w),cx=e.x+e.w/2;
 assert(e.x>=lo-1e-8&&e.x<=hi+1e-8,'position outside bounds: '+e.k);
 assert(e.x>=-1e-8&&e.x+e.w<=W+1e-8,'sprite outside canvas');
 assert(cx>=player.w/2-1e-8&&cx<=W-player.w/2+1e-8,'center outside single-cannon reach');
 // A baseline 4px-wide bullet centered on the enemy must hit its inset hitbox.
 const inset=e.k==='gunship'?4:3;
 assert(cx-2<e.x+e.w-inset&&cx+2>e.x+inset);
}
let motionChecks=0;
for(const width of [180,240,320,390,844,1440]){
 window.innerWidth=width;window.innerHeight=844;resize();
 for(const k of UNLOCK_ORDER)for(const edge of [-9999,9999]){
  enemies=[];spawnEnemy(k,edge,0);const e=enemies[0];invariant(e);
  for(let i=0;i<2400;i++){
   const before=e.x,dt=[.25,1,3][i%3];
   moveEnemy(e,dt,dt*2.25,i%200<100?20:W-20);
   invariant(e);assert(Math.abs(e.x-before)<=Math.max(4,e.amp*.05)*dt*2.25+1e-8,'edge jump');motionChecks++;
  }
 }
}
// Full game loop: all six patterns, many respawns and actual bullet collisions.
for(const width of [240,390,844]){
 window.innerWidth=width;resize();resetGame();running=true;level=10;syncUnlocks(10);
 for(const k of UNLOCK_ORDER)spawnEnemy(k);
 for(let i=0;i<2400;i++){
  invuln=9999;lives=5;levelDist=0;phase='fly';player.x=i%400<200?0:W-player.w;
  update([.5,1,3][i%3]);enemies.forEach(invariant);
 }
}
// Weaver refits and wide bosses remain valid after live orientation changes.
resetGame();running=true;spawnEnemy('weaver',9999);level=2;phase='boss';startBoss();
for(const width of [1440,240,844,180,390]){
 window.innerWidth=width;resize();enemies.forEach(invariant);invariant({...boss,k:'gunship'});
 for(let i=0;i<600;i++){invuln=9999;bullets=[];fireCd=9999;update(3);invariant({...boss,k:'gunship'})}
}
boss.fleeing=1;boss.fleeT=90;boss.x=W-boss.w;boss.vx=3;
for(let i=0;i<20;i++){update(1);if(boss)invariant({...boss,k:'gunship'})}
// Existing save schema retained; restore old offscreen positions into valid lanes.
resetGame();running=true;level=6;spawnEnemy('dart',-999);spawnEnemy('weaver',9999);power=25;saveRun();
const saved=loadRun();assert.equal(saved.v,6);saved.enemies.forEach(e=>{e.x=-999;e.x0=9999});
assert(applyRun(saved));enemies.forEach(invariant);assert.equal(power,25);
assert.deepEqual(Array.from({length:10},(_,i)=>levelLen(i+1)),[2000,2500,3000,3500,4000,4500,5000,5000,5000,5000]);
assert.deepEqual(Array.from({length:10},(_,i)=>i+1).filter(isBossLevel),[2,4,6,8,10]);
function odds(w,k){return w[k]/Object.values(w).reduce((a,b)=>a+b,0)}
for(let lv=1;lv<=10;lv++){
 let last=0;
 for(const p of [100,75,50,25,0]){const chance=odds(powerWeights(lv,p,3),'repair');assert(chance>=last);last=chance}
 last=0;for(const l of [5,4,3,2,1]){const chance=odds(powerWeights(lv,100,l),'life');assert(chance>=last);last=chance}
 for(const p of [0,50,100])for(const l of [1,2,3,5]){
  const w=powerWeights(lv,p,l);assert(Object.values(w).every(n=>n>0&&n<=8));
  if(lv>1)for(const k of ['scatter','laser'])assert(odds(w,k)>odds(powerWeights(lv-1,p,l),k));
 }
}
// Deterministic stratified draws prove selection matches normalized weights.
for(const params of [[1,100,3],[10,100,3],[1,10,1],[10,10,1]]){
 const weights=powerWeights(...params),counts=Object.fromEntries(PKEYS.map(k=>[k,0]));
 for(let i=0;i<100000;i++)counts[pickPower(weights,(i+.5)/100000)]++;
 for(const k of PKEYS)assert(Math.abs(counts[k]/100000-odds(weights,k))<.00002);
 console.log('Drop odds',params,JSON.stringify(Object.fromEntries(PKEYS.map(k=>[k,+(100*odds(weights,k)).toFixed(2)]))));
}
console.log('PASS:',motionChecks,'deterministic movement checks; 7200 full-game frames; resize, boss, retreat, save, campaign, adaptive odds and 400000 selections');
`);
assert(html.includes('v3.0')&&html.includes('sw.js?v=3.0')&&html.includes("k!=='rss-v3.0'"));
assert(fs.readFileSync('sw.js','utf8').includes("V='rss-v3.0'"));
console.log('PASS: HTML/JS and SW syntax, version/cache consistency; network-first/save schema preserved');
