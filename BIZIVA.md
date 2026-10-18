# Biziva Dados

Fork completo de [drawDB](https://github.com/drawdb-io/drawdb), com licença AGPL-3.0 e créditos originais preservados. A Biziva não é a autora do editor original.

## Melhorias desta versão

- Descrição de negócio gera um rascunho de tabelas, validado antes de entrar no editor nativo. O assistente trabalha em diagramas genéricos, exportáveis para os bancos suportados pelo drawDB.
- A adição preserva tabelas anteriores e oferece uma ação específica para remover somente a última adição do assistente.
- Revisão local de chaves primárias e nomes de campos potencialmente sensíveis, sem chamadas de IA.
- Chave API somente na memória da aba, autorização explícita para geração paga, identificador de idempotência e nenhuma repetição automática de uma chamada incerta.
- Página de conta usa a autenticação nativa de Sites. O editor funciona sem cadastro. Diagramas permanecem no navegador; login não promete sincronização nem inclui créditos de IA.

## Construir

Na raiz: `npm ci --ignore-scripts` e `npm run build`.

Para a hospedagem: `cd biziva-hosting`, `npm ci`, `node prepare-native.mjs`, `npm run build`. Os fontes do servidor, proxy e página de conta estão nesta pasta. Dependências mantêm suas próprias licenças. A autenticação `/signin-with-chatgpt` depende do serviço Sites; outro provedor deve configurar sua própria autenticação e nunca confiar em cabeçalhos de identidade fornecidos diretamente pelo visitante.

Não configure uma chave paga compartilhada no navegador ou no repositório. O proxy usa exclusivamente a chave do visitante e um destino fixo da API Biziva.

O editor mantém recursos locais originais, importação e exportação. Serviços externos opcionais do projeto original exigem configuração própria; não são anunciados como integrações Biziva prontas.
