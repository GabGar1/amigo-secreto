# Redesenho Natalino — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Remover a sugestão de presente da interface e aplicar um visual natalino acolhedor, com árvores decorativas no fundo e uma árvore com luzes piscando no canto inferior direito.

**Architecture:** A interface continua estática em HTML/CSS/JS puro. A remoção do campo ocorre apenas na apresentação; o schema e os dados do Supabase permanecem intactos. As decorações são SVGs inline e a animação é CSS com suporte a `prefers-reduced-motion`.

**Tech Stack:** HTML5, CSS3, JavaScript (ES modules), SVGs inline, Google Fonts, Supabase, GitHub Pages, Node.js test runner, Playwright para verificação temporária no navegador.

## Global Constraints

- Manter todo o texto da interface em português do Brasil.
- Não alterar o schema, as políticas de RLS ou os dados do Supabase.
- Não usar imagens externas para as decorações; usar apenas SVG inline.
- A animação da árvore deve ser suave e desligada em `prefers-reduced-motion: reduce`.
- Toda decoração deve ser `aria-hidden` e não interceptar cliques.
- Manter acessibilidade: foco visível, contraste e alvos de toque de 44px.
- Manter carregamento, seleção, edição, salvamento, cancelamento e estados de erro/vazio.
- A fonte externa deve ter fallback local e não bloquear a página.
- Usar caminhos relativos para funcionar em subpasta do GitHub Pages.

## File Structure

- `index.html` — fontes, decorações SVG, árvore animada, rodapé e remoção da coluna.
- `styles.css` — novo sistema visual, árvores, animação e responsividade.
- `lib.js` — `TEXT_FIELDS` com cinco campos; normalização sem a sugestão.
- `app.js` — remove rótulo e tratamento especial da sugestão.
- `tests/lib.test.js` — testes atualizados para cinco campos.
- `README.md` — documentação atualizada.
- `docs/superpowers/specs/2026-10-27-amigo-secreto-design.md` — spec atualizada.
- `docs/superpowers/plans/2026-10-27-redesign-natalino.md` — este plano.

---

### Task 0: Baseline e documentação

**Files:**
- Modify: `docs/superpowers/specs/2026-10-27-amigo-secreto-design.md`
- Create: `docs/superpowers/plans/2026-10-27-redesign-natalino.md`

**Interfaces:**
- Consumes: decisões aprovadas no brainstorming.
- Produces: documentação de referência atualizada.

- [x] **Step 1: Rodar o baseline**

```bash
node --test
```

Expected: 10 testes passando.

- [x] **Step 2: Atualizar a spec**

Atualizar objetivo, campos exibidos, fluxo de edição, segurança, interface,
critérios de aceite e adicionar a seção de revisão visual.

- [x] **Step 3: Criar este plano**

- [x] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: planeja redesenho natalino"
```

---

### Task 1: Remover a sugestão de presente (TDD)

**Files:**
- Modify: `tests/lib.test.js`
- Modify: `lib.js`
- Modify: `app.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `TEXT_FIELDS`, `normalizeFields`, `fieldsChanged`.
- Produces: `TEXT_FIELDS` com cinco campos:
  `pants_size`, `shirt_size`, `shoe_size`, `favorite_color`, `interests`.

- [x] **Step 1: Atualizar os testes primeiro**

Alterar `tests/lib.test.js` para esperar cinco campos:

```js
test('TEXT_FIELDS contém os cinco campos editáveis', () => {
  assert.deepEqual(TEXT_FIELDS, [
    'pants_size',
    'shirt_size',
    'shoe_size',
    'favorite_color',
    'interests',
  ]);
});

test('normalizeFields não inclui a sugestão de presente', () => {
  const normalized = normalizeFields({
    interests: ' livros ',
    gift_suggestion: 'um livro',
  });

  assert.deepEqual(Object.keys(normalized), TEXT_FIELDS);
  assert.equal('gift_suggestion' in normalized, false);
});
```

Remover os testes específicos de linha única, limite de 200 caracteres e
normalização da sugestão. Ajustar os testes de trim, campos ausentes e
`fieldsChanged` para não usarem `gift_suggestion`.

- [x] **Step 2: Rodar os testes e confirmar a falha**

```bash
node --test
```

Expected: falha em `TEXT_FIELDS` e no teste de ausência da sugestão.

- [x] **Step 3: Atualizar `lib.js`**

```js
export const TEXT_FIELDS = [
  'pants_size',
  'shirt_size',
  'shoe_size',
  'favorite_color',
  'interests',
];

export function normalizeFields(input) {
  const source = input ?? {};
  const result = {};

  for (const field of TEXT_FIELDS) {
    const value = typeof source[field] === 'string' ? source[field].trim() : '';
    result[field] = value;
  }

  return result;
}
```

Remover `GIFT_SUGGESTION_MAX_LENGTH` e o bloco especial de
`gift_suggestion`.

- [x] **Step 4: Atualizar `app.js` e `index.html`**

- Remover `gift_suggestion: 'Sugestão de presente'` de `FIELD_LABELS`.
- Remover o bloco `if (field === 'gift_suggestion')` de `buildEditRow`.
- Remover a coluna `<th scope="col">Sugestão de presente</th>`.

- [x] **Step 5: Rodar testes e checagem de sintaxe**

```bash
node --test
node --check app.js
node --check lib.js
```

Expected: todos os testes passando, sem erros de sintaxe.

- [x] **Step 6: Commit**

```bash
git add lib.js app.js index.html tests/lib.test.js
git commit -m "feat: remove sugestao de presente da interface"
```

---

### Task 2: Novo visual e decoração

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Interfaces:**
- Consumes: contrato de IDs existente (`person-select`, `status`,
  `participants-table`, `participants-body`, `empty-state`, `actions-header`).
- Produces: classes decorativas e de layout consumidas apenas pelo CSS.

- [x] **Step 1: Adicionar fontes e marcação decorativa**

No `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Nunito+Sans:wght@400;600;700&display=swap"
  rel="stylesheet"
>
```

No `<body>`, adicionar:

- Um SVG oculto com o símbolo `#tree-silhouette`.
- `<div class="bg-decor">` com quatro `<svg class="bg-tree ...">` usando o
  símbolo.
- Uma pequena árvore dentro do estado vazio.
- Um rodapé com o texto "Feito com carinho para a Família Garbrecht".
- `<div class="corner-tree" aria-hidden="true">` com o SVG da árvore animada:
  tronco, três camadas, estrela e luzes (`circle.bulb`).
- Todos os elementos decorativos com `aria-hidden="true"` e `focusable="false"`.

- [x] **Step 2: Reescrever o CSS**

Aplicar:

- Paleta: `--bg: #f7f0e4`, `--surface: #fffdf8`, `--text: #22362b`,
  `--green: #1f5a3f`, `--green-deep: #123d2a`, `--red: #a33a35`,
  `--gold: #c39a56`, `--border: #e4d8c8`.
- Fraunces em títulos e nomes; Nunito Sans no restante.
- Fundo com gradientes radiais suaves.
- Cartões com raio de 22px, bordas quentes e sombras macias.
- Cabeçalho de tabela em tom quente e texto verde.
- Hover de linha, linha selecionada em verde-claro e edição com contorno verde.
- Botão principal cranberry e secundário verde com borda.
- Status em formato de pílula.
- Rodapé com ornamento dourado.
- `.bg-decor` fixo, atrás do conteúdo, com árvores em `opacity` entre 0.06 e
  0.10, escondido abaixo de 980px.
- `.corner-tree` fixo no canto inferior direito, com animação `twinkle` de
  2.8s nas luzes, `pointer-events: none` e tamanho menor no celular.
- `@media (prefers-reduced-motion: reduce)` desliga a animação e mantém as
  luzes acesas.
- Reservar espaço inferior para a árvore fixa não cobrir conteúdo.
- Remover a regra `td:nth-child(7) { min-width: 13rem; }`, que pertencia à
  sugestão; manter `td:nth-child(6)` para interesses.
- No breakpoint de 760px, manter a transformação da tabela em cartões e
  esconder as árvores laterais.

- [x] **Step 3: Verificar localmente**

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000` e conferir:

- Estado vazio com árvore decorativa.
- Nenhuma coluna de sugestão.
- Árvore do canto visível e animada.
- Layout mobile em 390px sem overflow.
- Redução de movimento desativa a animação.

- [x] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "feat: aplica visual natalino acolhedor"
```

---

### Task 3: Verificação e publicação

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-10-27-amigo-secreto-design.md` (se necessário)
- Modify: `docs/superpowers/plans/2026-10-27-redesign-natalino.md` (checkboxes)

**Interfaces:**
- Consumes: site local/publicado e projeto Supabase existente.
- Produces: versão validada e publicada.

- [x] **Step 1: Rodar testes e checagens**

```bash
node --test
node --check lib.js
node --check app.js
git diff --check
```

Expected: 9 testes passando, sem erros de sintaxe ou whitespace.

- [x] **Step 2: Testar no navegador com dados simulados**

Usar Playwright temporário em `/tmp/opencode/pw`:

- Interceptar GET/PATCH do Supabase com dois participantes de teste.
- Confirmar que a tabela não tem "Sugestão de presente".
- Selecionar um nome e confirmar exatamente cinco inputs.
- Salvar e inspecionar o corpo do PATCH: deve conter apenas os cinco campos.
- Confirmar mensagem de sucesso e retorno ao modo leitura.
- Confirmar confirmação ao trocar de pessoa com edição pendente.
- Confirmar erro de salvamento mantendo os campos.
- Confirmar `.corner-tree` visível e `animationName` ativo.
- Criar contexto com `reducedMotion: 'reduce'` e confirmar animação desligada.
- Confirmar árvores laterais visíveis no desktop e ocultas no mobile.
- Confirmar ausência de overflow horizontal em 390px.
- Salvar screenshots de desktop, mobile e estado vazio e revisar.

- [x] **Step 3: Atualizar o README**

- Remover a sugestão de presente da descrição, funcionalidades, uso e checklist.
- Atualizar a contagem de campos para cinco.
- Documentar que `gift_suggestion` permanece no banco como coluna legada.
- Manter instruções de Supabase, segurança, testes e deploy.
- Registrar a URL publicada.

- [x] **Step 4: Commit, push e aguardar o GitHub Pages**

```bash
git add README.md docs/
git commit -m "docs: atualiza documentacao do redesenho"
git push
```

Aguardar o build do Pages e validar `https://gabgar1.github.io/amigo-secreto/`.

- [x] **Step 5: Validação final**

- Abrir a URL publicada.
- Confirmar que o estado vazio e as decorações carregam.
- Confirmar que o fluxo de edição funciona com os dados reais existentes.
- Confirmar que nenhum dado do Supabase foi alterado pela reformulação.

---

## Self-Review

- **Cobertura:** remoção da sugestão (Task 1), visual e decoração (Task 2),
  animação e acessibilidade (Task 2), testes e publicação (Task 3).
- **Consistência:** os cinco campos de `TEXT_FIELDS` coincidem com
  `FIELD_LABELS`, com as colunas da tabela e com o README.
- **Sem placeholders:** valores de cor, fontes, breakpoints e comandos estão
  definidos; o banco permanece intocado.
- **Risco principal:** a árvore fixa pode cobrir conteúdo; mitigado com
  `pointer-events: none`, tamanho reduzido e espaço reservado no rodapé.
