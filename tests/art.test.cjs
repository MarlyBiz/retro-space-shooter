// Real WebP decoding + real native Canvas rendering, no browser/GUI automation.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {Image}=require('@napi-rs/canvas');
const html=fs.readFileSync(process.env.GAME_HTML||'index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const {sandbox,run}=require('./harness.cjs')(script);
const proof=process.env.PROOF_DIR||'/workspace/shooter-art-review';fs.mkdirSync(proof,{recursive:true});
sandbox.snapshot=name=>fs.writeFileSync(proof+'/'+name+'.png',run("canvas.toBuffer('image/png')"));
(async()=>{
 run("resetGame();running=true;draw();assert.equal(artStatus.ready,false)");
 sandbox.window.Image=Image;
 assert.equal(await run("loadCinematicArt('/does-not-exist.webp')"),false);
 run("assert(artStatus.error);draw()");
 assert.equal(await run("loadCinematicArt()"),true);
 run(`
 assert(artStatus.ready);assert(!artStatus.error);
 const sizes={diver:[30,30],weaver:[34,26],zigzag:[36,32],dart:[18,36],swooper:[36,28],tank:[48,40],gunship:[180,72]};
 for(const [k,[w,h]] of Object.entries(sizes)){
  assert.equal(ET[k].w,w);assert.equal(ET[k].h,h);
  assert.equal(ET[k].img.width,ART_RECTS[k][2]);assert.equal(ET[k].img.height,ART_RECTS[k][3]);
  const pixels=ET[k].img.getContext('2d').getImageData(0,0,ET[k].img.width,ET[k].img.height).data;
  let transparent=0,opaque=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]===0)transparent++;if(pixels[i]>200)opaque++}
  assert(transparent>pixels.length/4*.08,'opaque background rectangle '+k);assert(opaque>pixels.length/4*.15,'missing hull '+k);
 }
 assert.equal(player.w,40);assert.equal(player.h,48);assert.equal(heroImg.width,320);assert.equal(heroImg.height,384);
 assert.equal(cinematicBase.width,1280);assert.equal(cinematicBase.height,256);
 for(const [width,height] of [[240,640],[390,844],[844,390]]){
  window.innerWidth=width;window.innerHeight=height;resize();resetGame();running=true;invuln=0;initStars();
  for(let i=0;i<UNLOCK_ORDER.length;i++){
   const k=UNLOCK_ORDER[i];spawnEnemy(k,15+(i%3)*(W-70)/2,70+Math.floor(i/3)*100);
   const e=enemies.at(-1);assert(e.x>=0&&e.x+e.w<=W);
   const cx=e.x+e.w/2;assert(cx>=20&&cx<=W-20);
  }
  draw();snapshot('gameplay-'+width+'x'+height+'-v3');
  level=10;phase='boss';startBoss();invuln=9999;fireCd=9999;
  for(let i=0;i<40;i++){bullets=[];update(1);draw()}
  assert(boss.x>=0&&boss.x+boss.w<=W);snapshot('boss-'+width+'x'+height+'-v3');
  boss.hp=1;bullets=[0,1].map(()=>({x:boss.x+boss.w/2,y:boss.y+boss.h/2,vx:0,vy:0,w:4,h:12,c:'#fff',d:1}));
  update(1);draw();assert.equal(phase,'breakup');
  for(let i=0;i<35;i++){update(1);draw()}snapshot('breakup-'+width+'x'+height+'-v3');
  while(phase==='breakup'){update(3);draw()}
  for(let i=0;i<70;i++){update(1);draw()}assert.equal(phase,'escape');snapshot('nebula-'+width+'x'+height+'-v3');
  while(running){update(3);draw()}assert.equal(phase,'win');
 }
 `);
 assert(fs.statSync('assets/sprites-v3.webp').size<500*1024,'mobile asset budget exceeded');
 console.log('PASS actual WebP/native Canvas loading, transparent hulls, all 6 enemies/boss/player/base, original geometry/reachable bounds, 3 mobile/orientation sizes, matching breakup and redesigned ship flyoff; <500 KiB atlas');
 await testWorker();
})().catch(e=>{console.error(e);process.exitCode=1});
async function testWorker(){
 const listeners={},maps=new Map(),origin='https://example.test',root=origin+'/retro-space-shooter/';let offline=false,claimed=false,skip=false;
 const url=x=>new URL(typeof x==='string'?x:x.url,root).href;
 const fakeFetch=async(input,init)=>{if(offline)throw Error('offline');return new Response(url(input).includes('sprites-v3.webp')?'ART':'LIVE SHELL',{status:200})};
 const caches={async keys(){return [...maps.keys()]},async delete(k){return maps.delete(k)},async open(k){if(!maps.has(k))maps.set(k,new Map());const m=maps.get(k);return {async add(p){const r=await fakeFetch(p);m.set(url(p),r)},async match(p){const r=m.get(url(p));return r&&r.clone()},async put(p,r){m.set(url(p),r)}}},async match(p){for(const m of maps.values()){const r=m.get(url(p));if(r)return r.clone()}}};
 maps.set('rss-v3.0',new Map());
 const self={location:{origin},clients:{async claim(){claimed=true}},async skipWaiting(){skip=true},addEventListener(k,f){listeners[k]=f}};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{self,caches,fetch:fakeFetch,URL,Promise});
 let wait;listeners.install({waitUntil(p){wait=p}});await wait;assert(skip);
 listeners.activate({waitUntil(p){wait=p}});await wait;assert(claimed);assert(!maps.has('rss-v3.0'));assert(maps.has('rss-v3.1.1'));
 async function get(path){let response;listeners.fetch({request:{method:'GET',url:root+path},respondWith(p){response=p}});return response}
 offline=true;assert.equal(await (await get('assets/sprites-v3.webp')).text(),'ART');
 offline=false;assert.equal(await (await get('index.html')).text(),'LIVE SHELL');offline=true;
 assert.equal(await (await get('index.html')).text(),'LIVE SHELL');
 console.log('PASS SW versioned-art precache, activation preservation, offline art and network-first shell fallback');
}
