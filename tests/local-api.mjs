import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173/api/records';
const prefix='qa-dinner-20261016-';
async function call(actor,method,data){return fetch(base,{method,headers:{'Content-Type':'application/json','x-dinner-profile':actor},body:JSON.stringify(data)});}
const make=(id,person,status,meal='salmon')=>({id:prefix+id,type:'selection',date:'2099-01-01',person,status,meal});
assert.equal((await call('Zeke','POST',make('blocked','Zeke','decision'))).status,403);
const a=await call('Jeff','POST',make('first','Jeff','decision'));assert.equal(a.status,200);const first=await a.json();
const b=await call('Devalina','POST',make('last','Devalina','decision','tacos'));assert.equal(b.status,200);const last=await b.json();assert.ok(last.sequence>first.sequence);
assert.equal((await call('Zeke','POST',make('suggest','Zeke','suggestion'))).status,200);
assert.equal((await call('Jeff','DELETE',{id:prefix+'suggest'})).status,403);
assert.equal((await call('Jeff','DELETE',{id:prefix+'first'})).status,403);
assert.equal((await call('Devalina','POST',{...first,meal:'tacos'})).status,403);
const rows=await (await fetch(base)).json();assert.equal(rows.filter(r=>r.id.startsWith(prefix)).length,3);
assert.equal((await call('Zeke','DELETE',{id:prefix+'suggest'})).status,200);
console.log('Passed: API rejects child decisions and cross-profile edits; preserves decisions; orders parent overrides.');
