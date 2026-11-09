// Real WebP decoding + real native Canvas rendering, no browser/GUI automation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {Image}=require('@napi-rs/canvas');
const html=fs.readFileSync(process.env.GAME_HTML||'index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const {sandbox,run}=require('./harness.cjs')(script);
const proof=process.env.PROOF_DIR||'/workspace/shooter-art-review';fs.mkdirSync(proof,{recursive:true});
sandbox.require_fs=fs;sandbox.proof_dir=proof;sandbox.snapshot=name=>fs.writeFileSync(proof+'/'+name+'.png',run("canvas.toBuffer('image/png')"));
(async()=>{
 run("resetGame();running=true;draw();assert.equal(artStatus.ready,false)");
 sandbox.window.Image=Image;
 assert.equal(await run("loadCinematicArt('/does-not-exist.webp')"),false);
 run("assert(artStatus.error);draw()");
 assert.equal(await run("loadCinematicArt()"),true);
 assert.equal(await run("loadShipArt()"),true);
 run(`for(const k of ['guardian','gangster','phoenix','vanguard'])assert.equal(shipImgs[k].width,320);
 {const c=document.createElement('canvas');c.width=1250;c.height=420;const g=c.getContext('2d');g.fillStyle='#02050b';g.fillRect(0,0,1250,420);
  SHIP_KEYS.forEach((k,i)=>{const x=i*250,im=shipImgs[k];g.strokeStyle='#28394c';g.strokeRect(x+5,5,240,410);g.drawImage(im,x+45,15,160,192);
   g.fillStyle=SHIPS[k].color;g.font='bold 18px sans-serif';g.fillText(SHIPS[k].name,x+15,230);g.fillStyle='#9c9';g.font='11px sans-serif';
   const words=SHIPS[k].perk.split(' ');let line='',y=250;for(const w of words){if((line+w).length>36){g.fillText(line,x+15,y);y+=14;line=''}line+=w+' '}g.fillText(line,x+15,y);
   g.fillStyle='#7892ad';g.fillText(SHIPS[k].unlock?'Unlock: defeat '+ET[BOSS_ORDER[SHIPS[k].unlock-1]].name:'Default ship',x+15,330);
   g.drawImage(im,x+30,350,40,48);
   g.fillStyle='#7892ad';g.fillText('phone scale',x+150,380)});
  require_fs.writeFileSync(proof_dir+'/ships-v412.png',c.toBuffer('image/png'))}`);
 run(`
 assert(artStatus.ready);assert(!artStatus.error);
 const sizes={diver:[30,30],weaver:[34,26],zigzag:[36,32],dart:[18,36],swooper:[36,28],tank:[48,40],gunship:[180,90],ram:[24,36],mortar:[42,34],drone:[26,26],spinner:[34,33],wraith:[46,22],phantom:[32,35],lancer:[34,34],bulwark:[44,44],dreadnought:[180,159],hive:[180,137],eclipse:[180,151],warlord:[180,159]};
 for(const [k,[w,h]] of Object.entries(sizes)){
  assert.equal(ET[k].w,w);assert.equal(ET[k].h,h);
  assert.equal(ET[k].img.width,ART_RECTS[k][2]);assert.equal(ET[k].img.height,ART_RECTS[k][3]);
  const pixels=ET[k].img.getContext('2d').getImageData(0,0,ET[k].img.width,ET[k].img.height).data;
  let transparent=0,opaque=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)transparent++;if(pixels[i]>200)opaque++}
  assert(transparent>pixels.length/4*.08,'opaque background rectangle '+k);assert(opaque>pixels.length/4*.15,'missing hull '+k);
 }
 // v4 contact sheet of the new art, rendered from the live game sprites (large + phone scale).
 {const keys=['gunship','dreadnought','hive','eclipse','warlord','ram','mortar','drone','spinner','wraith','phantom','lancer','bulwark'];
  const c=document.createElement('canvas');c.width=1300;c.height=900;const g=c.getContext('2d');g.fillStyle='#02050b';g.fillRect(0,0,1300,900);g.font='bold 18px sans-serif';
  keys.forEach((k,i)=>{const x=(i<5?i*260:((i-5)%4)*325),y=i<5?0:300+Math.floor((i-5)/4)*300,cw=i<5?260:325;const im=ET[k].img,sc=Math.min((cw-30)/im.width,200/im.height);
   g.strokeStyle='#28394c';g.strokeRect(x+5,y+5,cw-10,290);g.drawImage(im,x+(cw-im.width*sc)/2,y+15,im.width*sc,im.height*sc);
   g.fillStyle=ET[k].color;g.fillText(ET[k].name,x+15,y+250);g.fillStyle='#7892ad';g.font='13px sans-serif';g.fillText(ET[k].boss?'boss · levels '+(BOSS_ORDER.indexOf(k)*10+1)+'-'+(BOSS_ORDER.indexOf(k)*10+10):'unlock L'+ET[k].at,x+15,y+275);g.font='bold 18px sans-serif';
   const pw=ET[k].boss?bossSize(k).w*.6:ET[k].w,ph=ET[k].boss?bossSize(k).h*.6:ET[k].h;g.drawImage(im,x+cw-pw-15,y+285-ph,pw,ph)});
  require_fs.writeFileSync(proof_dir+'/contact-sheet-v4.png',c.toBuffer('image/png'))}
 assert.equal(player.w,40);assert.equal(player.h,48);assert.equal(heroImg.width,320);assert.equal(heroImg.height,384);
 assert.equal(cinematicBase.width,1280);assert.equal(cinematicBase.height,256);
 for(const [width,height] of [[240,640],[390,844],[844,390]]){
  window.innerWidth=width;window.innerHeight=height;resize();resetGame();running=true;invuln=0;initStars();
  for(let i=0;i<UNLOCK_ORDER.length;i++){
   const k=UNLOCK_ORDER[i];spawnEnemy(k,15+(i%3)*(W-70)/2,70+Math.floor(i/3)*100);
   const e=enemies.at(-1);assert(e.x>=0&&e.x+e.w<=W);
   const cx=e.x+e.w/2;assert(cx>=20&&cx<=W-20);
  }
  draw();snapshot('gameplay-'+width+'x'+height+'-v4');
  level=10;phase='boss';startBoss();invuln=9999;fireCd=9999;
  for(let i=0;i<40;i++){bullets=[];update(1);draw()}
  assert(boss.x>=0&&boss.x+boss.w<=W);snapshot('boss-'+width+'x'+height+'-v4');
  boss.hp=1;bullets=[0,1].map(()=>({x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#fff',d:1}));
  update(1);draw();assert.equal(phase,'breakup');
  for(let i=0;i<35;i++){update(1);draw()}snapshot('breakup-'+width+'x'+height+'-v4');
  while(phase==='breakup'){update(3);draw()}
  for(let i=0;i<70;i++){update(1);draw()}assert.equal(phase,'escape');snapshot('nebula-'+width+'x'+height+'-v4');
  while(running){update(3);draw()}assert.equal(phase,'win');
 }
 `);
 assert(fs.statSync('assets/sprites-v4.webp').size<800*1024,'mobile asset budget exceeded');
 console.log('PASS actual WebP/native Canvas loading, transparent hulls, all 14 enemies/5 bosses/player/base, original geometry/reachable bounds, 3 mobile/orientation sizes, matching breakup and redesigned ship flyoff; <800 KiB atlas');
 await testWorker();
})().catch(e=>{console.error(e);process.exitCode=1});
async function testWorker(){
 const listeners={},maps=new Map(),origin='https://example.test',root=origin+'/retro-space-shooter/';let offline=false,claimed=false,skip=false;
 const url=x=>new URL(typeof x==='string'?x:x.url,root).href;
 const fakeFetch=async(input,init)=>{if(offline)throw Error('offline');return new Response(url(input).includes('sprites-v4.webp')?'ART':'LIVE SHELL',{status:200})};
 const caches={async keys(){return [...maps.keys()]},async delete(k){return maps.delete(k)},async open(k){if(!maps.has(k))maps.set(k,new Map());const m=maps.get(k);return {async addAll(ps){for(const p of ps)await this.add(p)},async add(p){const r=await fakeFetch(p);m.set(url(p),r)},async match(p){const r=m.get(url(p));return r&&r.clone()},async put(p,r){m.set(url(p),r)}}},async match(p){for(const m of maps.values()){const r=m.get(url(p));if(r)return r.clone()}}};
 maps.set('rss-v3.0',new Map());
 const self={location:{origin},clients:{async claim(){claimed=true}},async skipWaiting(){skip=true},addEventListener(k,f){listeners[k]=f}};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{self,caches,fetch:fakeFetch,URL,Promise});
 let wait;listeners.install({waitUntil(p){wait=p}});await wait;assert(skip);
 listeners.activate({waitUntil(p){wait=p}});await wait;assert(claimed);assert(!maps.has('rss-v3.0'));assert(maps.has('rss-v4.1.7'));
 async function get(path){let response;listeners.fetch({request:{method:'GET',url:root+path},respondWith(p){response=p}});return response}
 offline=true;assert.equal(await (await get('assets/sprites-v4.webp')).text(),'ART');
 offline=false;assert.equal(await (await get('index.html')).text(),'LIVE SHELL');offline=true;
 assert.equal(await (await get('index.html')).text(),'LIVE SHELL');
 console.log('PASS SW versioned-art precache, activation preservation, offline art and network-first shell fallback');
}
