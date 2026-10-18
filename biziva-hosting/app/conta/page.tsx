import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from '../chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Account() {
  const user = await getChatGPTUser();
  return <main style={{maxWidth:600,margin:'10vh auto',padding:28,fontFamily:'system-ui'}}>
    <p>✦ BIZIVA DADOS</p><h1>{user ? 'Você está conectado' : 'Sua conta'}</h1>
    {user ? <><p>Olá, {user.displayName}.</p><p data-testid="authenticated-email">{user.email}</p><a href={chatGPTSignOutPath('/conta')} target="_top">Sair</a></> : <><p>O editor funciona sem cadastro. Entre com ChatGPT para identificar sua sessão. Seus diagramas continuam salvos neste navegador.</p><a href={chatGPTSignInPath('/conta')} target="_top">Entrar com ChatGPT</a></>}
    <p><a href="/editor">Voltar ao editor</a></p>
    <small>O login ChatGPT não fornece saldo de IA. As gerações usam sua chave e carteira API Biziva.</small>
  </main>;
}
