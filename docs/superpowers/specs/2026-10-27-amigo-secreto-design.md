# Site de Amigo Secreto da Família Garbrecht — Especificação

**Data:** 2026-10-27
**Status:** Design aprovado

## 1. Objetivo

Oferecer uma página única, compartilhada pela família, onde todos consultam os
tamanhos, preferências e sugestões de presente dos participantes do amigo
secreto. Cada pessoa seleciona o próprio nome e atualiza somente a sua linha.

## 2. Escopo

### Incluído

- Página única com uma tabela de participantes.
- Seletor de identidade ("Quem é você?").
- Edição da linha da pessoa selecionada, diretamente na tabela.
- Persistência compartilhada no Supabase.
- Layout responsivo, com tabela em telas grandes e cartões em telas pequenas.
- Estados de carregamento, lista vazia e erro.

### Fora do escopo

- Login, senhas ou autenticação individual.
- Cadastro ou exclusão de participantes pela página.
- Atualização em tempo real.
- Notificações, histórico de alterações ou sorteio do amigo secreto.
- Domínio próprio, banco de dados próprio ou infraestrutura paga.

## 3. Decisões técnicas

| Área | Decisão |
| --- | --- |
| Frontend | HTML, CSS e JavaScript puros, sem etapa de build |
| SDK | `@supabase/supabase-js@2` importado via CDN ESM |
| Banco | Supabase (PostgreSQL + API REST + RLS), plano gratuito |
| Hospedagem | GitHub Pages, branch `main`, raiz do repositório |
| Atualização | Ao recarregar a página |
| Identidade | Seleção do nome, sem autenticação (modelo de confiança) |
| Lista de nomes | Fixa, mantida pelo Table Editor do Supabase |
| Testes | `node --test` para funções puras e checklist manual de integração |

O frontend não usa `npm` em produção. O `package.json` existe apenas para
declarar módulos ES e o script de testes, sem dependências.

## 4. Arquitetura

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
├── .gitignore
└── docs/superpowers/
    ├── specs/2026-10-27-amigo-secreto-design.md
    └── plans/2026-10-27-amigo-secreto.md
```

- `index.html`: estrutura semântica, seletor, tabela e estados vazios.
- `styles.css`: tema natalino discreto, foco visível e layout responsivo.
- `lib.js`: funções puras (ordenação, normalização, validação de configuração).
- `app.js`: cliente Supabase, estado da tela e manipulação do DOM.
- `config.js`: URL do projeto e chave anônima pública do Supabase.
- `supabase/schema.sql`: tabela, RLS, políticas e permissões.
- `tests/lib.test.js`: testes das funções puras com o runner nativo do Node.

## 5. Modelo de dados

Tabela `public.participants`:

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | `uuid` | Chave primária, gerada por `gen_random_uuid()` |
| `name` | `text` | Obrigatório, único, não editável pela aplicação |
| `pants_size` | `text` | Tamanho de calça; padrão vazio |
| `shirt_size` | `text` | Tamanho de camiseta; padrão vazio |
| `shoe_size` | `text` | Numeração de calçado; padrão vazio |
| `favorite_color` | `text` | Cor favorita; padrão vazio |
| `interests` | `text` | Interesses; padrão vazio |
| `gift_suggestion` | `text` | Uma frase com até 200 caracteres; padrão vazio |

Todos os campos de informação são texto livre, inclusive os tamanhos, para
aceitar variações como "GG", "38/39" ou "M".

## 6. Segurança e privacidade

- RLS habilitada em `participants`.
- A chave anônima pode apenas ler e atualizar os seis campos de informação.
- Inserção, exclusão e alteração de `name`/`id` são negadas.
- A chave anônima é pública por natureza e fica versionada em `config.js`.
- A chave `service_role` nunca é usada no frontend.
- Não há autenticação: qualquer pessoa com o link e a chave pode editar os
  campos de informação pela API. A restrição à própria linha existe apenas na
  interface, conforme o modelo de confiança familiar aprovado.
- A página inclui `<meta name="robots" content="noindex, nofollow">` para
  desencorajar indexação por buscadores.
- No plano gratuito, repositórios do GitHub Pages precisam ser públicos. Os
  dados ficam no Supabase, não no repositório.

## 7. Fluxos

### Carregar

1. Validar `SUPABASE_URL` e `SUPABASE_ANON_KEY` em `config.js`.
2. Buscar todos os registros com `select('*')`.
3. Ordenar alfabeticamente com `localeCompare('pt-BR', { sensitivity: 'base' })`.
4. Renderizar a tabela e preencher o seletor.
5. Se não houver registros, mostrar o estado vazio e desabilitar o seletor.
6. Se a busca falhar, mostrar mensagem de erro e oferecer "Tentar novamente".

### Editar e salvar

1. Selecionar um nome transforma apenas aquela linha em campos de texto.
2. O nome permanece fixo; os seis campos de informação são editáveis.
3. "Salvar" normaliza os valores (trim e frase única) e executa um `UPDATE`
   pelo `id`, retornando a linha atualizada.
4. Em sucesso: atualizar o estado local, sair da edição, limpar o seletor e
   anunciar "Informações salvas com sucesso.".
5. Em erro: manter a edição e mostrar uma mensagem clara.
6. "Cancelar" descarta as alterações.
7. Trocar de pessoa com alterações pendentes pede confirmação.

### Concorrência

Não há tempo real. A última gravação vence; como cada pessoa edita a própria
linha, conflitos são improváveis. Os demais veem as mudanças ao recarregar.

## 8. Interface

- Cabeçalho com título e instrução curta.
- Seletor "Quem é você?" com a opção inicial "Selecione seu nome".
- Tabela com as colunas Nome, Calça, Camiseta, Pé, Cor favorita, Interesses,
  Sugestão de presente e Ações.
- Valores vazios são exibidos como "—".
- Linha selecionada destacada; em edição, os campos viram `input`s com
  `aria-label` e os botões Salvar/Cancelar aparecem na coluna Ações.
- Em telas com até 760px, cada linha vira um cartão empilhado, com rótulos
  visíveis por campo.
- Mensagens de status usam `role="status"` e `aria-live="polite"`.
- Tema claro com tons discretos de vermelho e verde, foco visível e alvos de
  toque de pelo menos 44px.
- Todo texto vindo do banco é inserido com `textContent` (nunca `innerHTML`).

## 9. Erros e mensagens

- Configuração ausente/inválida: orientação para preencher `config.js`.
- Falha de carregamento: mensagem + botão "Tentar novamente".
- Falha ao salvar: mensagem de erro, linha permanece em edição.
- Lista vazia: instrução para cadastrar nomes no Supabase.

## 10. Verificação

Automatizada:

```bash
node --test
node --check lib.js
node --check app.js
```

Manual:

- Carregar a página com e sem participantes.
- Ordenação alfabética correta em português.
- Selecionar um nome e editar somente a linha dele.
- Salvar, recarregar e confirmar a persistência.
- Cancelar e confirmar o descarte.
- Trocar de pessoa com edição pendente e ver a confirmação.
- Testar em largura de 360px.
- Simular falha de rede e usar "Tentar novamente".
- Com a chave anônima: `SELECT` e `UPDATE` permitidos; `INSERT`, `DELETE` e
  alteração de `name` negados.

## 11. Implantação e operação

1. Criar projeto gratuito no Supabase.
2. Executar `supabase/schema.sql` no SQL Editor.
3. Copiar Project URL e chave `anon public` para `config.js`.
4. Cadastrar os nomes no Table Editor.
5. Publicar no GitHub Pages a partir da branch `main` (raiz).
6. URL final: `https://<usuario>.github.io/amigo-secreto/`.

Projetos gratuitos do Supabase podem ser pausados por inatividade; nesse caso,
basta restaurá-los no painel. O README documenta todo o processo.

## 12. Critérios de aceite

- Uma única página com tabela, uma linha por familiar e todos os campos.
- Seletor de nome e edição restrita à linha selecionada na interface.
- Dados persistidos e compartilhados após recarregar.
- Layout legível em celular.
- Estados de carregamento, vazio e erro funcionando.
- Hospedagem e banco sem custo.
- Configuração e manutenção documentadas no README.
