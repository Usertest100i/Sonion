import http from 'node:http';
import {readFile, writeFile, mkdir, rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join, dirname} from 'node:path';
import {randomUUID} from 'node:crypto';
import {validateReport, validateUpdate, ranked, seed, teams, categories} from './domain.js';
const root = dirname(dirname(fileURLToPath(import.meta.url)));
export async function createApp({dataDir=join(root,'data')}={}) {
  await mkdir(dataDir,{recursive:true});
  const db=join(dataDir,'reports.json');
  let reports;
  try {
    reports=JSON.parse(await readFile(db,'utf8'));
    if (!Array.isArray(reports) || reports.length>1000) throw new Error('Invalid database.');
    const ids=new Set();
    for (const report of reports) {
      validateReport(report); validateUpdate(report);
      if (typeof report.id!=='string' || !report.id || ids.has(report.id) || typeof report.createdAt!=='string' || !Number.isFinite(Date.parse(report.createdAt)) || !Array.isArray(report.history) || report.history.some(h=>!h || typeof h.action!=='string' || typeof h.at!=='string' || !Number.isFinite(Date.parse(h.at)))) throw new Error('Invalid saved report. Restore a known-good backup.');
      ids.add(report.id);
    }
  }
  catch(e) { if(e.code!=='ENOENT') throw e; reports=seed(); }
  let queue=Promise.resolve();
  const persist=async next=> { await writeFile(`${db}.tmp`,JSON.stringify(next,null,2)); await rename(`${db}.tmp`,db); reports=next; };
  const mutate=fn=>{const job=queue.then(fn);queue=job.catch(()=>{});return job;};
  const headers={'Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'};
  const server=http.createServer(async(req,res)=>{
    const send=(status,data,type='application/json')=>{res.writeHead(status,{...headers,'Content-Type':type});res.end(type==='application/json'?JSON.stringify(data):data);};
    try {
      const url=new URL(req.url,'http://localhost');
      // Reject unexpected hostnames to limit DNS-rebinding access to this local demo.
      const hostname=new URL(`http://${req.headers.host}`).hostname;
      if (!['localhost','127.0.0.1','[::1]'].includes(hostname)) return send(403,{error:'This demo accepts localhost requests only.'});
      if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return send(403,{error:'Cross-origin writes are blocked.'});
      const body=async()=>{let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>16384){const error=new Error('Report is too large.');error.status=413;throw error;}}try{return JSON.parse(text);}catch{throw new Error('Invalid JSON.');}};
      if(req.method==='GET' && url.pathname==='/api/reports') return send(200,{reports:ranked(reports),teams,categories});
      if(req.method==='POST' && url.pathname==='/api/reports') {
        const value=validateReport(await body());
        return await mutate(async()=>{if(reports.length>=1000)return send(409,{error:'Demo capacity reached.'});const now=new Date().toISOString();const report={...value,id:randomUUID(),createdAt:now,status:'Open',team:null,history:[{at:now,action:'Report created'}]};await persist([...reports,report]);send(201,{report:ranked([report])[0]});});
      }
      if(req.method==='PATCH' && url.pathname.startsWith('/api/reports/')) {
        const value=validateUpdate(await body());const id=url.pathname.split('/').at(-1);
        return await mutate(async()=>{const current=reports.find(r=>r.id===id);if(!current)return send(404,{error:'Report not found.'});const updated={...current,...value,history:[...current.history,{at:new Date().toISOString(),action:`${value.status}${value.team?' · '+value.team:''}`}]};await persist(reports.map(r=>r.id===id?updated:r));send(200,{report:ranked([updated])[0]});});
      }
      if(req.method!=='GET')return send(405,{error:'Method not allowed.'});
      const files={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
      if(!files[url.pathname])return send(404,{error:'Not found.'});
      const [file,type]=files[url.pathname];send(200,await readFile(join(root,'public',file)),type);
    } catch(e) {send(e.status || (e.code?500:400),{error:e.code?'Could not save or read data.':e.message});}
  });
  return server;
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const server=await createApp();
  const port=Number(process.env.PORT || 3000);
  server.listen(port,'127.0.0.1',()=>console.log(`Relay → http://localhost:${port}`));
}
