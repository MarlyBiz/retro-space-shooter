const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.env.GAME_HTML||'index.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(script);new vm.Script(fs.readFileSync('sw.js','utf8'));
const harness=require('./harness.cjs');

// Harness has no AudioContext — AudioSys must not throw on unlock/play/music.
{
 const {run}=harness(script);
 run(`
  assert.equal(typeof AudioSys,'object');
  assert.equal(AudioSys.ensure(),false);
  assert.equal(AudioSys.unlock(),false);
  AudioSys.setOpts({sfxOn:true,sfxVol:.5,musicOn:true,musicVol:.3});
  AudioSys.play('shot','single');
  AudioSys.play('explode');
  AudioSys.play('bomb');
  AudioSys.setMusic('fly');
  AudioSys.setMusic('boss');
  AudioSys.setMusic('menu');
  AudioSys.onPause();AudioSys.onResume();AudioSys.onHide();AudioSys.onShow();
  AudioSys.toggleMute();AudioSys.setMuteTemp(false);AudioSys.stopMusic();
  const g=AudioSys.getOpts();
  assert.equal(g.sfxOn,true);assert.equal(g.musicOn,true);
  assert.equal(g.sfxVol,.5);assert.equal(g.musicVol,.3);
 `);
 console.log('PASS AudioSys no-AudioContext safety + opts');
}

// Options persistence: sfx/music on/off + volumes round-trip and Reset Defaults.
{
 const {run}=harness(script);
 run(`
  assert.equal(options.sfxOn,true);assert.equal(options.musicOn,true);
  assert.equal(options.sfxVol,.7);assert.equal(options.musicVol,.45);
  openOptions();
  $('sfxOn').value='0';$('musicOn').value='0';$('sfxVol').value='20';$('musicVol').value='10';
  applyOptions();
  const saved=JSON.parse(localStorage.getItem(OPTIONS_KEY));
  assert.equal(saved.sfxOn,false);assert.equal(saved.musicOn,false);
  assert.equal(saved.sfxVol,.2);assert.equal(saved.musicVol,.1);
  assert.equal(options.sfxOn,false);assert.equal(options.musicOn,false);
  $('resetOptions').onclick();
  assert.equal(options.sfxOn,true);assert.equal(options.musicOn,true);
  assert.equal(options.sfxVol,.7);assert.equal(options.musicVol,.45);
  assert.equal(JSON.parse(localStorage.getItem(OPTIONS_KEY)).sfxOn,true);
 `);
 console.log('PASS audio options persist + reset defaults');
}

// cleanOptions guards invalid audio fields; pause mute control exists.
{
 assert(html.includes('id="pauseMute"')&&html.includes('id="sfxOn"')&&html.includes('id="musicVol"'));
 const {run}=harness(script);
 run(`
  for(const bad of [null,{sfxOn:'nope',musicOn:2},{sfxVol:NaN,musicVol:undefined}]){
   const c=cleanOptions(bad);
   assert.equal(c.sfxOn,true);assert.equal(c.musicOn,true);
   assert.equal(c.sfxVol,.7);assert.equal(c.musicVol,.45);
  }
  // Out-of-range volumes clamp to 0..1
  const cClamp=cleanOptions({sfxVol:9,musicVol:-3});
  assert.equal(cClamp.sfxVol,1);assert.equal(cClamp.musicVol,0);
  const c2=cleanOptions({sfxOn:false,musicOn:0,sfxVol:0,musicVol:1});
  assert.equal(c2.sfxOn,false);assert.equal(c2.musicOn,false);
  assert.equal(c2.sfxVol,0);assert.equal(c2.musicVol,1);
 `);
}
assert(html.includes('sw.js?v=4.5.0')&&html.includes("k!=='rss-v4.5.0'"));
assert(fs.readFileSync('sw.js','utf8').includes("V='rss-v4.5.0'"));
assert(html.includes('AudioSys')&&html.includes("play('shot'"));
console.log('PASS audio UI + cleanOptions + v4.5.0 versions');
