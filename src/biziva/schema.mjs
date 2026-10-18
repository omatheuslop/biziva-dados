const identifier = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
const types = new Set(['INT', 'INTEGER', 'BIGINT', 'VARCHAR', 'TEXT', 'BOOLEAN', 'DATE', 'TIMESTAMP', 'DECIMAL', 'JSON', 'UUID']);

// Accept a deliberately small schema, never executable SQL or model supplied IDs.
export function parseSchema(text) {
  if (typeof text !== 'string' || text.length > 60000) throw Error('Estrutura muito grande.');
  const source = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const data = JSON.parse(source);
  if (!Array.isArray(data.tables) || !data.tables.length || data.tables.length > 20) throw Error('Use entre 1 e 20 tabelas.');
  const names = new Set();
  return data.tables.map(table => {
    if (!identifier.test(table.name) || names.has(table.name.toLowerCase())) throw Error('Nome de tabela inválido ou repetido.');
    names.add(table.name.toLowerCase());
    if (!Array.isArray(table.fields) || !table.fields.length || table.fields.length > 40) throw Error('Use entre 1 e 40 campos por tabela.');
    const fields = new Set();
    return {
      name: table.name,
      fields: table.fields.map(field => {
        if (!identifier.test(field.name) || fields.has(field.name.toLowerCase()) || !types.has(field.type)) throw Error('Campo inválido, repetido ou tipo não suportado.');
        fields.add(field.name.toLowerCase());
        if (field.primary !== undefined && typeof field.primary !== 'boolean') throw Error('Chave primária inválida.');
        return { name: field.name, type: field.type === 'INTEGER' ? 'INT' : field.type, primary: field.primary === true };
      }),
    };
  });
}

export function inspectSchema(tables) {
  const issues = [];
  for (const table of tables) {
    if (!table.fields.some(field => field.primary)) issues.push(`${table.name}: sem chave primária.`);
    for (const field of table.fields) {
      if (/(password|senha|token|secret|segredo|cpf|email|telefone|phone|cartao|card_number)/i.test(field.name)) {
        issues.push(`${table.name}.${field.name}: dado potencialmente sensível; revise acesso, retenção e proteção.`);
      }
    }
  }
  return issues;
}

export function toNativeTables(schema, existing, makeId) {
  const names = new Set(existing.map(table => table.name.toLowerCase()));
  if (schema.some(table => names.has(table.name.toLowerCase()))) throw Error('Já existe uma tabela com esse nome. Renomeie antes de adicionar.');
  const right = existing.reduce((max, table) => Math.max(max, Number(table.x) || 0), -300) + 300;
  return schema.map((table, index) => ({
    id: makeId(), name: table.name, x: right + (index % 4) * 300, y: Math.floor(index / 4) * 450,
    locked: false, comment: '', indices: [], uniqueConstraints: [], color: '#175e7a', collapsed: false,
    fields: table.fields.map(field => ({
      id: makeId(), ...field, default: '', check: '', unique: false, unsigned: false,
      notNull: field.primary, increment: false, comment: '',
      ...(field.type === 'VARCHAR' ? { size: '255' } : {}),
      ...(field.type === 'DECIMAL' ? { size: '12,2' } : {}),
    })),
  }));
}

export const schemaInstruction = `Gere somente JSON com formato {"tables":[{"name":"clientes","fields":[{"name":"id","type":"INT","primary":true}]}]}. Máximo 20 tabelas, 40 campos cada. Nomes ASCII snake_case. Tipos permitidos: INT, INTEGER, BIGINT, VARCHAR, TEXT, BOOLEAN, DATE, TIMESTAMP, DECIMAL, JSON, UUID. Use chaves primárias. Não inclua SQL, markdown, IDs, coordenadas, dados reais ou relacionamentos. É um rascunho que será revisado pelo usuário. Descrição do negócio:\n`;
