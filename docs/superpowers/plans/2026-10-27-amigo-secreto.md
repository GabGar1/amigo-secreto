# Site de Amigo Secreto da Família Garbrecht — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir uma página estática compartilhada onde cada familiar consulta os dados de todos e edita a própria linha, com persistência no Supabase.

**Architecture:** Frontend HTML/CSS/JS puro, sem build, usando o SDK do Supabase via CDN ESM. Os dados ficam em uma única tabela Postgres protegida por RLS; o GitHub Pages serve os arquivos estáticos.

**Tech Stack:** HTML5, CSS3, JavaScript (ES modules), Supabase (Postgres/PostgREST/RLS), GitHub Pages, Node.js test runner.

## Global Constraints

- Todo texto da interface em português do Brasil.
- Sem login, sem tempo real, sem cadastro/exclusão de pessoas pela página.
- Nenhuma dependência npm em produção; `package.json` só declara `"type": "module"` e o script de teste.
- Nunca usar a chave `service_role` no frontend.
- Toda informação vinda do banco deve ser renderizada com `textContent`, nunca `innerHTML`.
- Os seis campos editáveis são texto livre: `pants_size`, `shirt_size`, `shoe_size`, `favorite_color`, `interests`, `gift_suggestion`.
- `name` e `id` não podem ser alterados pela aplicação.
- A chave anônima é pública e fica em `config.js`.
- O site deve funcionar servido em subpasta do GitHub Pages; usar caminhos relativos.
- Commits por tarefa foram autorizados pelo usuário.

## File Structure

- `index.html` — estrutura da página e contrato de IDs.
- `styles.css` — tema, tabela, estados e layout responsivo.
- `lib.js` — funções puras testáveis.
- `app.js` — cliente Supabase, estado e DOM.
- `config.js` — URL e chave anônima do Supabase.
- `package.json` — módulos ES e script de teste, sem dependências.
- `tests/lib.test.js` — testes de `lib.js`.
- `supabase/schema.sql` — tabela, RLS, políticas e privilégios.
- `README.md` — configuração, uso, deploy e checklist.
- `.gitignore` — `node_modules/` e `.DS_Store`.

---

### Task 0: Repositório, especificação e plano

**Files:**
- Create: `.gitignore`
- Create: `docs/superpowers/specs/2026-10-27-amigo-secreto-design.md`
- Create: `docs/superpowers/plans/2026-10-27-amigo-secreto.md`

**Interfaces:**
- Consumes: decisões aprovadas no brainstorming.
- Produces: repositório git e documentação de referência para as próximas tarefas.

- [x] **Step 1: Inicializar o repositório**

```bash
git init -b main
```

- [x] **Step 2: Criar `.gitignore`**

```gitignore
node_modules/
.DS_Store
```

- [x] **Step 3: Gravar a especificação e este plano**

Arquivos criados em `docs/superpowers/specs/` e `docs/superpowers/plans/`.

- [ ] **Step 4: Commitar**

```bash
git add .gitignore docs/
git commit -m "docs: adiciona especificacao e plano do amigo secreto"
```

- [ ] **Step 5: Pausar para revisão da especificação pelo usuário**

Não iniciar código antes da aprovação da spec.

---

### Task 1: Helpers puros com TDD

**Files:**
- Create: `package.json`
- Create: `lib.js`
- Test: `tests/lib.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `TEXT_FIELDS: string[]`
  - `sortParticipants(list): list`
  - `displayValue(value): string`
  - `normalizeFields(input): Record<string, string>`
  - `fieldsChanged(original, current): boolean`
  - `isConfigured(url, key): boolean`

- [ ] **Step 1: Criar `package.json` sem dependências**

```json
{
  "name": "amigo-secreto",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 2: Escrever os testes que falham**

`tests/lib.test.js` deve cobrir:

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TEXT_FIELDS,
  displayValue,
  fieldsChanged,
  isConfigured,
  normalizeFields,
  sortParticipants,
} from '../lib.js';

test('sortParticipants ordena em pt-BR e não muta a lista original', () => {
  const input = [
    { name: 'Zélia' },
    { name: 'ana' },
    { name: 'Álvaro' },
    { name: 'Bruno' },
  ];
  const sorted = sortParticipants(input);
  assert.deepEqual(sorted.map(({ name }) => name), ['Álvaro', 'ana', 'Bruno', 'Zélia']);
  assert.equal(input[0].name, 'Zélia');
});

test('displayValue mostra travessão para valores vazios', () => {
  assert.equal(displayValue(''), '—');
  assert.equal(displayValue('   '), '—');
  assert.equal(displayValue(null), '—');
  assert.equal(displayValue(undefined), '—');
  assert.equal(displayValue('  M  '), 'M');
});

test('normalizeFields faz trim em todos os campos', () => {
  assert.deepEqual(
    normalizeFields({
      pants_size: '  42 ',
      shirt_size: ' G ',
      shoe_size: ' 38 ',
      favorite_color: ' azul ',
      interests: ' livros ',
      gift_suggestion: ' um livro ',
    }),
    {
      pants_size: '42',
      shirt_size: 'G',
      shoe_size: '38',
      favorite_color: 'azul',
      interests: 'livros',
      gift_suggestion: 'um livro',
    },
  );
});

test('normalizeFields trata campos ausentes', () => {
  const normalized = normalizeFields({});
  assert.equal(normalized.pants_size, '');
  assert.equal(normalized.gift_suggestion, '');
});

test('normalizeFields transforma a sugestão em linha única', () => {
  const normalized = normalizeFields({ gift_suggestion: '  um\npresente   legal  ' });
  assert.equal(normalized.gift_suggestion, 'um presente legal');
});

test('normalizeFields limita a sugestão a 200 caracteres', () => {
  assert.equal(normalizeFields({ gift_suggestion: 'a'.repeat(250) }).gift_suggestion.length, 200);
});

test('normalizeFields ignora campos que não são texto', () => {
  const normalized = normalizeFields({ interests: 42, gift_suggestion: null });
  assert.equal(normalized.interests, '');
  assert.equal(normalized.gift_suggestion, '');
});

test('TEXT_FIELDS contém os seis campos editáveis', () => {
  assert.deepEqual(TEXT_FIELDS, [
    'pants_size',
    'shirt_size',
    'shoe_size',
    'favorite_color',
    'interests',
    'gift_suggestion',
  ]);
});

test('fieldsChanged detecta mudanças após normalização', () => {
  const original = {
    pants_size: '42',
    shirt_size: 'G',
    shoe_size: '38',
    favorite_color: 'azul',
    interests: 'livros',
    gift_suggestion: 'um livro',
  };
  assert.equal(fieldsChanged(original, { ...original, pants_size: ' 42 ' }), false);
  assert.equal(fieldsChanged(original, { ...original, pants_size: '44' }), true);
});

test('isConfigured valida URL e chave anônima', () => {
  assert.equal(isConfigured('https://meuprojeto.supabase.co', 'a'.repeat(40)), true);
  assert.equal(isConfigured('https://meuprojeto.supabase.co', 'SUA-CHAVE-ANON-PUBLICA'), false);
  assert.equal(isConfigured('http://meuprojeto.supabase.co', 'a'.repeat(40)), false);
  assert.equal(isConfigured('', 'a'.repeat(40)), false);
});
```

- [ ] **Step 3: Rodar os testes e confirmar a falha**

Run: `node --test`
Expected: falha porque `lib.js` ainda não existe.

- [ ] **Step 4: Implementar `lib.js`**

```js
export const TEXT_FIELDS = [
  'pants_size',
  'shirt_size',
  'shoe_size',
  'favorite_color',
  'interests',
  'gift_suggestion',
];

const GIFT_SUGGESTION_MAX_LENGTH = 200;

export function sortParticipants(participants) {
  return [...participants].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
  );
}

export function displayValue(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text === '' ? '—' : text;
}

export function normalizeFields(input) {
  const source = input ?? {};
  const result = {};
  for (const field of TEXT_FIELDS) {
    const value = typeof source[field] === 'string' ? source[field].trim() : '';
    result[field] = value;
  }
  result.gift_suggestion = result.gift_suggestion
    .replace(/\s+/g, ' ')
    .slice(0, GIFT_SUGGESTION_MAX_LENGTH)
    .trim();
  return result;
}

export function fieldsChanged(original, current) {
  const normalizedOriginal = normalizeFields(original);
  const normalizedCurrent = normalizeFields(current);
  return TEXT_FIELDS.some((field) => normalizedOriginal[field] !== normalizedCurrent[field]);
}

export function isConfigured(url, key) {
  if (typeof url !== 'string' || typeof key !== 'string') return false;
  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();
  return (
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(trimmedUrl) &&
    !trimmedUrl.includes('SEU-PROJETO') &&
    trimmedKey.length >= 20 &&
    !trimmedKey.includes('SUA-CHAVE')
  );
}
```

- [ ] **Step 5: Rodar os testes e confirmar a aprovação**

Run: `node --test`
Expected: todos os testes passando.

- [ ] **Step 6: Commit**

```bash
git add package.json lib.js tests/lib.test.js
git commit -m "feat: adiciona helpers e testes"
```

---

### Task 2: Schema e políticas do Supabase

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Consumes: nomes das colunas de `TEXT_FIELDS`.
- Produces: tabela `public.participants`, pronta para leitura e atualização pela chave anônima.

- [ ] **Step 1: Criar o schema**

```sql
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pants_size text not null default '',
  shirt_size text not null default '',
  shoe_size text not null default '',
  favorite_color text not null default '',
  interests text not null default '',
  gift_suggestion text not null default ''
);

alter table public.participants enable row level security;

drop policy if exists "leitura_publica" on public.participants;
create policy "leitura_publica"
  on public.participants
  for select
  to anon
  using (true);

drop policy if exists "atualizacao_publica" on public.participants;
create policy "atualizacao_publica"
  on public.participants
  for update
  to anon
  using (true)
  with check (true);

grant usage on schema public to anon;
grant select on public.participants to anon;
revoke insert, update, delete on public.participants from anon;
grant update (
  pants_size,
  shirt_size,
  shoe_size,
  favorite_color,
  interests,
  gift_suggestion
) on public.participants to anon;
```

- [ ] **Step 2: Verificar no Supabase**

Executar o arquivo no SQL Editor. Testar com a chave anônima:

- `SELECT` retorna 200.
- `UPDATE` de `pants_size` retorna 200.
- `INSERT` e `DELETE` são negados.
- `UPDATE` de `name` é negado.

- [ ] **Step 3: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: adiciona schema e politicas do Supabase"
```

---

### Task 3: Estrutura HTML e CSS responsivo

**Files:**
- Create: `index.html`
- Create: `styles.css`

**Interfaces:**
- Consumes: nenhum código, apenas o contrato visual.
- Produces (IDs consumidos por `app.js`): `person-select`, `status`, `participants-table`, `participants-body`, `empty-state`.

- [ ] **Step 1: Criar `index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Amigo Secreto da Família Garbrecht</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <main class="container">
    <header class="page-header">
      <p class="eyebrow">Natal em família</p>
      <h1>Amigo Secreto da Família Garbrecht</h1>
      <p class="intro">
        Consulte os tamanhos e as preferências de todos. Para atualizar seus dados,
        selecione seu nome e edite a sua linha.
      </p>
    </header>

    <section class="identity" aria-labelledby="identity-label">
      <label id="identity-label" for="person-select">Quem é você?</label>
      <select id="person-select" disabled>
        <option value="">Carregando participantes…</option>
      </select>
      <p class="hint">Você poderá editar apenas a linha do nome selecionado.</p>
    </section>

    <p id="status" class="status" role="status" aria-live="polite"></p>

    <section class="table-section" aria-labelledby="table-title">
      <h2 id="table-title" class="sr-only">Participantes</h2>
      <div class="table-wrap">
        <table id="participants-table" hidden>
          <caption class="sr-only">Informações dos participantes do amigo secreto</caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Calça</th>
              <th scope="col">Camiseta</th>
              <th scope="col">Pé</th>
              <th scope="col">Cor favorita</th>
              <th scope="col">Interesses</th>
              <th scope="col">Sugestão de presente</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody id="participants-body"></tbody>
        </table>
      </div>
      <div id="empty-state" class="empty-state" hidden>
        <p>Nenhum participante cadastrado ainda.</p>
        <p>Adicione os nomes pela tabela <code>participants</code> no Supabase.</p>
      </div>
    </section>
  </main>
  <script type="module" src="./app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Criar `styles.css`**

Requisitos exatos:

- Variáveis de tema claro: fundo `#f7f4ef`, superfície `#fff`, texto `#23312b`, primária `#9e2b25`, verde `#1f6b4a`.
- `body` com fundo em gradientes radiais discretos e tipografia de sistema.
- Container com largura máxima de 1180px.
- Cartão de identidade com seletor de no mínimo 44px de altura.
- Tabela com cabeçalho em maiúsculas pequenas, linhas com borda, linha selecionada em verde-claro.
- Botões primário (vermelho) e secundário (branco com borda), ambos com 44px.
- Regra global `[hidden] { display: none !important; }`.
- Breakpoint de 760px: `table`, `thead`, `tbody`, `tr`, `th`, `td` viram blocos; `thead` fica visualmente escondido; cada `tr` vira cartão; cada célula mostra o rótulo via `td::before { content: attr(data-label); }`; `th.name-cell` é o título do cartão; a célula de ações usa `display: flex`.
- Foco visível com `outline: 3px solid rgba(31, 107, 74, 0.35)`.
- Classe `.sr-only` para conteúdo apenas para leitores de tela.
- Estado vazio com borda tracejada e texto centralizado.

- [ ] **Step 3: Verificar visualmente**

Run: `python3 -m http.server 8000`
Expected: página abre em `http://localhost:8000`; seletor desabilitado; tabela oculta; sem erros de layout em 360px.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: adiciona estrutura e estilos da pagina"
```

---

### Task 4: Configuração e carregamento de dados

**Files:**
- Create: `config.js`
- Modify: `app.js`

**Interfaces:**
- Consumes: IDs da Task 3 e helpers da Task 1.
- Produces: `loadParticipants()`, `render()`, `populateSelect()` e estado `participants`, `selectedId`, `editing`.

- [ ] **Step 1: Criar `config.js` com placeholders**

```js
export const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
export const SUPABASE_ANON_KEY = 'SUA-CHAVE-ANON-PUBLICA';
```

- [ ] **Step 2: Implementar o carregamento e a renderização**

`app.js` deve:

```js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { displayValue, isConfigured, sortParticipants, TEXT_FIELDS } from './lib.js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config.js';

const FIELD_LABELS = {
  pants_size: 'Calça',
  shirt_size: 'Camiseta',
  shoe_size: 'Pé',
  favorite_color: 'Cor favorita',
  interests: 'Interesses',
  gift_suggestion: 'Sugestão de presente',
};

const select = document.querySelector('#person-select');
const status = document.querySelector('#status');
const table = document.querySelector('#participants-table');
const tbody = document.querySelector('#participants-body');
const emptyState = document.querySelector('#empty-state');

const supabase = isConfigured(SUPABASE_URL, SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let participants = [];
let selectedId = null;
let editing = false;

init();

function init() {
  if (!supabase) {
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Configuração pendente';
    select.append(option);
    select.disabled = true;
    setStatus(
      'Configure SUPABASE_URL e SUPABASE_ANON_KEY em config.js para carregar os participantes.',
      'error',
    );
    return;
  }

  select.addEventListener('change', handleSelectChange);
  loadParticipants();
}

async function loadParticipants() {
  select.disabled = true;
  setStatus('Carregando participantes…');

  const { data, error } = await supabase.from('participants').select('*');

  if (error) {
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Falha ao carregar';
    select.append(option);
    select.disabled = true;
    setStatus('Não foi possível carregar os participantes.', 'error', loadParticipants);
    return;
  }

  participants = sortParticipants(data ?? []);
  selectedId = null;
  editing = false;
  setStatus('');
  render();
  populateSelect();
}

function render() {
  tbody.replaceChildren();
  table.hidden = participants.length === 0;
  emptyState.hidden = participants.length > 0;

  for (const participant of participants) {
    tbody.append(buildViewRow(participant));
  }
}

function buildViewRow(participant) {
  const row = document.createElement('tr');
  row.dataset.id = participant.id;
  if (participant.id === selectedId) row.classList.add('is-selected');

  const nameCell = document.createElement('th');
  nameCell.scope = 'row';
  nameCell.className = 'name-cell';
  nameCell.dataset.label = 'Nome';
  nameCell.textContent = participant.name;
  row.append(nameCell);

  for (const field of TEXT_FIELDS) {
    const cell = document.createElement('td');
    cell.dataset.label = FIELD_LABELS[field];
    cell.textContent = displayValue(participant[field]);
    if (displayValue(participant[field]) === '—') cell.classList.add('is-empty');
    row.append(cell);
  }

  const actionsCell = document.createElement('td');
  actionsCell.className = 'actions-cell';
  actionsCell.dataset.label = 'Ações';
  actionsCell.hidden = true;
  row.append(actionsCell);

  return row;
}

function populateSelect() {
  select.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent =
    participants.length === 0 ? 'Nenhum participante cadastrado' : 'Selecione seu nome';
  placeholder.disabled = true;
  select.append(placeholder);

  for (const participant of participants) {
    const option = document.createElement('option');
    option.value = participant.id;
    option.textContent = participant.name;
    select.append(option);
  }

  select.value = selectedId ?? '';
  select.disabled = participants.length === 0;
}

function handleSelectChange() {
  selectedId = select.value || null;
  render();
}

function setStatus(message, type = 'info', retry = null) {
  status.replaceChildren();
  status.className = 'status';

  if (!message) {
    status.hidden = true;
    return;
  }

  status.hidden = false;
  status.classList.add(type);

  const text = document.createElement('span');
  text.textContent = message;
  status.append(text);

  if (retry) {
    const retryButton = document.createElement('button');
    retryButton.type = 'button';
    retryButton.className = 'button button-link';
    retryButton.textContent = 'Tentar novamente';
    retryButton.addEventListener('click', retry);
    status.append(retryButton);
  }
}
```

- [ ] **Step 3: Verificar com um projeto Supabase real**

Cadastrar dois nomes de teste no Table Editor, abrir a página e confirmar:
tabela renderizada em ordem alfabética, seletor preenchido e valores vazios
como "—". Selecionar um nome deve destacar a linha.

- [ ] **Step 4: Commit**

```bash
git add config.js app.js
git commit -m "feat: carrega e exibe participantes"
```

---

### Task 5: Edição e persistência

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: estado e renderização da Task 4.
- Produces: `buildEditRow(participant)`, `startEditing(id)`, `readDraft()`, `saveParticipant(participant)`, `cancelEditing()`, `setSaving(isSaving)`.

- [ ] **Step 1: Adicionar os imports que faltam**

```js
import { fieldsChanged, normalizeFields } from './lib.js';
```

- [ ] **Step 2: Implementar a edição na linha**

`handleSelectChange` deve:

1. Se não houver valor, retornar.
2. Se já estiver editando e o próximo nome for diferente, comparar
   `readDraft()` com o participante original usando `fieldsChanged`.
3. Se houver mudanças, usar `window.confirm('Descartar as alterações não salvas?')`;
   se recusar, restaurar `select.value = selectedId` e retornar.
4. Chamar `startEditing(nextId)`.

`startEditing` define `selectedId`, `editing = true`, limpa o status, chama
`render()` e foca o primeiro `input`.

`buildEditRow` mantém o nome como `th`, cria um `input` de texto para cada
campo com `name`, `aria-label`, `autocomplete="off"` e, para
`gift_suggestion`, `maxlength="200"` e placeholder "Uma frase curta". A célula
de ações contém os botões `[data-action="save"]` e `[data-action="cancel"]`,
com listeners diretos.

`saveParticipant`:

```js
async function saveParticipant(participant) {
  const fields = normalizeFields(readDraft());
  setStatus('');
  setSaving(true);

  const { data, error } = await supabase
    .from('participants')
    .update(fields)
    .eq('id', participant.id)
    .select()
    .single();

  if (error) {
    setSaving(false);
    setStatus('Não foi possível salvar as informações. Tente novamente.', 'error');
    return;
  }

  participants = sortParticipants(
    participants.map((item) => (item.id === data.id ? data : item)),
  );
  selectedId = null;
  editing = false;
  render();
  populateSelect();
  setStatus('Informações salvas com sucesso.', 'success');
}
```

`cancelEditing` limpa `selectedId` e `editing`, renderiza, repopula o seletor e
limpa o status. `setSaving` desabilita os botões e troca o texto de Salvar para
"Salvando…".

- [ ] **Step 3: Verificar o fluxo completo**

- Selecionar um nome → apenas aquela linha vira formulário.
- Salvar → mensagem de sucesso, linha volta ao modo leitura, seletor limpo.
- Recarregar → dados persistidos.
- Cancelar → alterações descartadas.
- Trocar de pessoa com alteração pendente → confirmação.
- Desligar a rede e salvar → erro exibido, campos preservados.

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: permite editar e salvar informacoes"
```

---

### Task 6: README e verificação final

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: todo o projeto.
- Produces: documentação de configuração, uso, deploy e testes.

- [ ] **Step 1: Escrever o README**

Deve conter, nesta ordem:

1. Descrição e funcionalidades.
2. Tecnologias e estrutura de arquivos.
3. Configuração do Supabase: criar projeto, executar `schema.sql`, copiar URL
   e chave anônima, preencher `config.js`, cadastrar nomes no Table Editor.
4. Como rodar localmente: `python3 -m http.server 8000`; avisar que abrir via
   `file://` não funciona por causa dos módulos.
5. Publicação no GitHub Pages: repositório público, push para `main`,
   Settings → Pages → Deploy from a branch → `main` / root.
6. Segurança: chave anônima pública, RLS, proibição da `service_role`, modelo
   de confiança, `noindex`, pausa de projetos gratuitos do Supabase.
7. Checklist manual de testes.
8. Comandos `node --test`, `node --check lib.js`, `node --check app.js`.

- [ ] **Step 2: Rodar as verificações**

```bash
node --test
node --check lib.js
node --check app.js
```

Expected: testes passando e nenhum erro de sintaxe.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: adiciona instrucoes de configuracao e uso"
```

---

### Task 7: Publicação assistida

**Files:**
- Modify: `config.js` (preencher com dados reais)

**Interfaces:**
- Consumes: projeto Supabase e repositório GitHub do usuário.
- Produces: site publicado no GitHub Pages.

- [ ] **Step 1: Criar o projeto Supabase e executar o schema**
- [ ] **Step 2: Preencher `config.js` e cadastrar os nomes reais**
- [ ] **Step 3: Criar o repositório público no GitHub e fazer push**
- [ ] **Step 4: Ativar o GitHub Pages em `main` / root**
- [ ] **Step 5: Abrir a URL publicada e executar o checklist manual**

---

## Self-Review

- Cobertura: tabela única, seletor, edição da própria linha, persistência,
  responsividade, estados de erro, hospedagem gratuita e documentação estão
  mapeados nas Tasks 1–7.
- Consistência de nomes: `TEXT_FIELDS`, colunas do schema, campos de
  `normalizeFields` e `FIELD_LABELS` usam os mesmos identificadores.
- Sem placeholders de implementação; os valores de configuração do Supabase
  são preenchidos pelo usuário na Task 7.
