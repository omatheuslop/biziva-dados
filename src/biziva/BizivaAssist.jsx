import { useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { useDiagram } from '../hooks';
import { inspectSchema, parseSchema, schemaInstruction, toNativeTables } from './schema.mjs';
import './assist.css';
import { DB } from '../data/constants';

export default function BizivaAssist() {
  const { tables, addTable, deleteTable, database } = useDiagram();
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [consent, setConsent] = useState(false);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastAdded, setLastAdded] = useState([]);
  const lock = useRef(false);
  // Preserve the request ID for the same action, including uncertain responses.
  const attempts = useRef(new Map());
  const issues = inspectSchema(tables);
  async function generate() {
    if (lock.current || !key || !prompt.trim() || !consent) return;
    lock.current = true; setBusy(true); setStatus('Gerando uma única vez…');
    try {
      const fingerprint = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key + '\n' + prompt));
      const signature = Array.from(new Uint8Array(fingerprint), n => n.toString(16).padStart(2, '0')).join('');
      let id = attempts.current.get(signature);
      if (!id) { id = crypto.randomUUID(); attempts.current.set(signature, id); }
      const response = await fetch('/api/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key, 'X-Request-Id': id },
        body: JSON.stringify({ prompt: schemaInstruction + prompt }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'A API não confirmou o resultado.');
      parseSchema(result.text);
      setDraft(result.text); setStatus('Rascunho validado. Revise antes de adicionar ao diagrama.');
    } catch (error) { setStatus(error.message + ' Não há nova geração automática.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function apply() {
    try {
      if (database !== DB.GENERIC) throw Error('Este assistente cria estruturas genéricas. Abra um diagrama do tipo genérico; depois exporte para o banco desejado.');
      const additions = toNativeTables(parseSchema(draft), tables, nanoid);
      additions.forEach((table, index) => addTable({ table, index: tables.length + index }));
      setLastAdded(additions.map(table => table.id));
      setDraft(''); setStatus(`${additions.length} tabelas adicionadas. Você pode remover esta adição pelo botão abaixo.`);
    } catch (error) { setStatus(error.message); }
  }
  return <aside className="biziva-assist">
    <button className="biziva-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>✦ Biziva Dados</button>
    {open && <section aria-label="Assistente Biziva Dados">
      <header><strong>Do negócio à estrutura</strong><button onClick={() => setOpen(false)} aria-label="Fechar assistente">×</button></header>
      <p>Crie tabelas editáveis e mantenha todos os recursos do drawDB.</p>
      <label>Descrição do negócio<textarea maxLength={5000} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Uma clínica com pacientes, consultas e pagamentos…" /></label>
      <label>Chave API Biziva<input type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} /></label>
      <small>A chave permanece na memória desta aba. Sua carteira API paga a geração.</small>
      <label className="biziva-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Autorizo enviar esta descrição à API Biziva e usar meu saldo.</label>
      <button disabled={busy || !key || !prompt.trim() || !consent} onClick={generate}>{busy ? 'Gerando…' : 'Gerar rascunho com IA'}</button>
      <details><summary>Importar ou revisar JSON sem gastar IA</summary><textarea aria-label="Estrutura JSON" value={draft} onChange={e => setDraft(e.target.value)} maxLength={60000} /></details>
      <button disabled={!draft || busy} onClick={apply}>Adicionar tabelas ao diagrama</button>
      {lastAdded.some(id => tables.some(table => table.id === id)) && <button onClick={() => {
        lastAdded.filter(id => tables.some(table => table.id === id)).forEach(id => deleteTable(id));
        setLastAdded([]); setStatus('Última adição removida. As outras tabelas foram preservadas.');
      }}>Remover última adição do assistente</button>}
      <p role="status">{status}</p>
      <h3>Revisão local · sem custo de IA</h3>
      {issues.length ? <ul>{issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p>{tables.length ? 'Sem alertas nas regras básicas. Não substitui revisão técnica.' : 'Adicione tabelas para revisar.'}</p>}
      <footer><a href="/conta" target="_top">Minha conta · ChatGPT</a> · <a href="https://github.com/omatheuslop/biziva-dados" target="_blank" rel="noreferrer">Código-fonte completo · AGPL-3.0</a></footer>
    </section>}
  </aside>;
}
