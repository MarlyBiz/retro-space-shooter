// Real CPU Canvas, minimal explicit DOM. No Proxy/no-op Canvas API fallback:
// a missing drawing method or invalid argument throws instead of hiding faults.
const vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
module.exports=function(script){
 let seed=27;const math=Object.create(Math);math.random=()=>((seed=(1664525*seed+1013904223)>>>0)/2**32);
 const listeners={};const elements=new Map();
 function element(){return {style:{},classList:{toggle(){},remove(){}},addEventListener(){},hidden:false}}
 function canvasElement(){const c=createCanvas(390,844);c.style={};c.addEventListener=()=>{};return c}
 const storage={getItem(k){return this[k]||null},setItem(k,v){this[k]=v},removeItem(k){delete this[k]}};
 const sandbox={console,Math:math,localStorage:storage,sessionStorage:{},navigator:{},location:{protocol:'http:',hostname:'test'},performance:{now:()=>0},requestAnimationFrame(){},addEventListener(n,f){listeners[n]=f},window:{innerWidth:390,innerHeight:844,devicePixelRatio:2},document:{visibilityState:'visible',getElementById(id){if(!elements.has(id))elements.set(id,id==='game'?canvasElement():element());return elements.get(id)},createElement(tag){assert.equal(tag,'canvas');return canvasElement()},querySelectorAll:()=>[],addEventListener(n,f){listeners[n]=f}},assert};
 vm.createContext(sandbox);vm.runInContext(script,sandbox);
 return {sandbox,listeners,run:s=>vm.runInContext(s,sandbox)};
};
