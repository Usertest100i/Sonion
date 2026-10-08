import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, readFile, writeFile, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {get} from 'node:http';
import {createApp} from '../src/server.js';
import {validateReport, score, ranked, seed, validateUpdate} from '../src/domain.js';
const valid={title:'Ramp blocked',description:'A branch blocks the entrance.',location:'Library',category:'Access',impact:25,urgency:3,x:25,y:40};
let server,dir,base;
before(async()=>{dir=await mkdtemp(join(tmpdir(),'relay-'));server=await createApp({dataDir:dir});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(async()=>{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});});
const request=(path,method='GET',body)=>fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
test('01 Valid reports are normalized',()=>assert.equal(validateReport({...valid,title:'  Ramp blocked  '}).title,'Ramp blocked'));
test('02 Blank titles are rejected',()=>assert.throws(()=>validateReport({...valid,title:' '})));
test('03 Oversized descriptions are rejected',()=>assert.throws(()=>validateReport({...valid,description:'x'.repeat(1001)})));
test('04 Unknown categories are rejected',()=>assert.throws(()=>validateReport({...valid,category:'Invalid'})));
test('05 Fractional reported impact is rejected',()=>assert.throws(()=>validateReport({...valid,impact:1.5})));
test('06 Negative reported impact is rejected',()=>assert.throws(()=>validateReport({...valid,impact:-1})));
test('07 Out-of-range urgency is rejected',()=>assert.throws(()=>validateReport({...valid,urgency:4})));
test('08 Nonfinite coordinates are rejected',()=>assert.throws(()=>validateReport({...valid,x:NaN})));
test('09 Map bounds are enforced',()=>assert.throws(()=>validateReport({...valid,y:101})));
test('10 Null input is rejected',()=>assert.throws(()=>validateReport(null)));
test('11 Priority score saturates at 100',()=>assert.equal(score({...valid,impact:1000}).value,100));
test('12 Increasing urgency raises priority',()=>assert.ok(score({...valid,urgency:3}).value>score({...valid,urgency:1}).value));
test('13 Score exposes both contributing factors',()=>assert.deepEqual(score(valid).reasons,['Urgency: 60/60','Reported reach: 20/40']));
test('14 Ranking puts highest priority first',()=>{const r=ranked(seed());assert.ok(r.every((v,i)=>i===0 || r[i-1].priority.value>=v.priority.value));});
test('15 Assignment requires a recognized team',()=>assert.throws(()=>validateUpdate({status:'Assigned',team:'Unknown'})));
test('16 Resolving clears assignment',()=>assert.deepEqual(validateUpdate({status:'Resolved',team:'North crew'}),{status:'Resolved',team:null}));
test('17 API starts with six fictional reports',async()=>assert.equal((await (await request('/api/reports')).json()).reports.length,6));
test('18 Create, assign, resolve and persist an audit trail',async()=>{const res=await request('/api/reports','POST',valid);assert.equal(res.status,201);const {report}=await res.json();let updated=await request(`/api/reports/${report.id}`,'PATCH',{status:'Assigned',team:'Access team'});assert.equal((await updated.json()).report.team,'Access team');updated=await request(`/api/reports/${report.id}`,'PATCH',{status:'Resolved'});assert.equal((await updated.json()).report.history.length,3);const saved=JSON.parse(await readFile(join(dir,'reports.json'),'utf8'));assert.equal(saved.find(r=>r.id===report.id).status,'Resolved');});
test('19 Cross-origin writes are blocked',async()=>assert.equal((await fetch(base+'/api/reports',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify(valid)})).status,403));
test('20 Static file allowlist prevents data exposure',async()=>{assert.equal((await request('/data/reports.json')).status,404);const res=await request('/');assert.equal(res.status,200);assert.ok(res.headers.get('content-security-policy').includes("script-src 'self'"));});
test('21 Malformed JSON and oversized bodies are rejected',async()=>{assert.equal((await fetch(base+'/api/reports',{method:'POST',body:'{'})).status,400);assert.equal((await fetch(base+'/api/reports',{method:'POST',body:'x'.repeat(17000)})).status,413);});
test('22 Concurrent creates survive a server restart',async()=>{const results=await Promise.all(Array.from({length:5},(_,i)=>request('/api/reports','POST',{...valid,title:`Concurrent ${i}`})));assert.ok(results.every(r=>r.status===201));await new Promise(resolve=>server.close(resolve));server=await createApp({dataDir:dir});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;const value=await(await request('/api/reports')).json();assert.equal(value.reports.length,12);});

test('23 Updating an unknown report returns 404',async()=>assert.equal((await request('/api/reports/missing','PATCH',{status:'Resolved'})).status,404));

test('24 Invalid updates cannot change an existing report',async()=>{
  const before=(await(await request('/api/reports')).json()).reports.find(r=>r.id==='demo-1');
  assert.equal((await request('/api/reports/demo-1','PATCH',{status:'Assigned',team:'Unknown'})).status,400);
  const after=(await(await request('/api/reports')).json()).reports.find(r=>r.id==='demo-1');
  assert.deepEqual(after,before);
});

test('25 Disk failure leaves memory intact and the next save can recover',async()=>{
  const temporaryPath=join(dir,'reports.json.tmp');
  const before=(await(await request('/api/reports')).json()).reports;
  await mkdir(temporaryPath);
  try {
    assert.equal((await request('/api/reports','POST',{...valid,title:'Failed write'})).status,500);
    assert.deepEqual((await(await request('/api/reports')).json()).reports,before);
  } finally { await rm(temporaryPath,{recursive:true,force:true}); }
  assert.equal((await request('/api/reports','POST',{...valid,title:'Recovered write'})).status,201);
});

test('26 Corrupt and structurally invalid stores fail without overwriting data',async()=>{
  const scratch=await mkdtemp(join(tmpdir(),'relay-invalid-'));
  try {
    for (const content of ['{broken',JSON.stringify([{id:'missing-fields'}])]) {
      await writeFile(join(scratch,'reports.json'),content);
      await assert.rejects(createApp({dataDir:scratch}));
      assert.equal(await readFile(join(scratch,'reports.json'),'utf8'),content);
    }
  } finally { await rm(scratch,{recursive:true,force:true}); }
});

test('27 Unexpected Host names cannot reach the local API',async()=>{
  const status=await new Promise((resolve,reject)=>get(base+'/api/reports',{headers:{Host:'attacker.example'}},response=>{response.resume();resolve(response.statusCode);}).on('error',reject));
  assert.equal(status,403);
});

test('28 Equal priorities rank oldest first without mutating input',()=>{
  const older={...seed()[0],id:'older',createdAt:'2026-01-01T00:00:00.000Z'};
  const newer={...older,id:'newer',createdAt:'2026-01-02T00:00:00.000Z'};
  const input=[newer,older];
  assert.deepEqual(ranked(input).map(r=>r.id),['older','newer']);
  assert.deepEqual(input.map(r=>r.id),['newer','older']);
  assert.equal(input[0].priority,undefined);
});

test('29 The 1000-report capacity returns a conflict without writing',async()=>{
  const scratch=await mkdtemp(join(tmpdir(),'relay-capacity-'));let capacityServer;
  try {
    const content=JSON.stringify(Array.from({length:1000},(_,i)=>({...seed()[0],id:`capacity-${i}`})));
    await writeFile(join(scratch,'reports.json'),content);
    capacityServer=await createApp({dataDir:scratch});
    await new Promise(resolve=>capacityServer.listen(0,'127.0.0.1',resolve));
    const response=await fetch(`http://127.0.0.1:${capacityServer.address().port}/api/reports`,{method:'POST',body:JSON.stringify(valid)});
    assert.equal(response.status,409);
    assert.equal(await readFile(join(scratch,'reports.json'),'utf8'),content);
  } finally { if(capacityServer)await new Promise(resolve=>capacityServer.close(resolve));await rm(scratch,{recursive:true,force:true}); }
});

test('30 User text remains JSON data and cannot inject server-owned fields',async()=>{
  const title='<img src=x onerror=alert(1)>';
  const response=await request('/api/reports','POST',{...valid,title,id:'injected',status:'Resolved',team:'North crew',history:[]});
  assert.equal(response.status,201);
  assert.match(response.headers.get('content-type'),/application\/json/);
  const {report}=await response.json();
  assert.equal(report.title,title);assert.notEqual(report.id,'injected');assert.equal(report.status,'Open');assert.equal(report.team,null);assert.equal(report.history.length,1);
  assert.equal((await request('/api/reports','DELETE')).status,405);
});
