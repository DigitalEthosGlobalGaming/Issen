import { build, preview } from 'vite';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { performancePlugin } from '../build-plugin.mjs';
import { options } from '../config.mjs';
import { openTarget } from '../targets.mjs';
import { measure } from '../collect.mjs';

const root=fileURLToPath(new URL('../../../',import.meta.url));
process.chdir(root);
const git=(...args)=>execFileSync('git',['-c',`safe.directory=${root.replaceAll('\\','/').replace(/\/$/,'')}`,...args],{encoding:'utf8',windowsHide:true}).trim();
const out=path.resolve('tmp/performance',new Date().toISOString().replaceAll(':','-')+'-drift');
await mkdir(out,{recursive:true});
const config=options(['--scenario=title,combat','--mode=timing']);
const hash=createHash('sha256');
for(const file of git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean).sort())hash.update(file+'\0').update(await readFile(file));
config.buildId=hash.digest('hex');
const variants=[{id:'original',mode:'original',equal:false},{id:'shape',mode:'shape',equal:false},{id:'sprites-equal',mode:'sprites',equal:true},{id:'sprites-shipped',mode:'sprites',equal:false}];
const results={status:'running',manifest:{revision:git('rev-parse','HEAD'),dirty:git('status','--porcelain'),fingerprint:config.buildId,viewport:config.viewport,dpr:config.dpr,seed:config.seed,warmup:config.warmup,duration:config.duration,repeats:config.repeats,notes:'Same production instrumented build, offline fonts, High quality. Equal overrides sprite density only; original and shape already use full count. Interleaved mode order. Leaf timers include ambient wrapper and both depth passes; native asynchronous GPU time is not isolated.'},samples:[],diagnostics:[],errors:[]};
const save=()=>writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
const extra={name:'drift-comparison-only',enforce:'pre',transform(source,id){
 if(!id.replaceAll('\\','/').endsWith('/src/game.ts'))return;
 let text=source.replaceAll('\r\n','\n');
 const once=(a,b)=>{if(text.split(a).length!==2)throw Error('Drift benchmark anchor changed: '+a);text=text.replace(a,b);};
 once('const driftRenderer = createDriftRenderer();',`const driftRenderer = createDriftRenderer();
 const driftQuery=new URLSearchParams(location.search);
 const driftBenchmarkMode=driftQuery.get('drift') as 'original'|'shape'|'sprites';
 const driftEqual=driftQuery.get('equal')==='1';
 window.__driftTiming={total:0,calls:0,particles:0};
 const resetDriftProbe=window.__probe.reset;
 window.__probe.reset=()=>{resetDriftProbe();window.__driftTiming={total:0,calls:0,particles:0};};`);
 text=text.replaceAll('driftRenderer.mode = settings.debrisStyle;','driftRenderer.mode = driftBenchmarkMode;');
 once("density: density() * (driftRenderer.mode === 'sprites' ? (DRIFT_DENSITY[stage] ?? 1) : 1),","density: density() * (!driftEqual && driftRenderer.mode === 'sprites' ? (DRIFT_DENSITY[stage] ?? 1) : 1),");
 once('ambient().drawLeaves(g, leaves, front);',`const leafStart=performance.now();
 ambient().drawLeaves(g, leaves, front);
 if(window.__probe.measure){window.__driftTiming.total+=performance.now()-leafStart;window.__driftTiming.calls++;window.__driftTiming.particles=leaves.length;}`);
 return {code:text,map:null};
}};
let server,target;
console.log('Output: '+out);
try{
 execFileSync(process.execPath,['node_modules/typescript/bin/tsc','--noEmit'],{stdio:'inherit',windowsHide:true});
 await build({root,logLevel:'warn',mode:'android',plugins:[extra,performancePlugin(config.buildId)],define:{'import.meta.env.VITE_GAME_EDITION':'"free"','import.meta.env.VITE_PREMIUM_ENABLED':'"false"','import.meta.env.VITE_REVENUECAT_ANDROID_KEY':'""'},build:{outDir:path.join(out,'build'),emptyOutDir:false,sourcemap:true,reportCompressedSize:false}});
 server=await preview({root,configFile:false,build:{outDir:path.join(out,'build')},preview:{host:'127.0.0.1',port:5298,strictPort:true}});
 target=await openTarget(config);
 results.manifest.browser=target.version;results.manifest.graphics=target.graphics;
 async function sample(variant,scenario,repetition,diagnostic=false){
  let timing;
  const wrapped={...target,async sample(){
   const handle=await target.sample();const go=handle.page.goto.bind(handle.page);
   handle.page.goto=(url,opts)=>{const next=new URL(url);next.searchParams.set('drift',variant.mode);next.searchParams.set('equal',variant.equal?'1':'0');return go(next.href,opts);};
   return {...handle,close:async()=>{try{timing=await handle.page.evaluate(()=>window.__driftTiming);}finally{await handle.close();}}};
  }};
  const folder=path.join(out,variant.id);
  for(const dir of ['profiles','traces','screenshots'])await mkdir(path.join(folder,dir),{recursive:true});
  const row=await measure(wrapped,'http://127.0.0.1:5298/',config,scenario,repetition,folder,diagnostic);
  return {...row,variant:variant.id,leafTiming:timing};
 }
 for(const scenario of config.scenarios){
  for(let repetition=0;repetition<config.repeats;repetition++){
   for(let offset=0;offset<variants.length;offset++){
    const variant=variants[(repetition+offset)%variants.length];
    console.log(`${scenario} ${variant.id} ${repetition+1}/${config.repeats}`);
    results.samples.push(await sample(variant,scenario,repetition));await save();
   }
  }
 }
 for(const variant of variants){console.log('Allocation diagnostic '+variant.id);results.diagnostics.push(await sample(variant,'combat',0,true));await save();}
 results.status='passed';
}catch(error){results.status='failed';results.errors.push(error.stack||String(error));process.exitCode=1;console.error(error);}
finally{await target?.close();if(server)await new Promise(resolve=>server.httpServer.close(resolve));await save();console.log(`${results.status}: ${out}`);}
