import test from 'node:test';
import assert from 'node:assert/strict';
import {assist,API_URL} from './biziva-gateway.mjs';
const id='18ad3cb5-9192-47bd-a0dd-60c9d9377eee';
function req(body,headers={}){return new Request('https://product.example/api/assist',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer bzv_synthetic_not_a_real_key','X-Request-Id':id,...headers},body:JSON.stringify(body)});}
test('rejects cross-origin requests, missing credentials, invalid bodies and oversized streams before dispatch',async()=>{
  let calls=0;const blocked=async()=>{calls++;throw Error('must not dispatch');};
  assert.equal((await assist(req({prompt:'test'},{Origin:'https://attacker.example'}),blocked)).status,403);
  assert.equal((await assist(req({prompt:'test'},{Authorization:''}),blocked)).status,401);
  assert.equal((await assist(req(null),blocked)).status,400);
  assert.equal((await assist(req({prompt:'x'.repeat(25000)}),blocked)).status,413);
  assert.equal(calls,0);
});
test('uses fixed endpoint and caller credential, preserves idempotency, and never retries uncertain dispatch',async()=>{
  let calls=0;
  const success=await assist(req({prompt:'Synthetic description',url:'https://attacker.example'}),async(url,options)=>{
    calls++;assert.equal(url,API_URL);assert.equal(options.redirect,'error');
    assert.equal(options.headers['Idempotency-Key'],'labs-'+id);
    const body=JSON.parse(options.body);assert.equal(body.model,'biziva-auto');assert.equal(body.stream,false);assert.equal(body.max_tokens,3000);
    assert.equal(body.url,undefined);
    return Response.json({choices:[{message:{content:'{"tables":[]}'}}]});
  });
  assert.equal(success.status,200);assert.equal(calls,1);
  const uncertain=await assist(req({prompt:'test'}),async()=>{calls++;throw Error('timeout');});
  assert.equal(uncertain.status,502);assert.equal(calls,2);
});
test('bounds provider responses and handles null response safely',async()=>{
  assert.equal((await assist(req({prompt:'test'}),async()=>Response.json(null))).status,502);
  assert.equal((await assist(req({prompt:'test'}),async()=>new Response('x'.repeat(160001)))).status,502);
});
