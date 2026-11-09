// v4.1: chapter + ship unlocks, picker persistence, WARPDRIVE level select, ship stats, saves, migration.
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const harness=require('./harness.cjs');
// fresh player: chapter 1 + Interceptor only
{const {run}=harness(script);run(`
assert.equal(progress.beaten,0);assert.equal(chaptersOpen(),1);assert.equal(progress.ship,'interceptor');
assert(!pickChapter(2));assert(!pickShip('guardian'));assert(!pickStartLevel(30));
resetGame();assert.equal(level,1);assert.equal(lives,3);assert.equal(MAX_LEVEL,10);
// ship stats
const st=k=>SHIPS[k];
assert.equal(st('guardian').lives,4);assert(st('guardian').speed<1&&st('gangster').speed>1&&st('gangster').dmg===1.25&&st('phoenix').wep===1.4);
for(const k of SHIP_KEYS){const s=st(k);assert(s.speed>=.85&&s.speed<=1.15&&s.dmg<=1.25&&s.wep<=1.4&&s.lives<=4&&s.cap>=4&&s.drain>=.8)}
// wrong code, right code (case-insensitive), off
assert.equal(applyCheat('warp'),false);$('cheatInput').value='nope';$('applyCheat').onclick();assert.equal($('cheatMsg').textContent,'Invalid code');assert(!progress.cheat);
$('cheatInput').value=' warpDrive ';$('applyCheat').onclick();assert(progress.cheat);assert.equal($('levelPickWrap').hidden,false);
assert(JSON.parse(localStorage.getItem(PROGRESS_KEY)).cheat);
assert(pickStartLevel(35));resetGame();assert.equal(level,35);assert.equal(MAX_LEVEL,40);assert.equal(bossKey(level),'eclipse');assert(unlocked.has('wraith')&&!unlocked.has('phantom'));
assert(!shipUnlocked('guardian'),'cheat never unlocks ships');
// cheat mid-chapter run: boss still on 36/38 and destroyed on 40 -> grants unlocks (beaten jumps to 4)
running=true;paused=false;saveRun();const sv=JSON.parse(localStorage.getItem(SAVE_KEY));assert.equal(sv.runStart,35);
resetGame();assert(applyRun(sv));assert.equal(level,35);assert.equal(MAX_LEVEL,40);
level=40;phase='boss';startBoss();assert.equal(boss.k,'eclipse');boss.hp=1;invuln=9999;bullets=[{x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#fff',d:1}];
update(1);assert.equal(phase,'breakup');assert.equal(progress.beaten,4);assert.equal(pendingUnlock.ship,'vanguard');assert.equal(pendingUnlock.chapter,5);
while(running){update(3)}assert.equal(phase,'win');assert(/VANGUARD/.test($('wUnlock').innerHTML));assert(/ECLIPSE DESTROYED/.test($('wSub').textContent));
assert(shipUnlocked('vanguard')&&shipUnlocked('guardian'));assert.equal(chaptersOpen(),5);
$('cheatOff').onclick();assert(!progress.cheat);assert(pickStartLevel(12));assert(!pickStartLevel(45));
assert(pickChapter(3));resetGame();assert.equal(level,21);assert.equal(lives,3);assert.equal(power,100);assert(MAX_LEVEL>=30);
// ship choice persists and applies stats + saved in Continue
assert(pickShip('gangster'));resetGame();assert.equal(runShip,'gangster');assert.equal(player.speed,7*1.12);
running=true;bullets=[];fireCd=0;shoot(1);assert.equal(bullets[0].d,1.25);
saveRun();const s2=JSON.parse(localStorage.getItem(SAVE_KEY));assert.equal(s2.ship,'gangster');
pickShip('interceptor');resetGame();assert(applyRun(s2));assert.equal(runShip,'gangster');assert.equal(heroImg,shipImgs.gangster);
pickShip('phoenix');resetGame();runOptions.duration='1';acquireWeapon('laser');assert.equal(wepT,1260);
pickShip('guardian');resetGame();assert.equal(lives,4);powerups=[{k:'life',x:player.x+7,y:player.y+12,w:26,h:26,age:0}];lives=6;updatePowerups(0);assert.equal(lives,6);
// intermediate boss kill pauses with the unlock card, then continues
progress.beaten=0;progress.cheat=false;progress.startCh=1;progress.ship='interceptor';saveProgress();
options=cleanOptions({...options,campaign:'20'});resetGame();running=true;paused=false;level=10;phase='boss';startBoss();boss.hp=1;invuln=9999;
bullets=[{x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#fff',d:1}];update(1);
for(let i=0;i<200&&phase!=='fly';i++)update(3);
assert.equal(level,11);assert(paused);assert($('unlockUI').classList.contains('show'));assert(/GUARDIAN/.test($('unlockBody').innerHTML));
$('unlockGo').onclick();assert(!paused);assert.equal(progress.beaten,1);assert.equal(chaptersOpen(),2);
// re-beating an earlier boss grants nothing new
assert.equal(recordBossKill(10),null);
`);}
// old saves (no ship/runStart/campaign) still load as Interceptor 10-level runs
{const old={active:1,v:6,score:5,lives:2,dist:100,level:4,levelDist:10,mult:1.3,power:80,weapon:'single',options:{duration:'1',pickups:'normal'},phase:'fly',enemies:[],bullets:[],eb:[],powerups:[],stars:[]};
 const {run}=harness(script,{rssRun:JSON.stringify(old)});run(`
 assert.equal(progress.beaten,0);const d=loadRun();assert(applyRun(d));assert.equal(runShip,'interceptor');assert.equal(MAX_LEVEL,10);assert.equal(level,4);assert.equal(runStart,1);`);}
// existing players credited from best distance / saved level
{const {run}=harness(script,{rssBestDist:'45000'});run(`assert.equal(progress.beaten,1);assert(shipUnlocked('guardian'));assert.equal(chaptersOpen(),2)`);}
{const {run}=harness(script,{rssRun:JSON.stringify({active:1,v:6,level:27})});run(`assert.equal(progress.beaten,2);assert(shipUnlocked('gangster'))`);}
{const {run}=harness(script,{rssBestDist:'30000'});run(`assert.equal(progress.beaten,0)`);}
// v4.3.0: chapter tap works with WARPDRIVE on; Start shows level
{const {run}=harness(script,{rssBestDist:'45000'});run(`assert(applyCheat('WARPDRIVE'));assert(pickStartLevel(11));resetGame();assert.equal(level,11);assert(pickChapter(1));assert.equal(progress.startLevel,1);resetGame();assert.equal(level,1);assert.equal($('start').textContent,'START · LEVEL 1');cheatOff();assert(pickChapter(2));resetGame();assert.equal(level,11);assert(pickChapter(1));resetGame();assert.equal(level,1)`);}
// v4.3.0: any reached level selectable without cheat; dropdown sync on start
{const {run}=harness(script,{rssBestDist:'45000'});run(`assert.equal(progress.maxLevel,11);assert(pickStartLevel(8));resetGame();assert.equal(level,8);assert.equal($('start').textContent,'START · LEVEL 8');assert(!pickStartLevel(12));progress.startLevel=1;$('levelPick').value='9';startGame();assert.equal(level,9)`);}
// v4.3.0: stacking cheats WARPDRIVE + IRONCLAD
{const {run}=harness(script);run(`$('cheatInput').value='warpdrive';$('applyCheat').onclick();$('cheatInput').value='ironclad';$('applyCheat').onclick();assert(progress.cheat&&progress.god);assert(/WARPDRIVE/.test($('cheatMsg').textContent)&&/IRONCLAD/.test($('cheatMsg').textContent));assert(pickStartLevel(40));resetGame();assert.equal(level,40);const L=lives;loseLife('x');assert.equal(lives,L);assert(running||true);$('cheatOff').onclick();assert(!progress.cheat&&!progress.god);resetGame();const L2=lives;loseLife('x');assert.equal(lives,L2-1)`);}
// v4.3.0: HANGAR unlocks all ships; off reverts
{const {run}=harness(script);run(`assert(!shipUnlocked('vanguard'));assert.equal(applyCheat('hangar'),'HANGAR');for(const k of SHIP_KEYS)assert(shipUnlocked(k));assert(pickShip('vanguard'));resetGame();assert.equal(runShip,'vanguard');cheatOff();assert(!shipUnlocked('vanguard'));assert.equal(progress.ship,'interceptor')`);}
// v4.3.0: stored bombs (max 3) + button; Fly this ship
{const {run}=harness(script);run(`resetGame();running=true;paused=false;assert.equal(bombs,0);
for(let n=0;n<4;n++){powerups=[{k:'bomb',x:player.x,y:player.y,w:26,h:26,age:0}];update(1)}
assert.equal(bombs,3);enemies=[{k:'dart',t:ET.dart,x:50,y:50,w:20,h:20,hp:1,age:0,vx:0}];assert(useBomb());assert.equal(bombs,2);assert(enemies[0].dead);
saveRun();const sv=JSON.parse(localStorage.getItem(SAVE_KEY));assert.equal(sv.bombs,2);resetGame();assert.equal(bombs,0);assert(applyRun(sv));assert.equal(bombs,2);
assert(/FLY THIS SHIP/.test(unlockHTML({ship:'guardian',chapter:2})));assert(!flyShip('guardian'));progress.beaten=1;running=true;assert(flyShip('guardian'));assert.equal(progress.ship,'guardian');assert.equal(runShip,'guardian')`);}
console.log('PASS v4.1 chapter/ship unlocks, pickers, WARPDRIVE (case-insensitive, invalid msg, off, cheat-run unlocks), ship perks, Continue keeps ship/start, unlock card, old saves, existing-player migration');
