# Amigo Secreto da Família Garbrecht

Página única para a família consultar tamanhos, preferências e sugestões de
presente do amigo secreto. Cada pessoa seleciona o próprio nome e atualiza a
sua linha; todos veem as mudanças ao recarregar a página.

**Site publicado:** https://gabgar1.github.io/amigo-secreto/

## Funcionalidades

- Tabela com todos os participantes e os campos:
  nome, tamanho de calça, tamanho de camiseta, tamanho de pé, cor favorita,
  interesses e sugestão de presente.
- Seletor "Quem é você?" para identificar a pessoa.
- Edição na própria tabela, restrita à linha do nome selecionado.
- Persistência compartilhada no Supabase.
- Layout responsivo: tabela no computador e cartões no celular.
- Estados de carregamento, lista vazia, erro de carregamento e erro ao salvar.

## Tecnologias

- HTML, CSS e JavaScript puros, sem etapa de build.
- SDK do Supabase via CDN ESM.
- Supabase (PostgreSQL, API REST e RLS).
- GitHub Pages para hospedagem estática.

## Estrutura

```text
.
├── index.html
├── styles.css
├── app.js
├── lib.js
├── config.js
├── package.json
├── tests/lib.test.js
├── supabase/schema.sql
├── README.md
└── docs/superpowers/
```

`package.json` existe apenas para declarar módulos ES e o script de teste; não
há dependências npm em produção.

## Configuração do Supabase

O projeto do Supabase já se chama `amigo-secreto`. Configure-o assim:

1. Abra o projeto no [Supabase](https://supabase.com/dashboard).
2. No **SQL Editor**, crie uma nova query, cole todo o conteúdo de
   `supabase/schema.sql` e execute.
3. Em **Project Settings → API** (ou **API Keys**), copie:
   - **Project URL**, no formato `https://<projeto>.supabase.co`;
   - a chave **anon public** (ou **publishable**).
4. Abra `config.js` e substitua os placeholders:

   ```js
   export const SUPABASE_URL = 'https://seu-projeto.supabase.co';
   export const SUPABASE_ANON_KEY = 'sua-chave-anon-publica';
   ```

5. No **Table Editor**, abra a tabela `participants` e insira uma linha para
   cada familiar. Preencha apenas o `name`; os demais campos podem ficar
   vazios e serão preenchidos por cada pessoa. Não repita nomes.

   Se preferir cadastrar todos de uma vez, execute no SQL Editor trocando os
   nomes de exemplo:

   ```sql
   insert into public.participants (name) values
     ('Nome do familiar 1'),
     ('Nome do familiar 2')
   on conflict (name) do nothing;
   ```

O schema cria a tabela, ativa RLS e permite apenas leitura e atualização dos
seis campos de informação pela chave anônima. Inserção, exclusão e alteração
de `name`/`id` são bloqueadas.

## Rodar localmente

Na raiz do projeto:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000`.

Não abra o `index.html` diretamente pelo protocolo `file://`: os módulos ES e
as importações via CDN exigem um servidor HTTP.

## Publicar no GitHub Pages

1. Crie um repositório público no GitHub (o plano gratuito do Pages exige
   repositório público).
2. Envie o projeto:

   ```bash
   git remote add origin https://github.com/<usuario>/amigo-secreto.git
   git push -u origin main
   ```

3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)` e salve.
6. Aguarde a publicação e acesse:

   ```text
   https://gabgar1.github.io/amigo-secreto/
   ```

Cada push para `main` atualiza o site. Se a URL ou a chave do Supabase mudarem,
atualize `config.js` e faça novo push.

## Segurança e privacidade

- A chave anônima do Supabase é pública por natureza e fica versionada em
  `config.js`. Ela só permite leitura e atualização dos campos previstos pelas
  políticas de RLS.
- **Nunca** use a chave `service_role` no frontend nem a versione neste
  repositório.
- Não há login. A interface limita a edição à linha selecionada, mas qualquer
  pessoa com o link e a chave pode alterar os campos de informação pela API.
  O projeto adota o modelo de confiança familiar aprovado.
- A página inclui `noindex, nofollow` para desencorajar indexação por
  buscadores, mas o link não é secreto.
- Projetos gratuitos do Supabase podem ser pausados após um período de
  inatividade. Se o site não carregar os dados, restaure o projeto no painel do
  Supabase.
- Como os dados pessoais não ficam no repositório, um repositório público
  expõe apenas o código e a chave anônima.

## Uso

1. Abra o site e escolha seu nome em **Quem é você?**.
2. Preencha seus tamanhos, cor favorita, interesses e sugestão de presente.
3. Clique em **Salvar**.
4. Para consultar outra pessoa, recarregue a página ou selecione outro nome.
5. **Cancelar** descarta a edição. Trocar de nome com alterações pendentes pede
   confirmação.

A sugestão de presente deve ser uma única frase de até 200 caracteres.

## Testes

Testes automatizados das funções puras:

```bash
node --test
```

Verificação de sintaxe:

```bash
node --check lib.js
node --check app.js
```

Requer Node.js 18 ou superior.

### Checklist manual

- [ ] A página abre sem erros no console.
- [ ] Com a configuração pendente, aparece a mensagem para preencher
      `config.js`.
- [ ] Com o Supabase configurado e sem participantes, aparece o estado vazio.
- [ ] Com participantes, a tabela exibe todos em ordem alfabética.
- [ ] Valores vazios aparecem como "—".
- [ ] Selecionar um nome deixa apenas aquela linha editável.
- [ ] Salvar mostra a confirmação, volta a linha para leitura e limpa o
      seletor.
- [ ] Recarregar a página mostra os dados salvos.
- [ ] Cancelar descarta as alterações.
- [ ] Trocar de pessoa com edição pendente pede confirmação.
- [ ] Desligar a rede e tentar salvar exibe erro sem perder os campos.
- [ ] O layout funciona em uma tela de 360px de largura.
- [ ] A navegação por teclado alcança o seletor, os campos e os botões.

### Conferir as políticas do Supabase

Substitua `SEU-PROJETO`, `SUA_CHAVE_ANON` e `ID_DO_PARTICIPANTE` pelos valores
reais.

Leitura (deve retornar `200`):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  "https://SEU-PROJETO.supabase.co/rest/v1/participants?select=id,name" \
  -H "apikey: SUA_CHAVE_ANON"
```

Atualização de um campo permitido (deve retornar `204`):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X PATCH \
  "https://SEU-PROJETO.supabase.co/rest/v1/participants?id=eq.ID_DO_PARTICIPANTE" \
  -H "apikey: SUA_CHAVE_ANON" \
  -H "Authorization: Bearer SUA_CHAVE_ANON" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"pants_size":"42"}'
```

Inserção (deve ser negada, `401` ou `403`):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X POST \
  "https://SEU-PROJETO.supabase.co/rest/v1/participants" \
  -H "apikey: SUA_CHAVE_ANON" \
  -H "Authorization: Bearer SUA_CHAVE_ANON" \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste"}'
```

Alteração de nome (deve ser negada, `401` ou `403`):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X PATCH \
  "https://SEU-PROJETO.supabase.co/rest/v1/participants?id=eq.ID_DO_PARTICIPANTE" \
  -H "apikey: SUA_CHAVE_ANON" \
  -H "Authorization: Bearer SUA_CHAVE_ANON" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"name":"Outro nome"}'
```

Exclusão (deve ser negada, `401` ou `403`):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" -X DELETE \
  "https://SEU-PROJETO.supabase.co/rest/v1/participants?id=eq.ID_DO_PARTICIPANTE" \
  -H "apikey: SUA_CHAVE_ANON" \
  -H "Authorization: Bearer SUA_CHAVE_ANON"
```
