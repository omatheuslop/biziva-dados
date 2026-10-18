import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSchema, toNativeTables, inspectSchema } from './schema.mjs';

test('rejects executable SQL and duplicate or malformed table/field names', () => {
  assert.throws(() => parseSchema('DROP TABLE users'));
  for (const name of ['a;drop', '<script>', 'abc space', '']) {
    assert.throws(() => parseSchema(JSON.stringify({tables:[{name,fields:[{name:'id',type:'INT'}]}]})));
  }
  assert.throws(() => parseSchema(JSON.stringify({tables:[{name:'a',fields:[{name:'id',type:'INT'},{name:'ID',type:'INT'}]}]})));
});
test('creates native editable tables without trusting model IDs or overwriting existing work', () => {
  const draft = parseSchema(JSON.stringify({tables:[{id:'injected',name:'clientes',fields:[{name:'id',type:'INTEGER',primary:true},{name:'email',type:'VARCHAR'}]}]}));
  let id=0;
  const tables = toNativeTables(draft,[{name:'produtos',x:500}],()=>`safe-${++id}`);
  assert.equal(tables[0].id,'safe-1');
  assert.equal(tables[0].x,800);
  assert.equal(tables[0].fields[0].type,'INT');
  assert.equal(tables[0].fields[1].size,'255');
  assert.throws(()=>toNativeTables(draft,[{name:'CLIENTES'}],()=>''));
  assert.equal(inspectSchema(tables).length,1);
});
test('flags missing primary keys and sensitive fields without network access', () => {
  assert.equal(inspectSchema([{name:'contas',fields:[{name:'password',primary:false}]}]).length,2);
  assert.deepEqual(inspectSchema([{name:'itens',fields:[{name:'id',primary:true}]}]),[]);
});
