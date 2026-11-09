// v3.1: vertical climb/ease-home, banking, boss hit glow (no rect), save/restore Y.
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const {run}=require('./harness.cjs')(script);
run(`
const hy=homeY(),ty=topY();assert(ty<hy&&ty>=baseTop*(1-PLAYER_RISE)-1);assert.equal(player.y,hy);
keys.ArrowUp=true;for(let i=0;i<400;i++)updatePlayer(1);assert.equal(player.y,ty);keys.ArrowUp=false;
for(let i=0;i<200;i++)updatePlayer(1);assert.equal(player.y,hy);
keys.w=true;for(let i=0;i<20;i++)updatePlayer(1);keys.w=false;const mid=player.y;assert(mid<hy);
player.x=20;player.lx=null;keys.ArrowRight=true;for(let i=0;i<25;i++)updatePlayer(1);keys.ArrowRight=false;assert(player.bank>.8,'fast bank '+player.bank);
for(let i=0;i<120;i++)updatePlayer(1);assert(Math.abs(player.bank)<.02);
player.x=50;player.lx=null;ptrX=null;for(let i=0;i<30;i++){player.x+=1.5;updatePlayer(1)}assert(player.bank>.1&&player.bank<.35,'slow bank '+player.bank);
assert(!/fillRect\\(boss\\.x,boss\\.y,boss\\.w,boss\\.h\\)/.test(draw.toString()));
player.y=ty+5;running=true;saveRun();const d=JSON.parse(localStorage.getItem(SAVE_KEY));assert.equal(d.playerY,ty+5);
delete d.playerY;applyRun(d);assert.equal(player.y,homeY());
startBoss();boss.hit=11;phase="boss";for(let i=0;i<3;i++){draw();boss.hit-=4}
assert(!/rotate/.test(drawBanked.toString()),'roll must never rotate the heading');
boss=null;phase='fly';bullets=[];enemies=[];spawnEnemy('zigzag',100,200);spawnEnemy('weaver',200,300);
let rot=0;const rawRotate=ctx.rotate;ctx.rotate=function(...a){rot++;return rawRotate.apply(this,a)};
let sc=[];const rawScale=ctx.scale;
player.bank=1;enemies[0].bk=-.8;enemies[0].lx=enemies[0].x-3;draw();player.bank=-.4;draw();
assert.equal(rot,0,'no yaw rotation for player or enemies');ctx.rotate=rawRotate;
resize();assert(player.y>=topY()&&player.y<=homeY());
`);
console.log('PASS v4.0 roll-only banking (zero rotation), vertical climb/ease-home, slow vs fast banking, outline boss hit glow, playerY save/legacy/resize');
