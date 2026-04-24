# CLAUDE.md — Skolyo ERP (Redesign de Front-end)

> Instruções para o Claude Code implementar esta nova interface no codebase existente.

## Contexto

Backend **já existe e funciona**, incluindo autenticação, rotas e multi-tenant por slug. Você **não vai mexer no backend**. Sua tarefa é substituir a UI antiga por esta nova, mantendo toda a lógica, contratos de API, roles e redirecionamentos já implementados.

**Stack atual (detectada em `uploads/Login.jsx`):** React + React Router + Axios. Continue nessa stack. Se o projeto usa Vite, mantenha Vite; se CRA, mantenha CRA. Não migre para Next.

## Arquivos de referência

Na pasta `references/` deste handoff estão os **protótipos em HTML/JSX (vanilla, sem build)** que servem como *design reference*. Eles **não são código de produção**. Sua missão é recriá-los como componentes React reais no codebase, seguindo as convenções já existentes (pastas, router, hooks, axios instance, etc.).

Arquivos-chave:

- `references/Login.html` — tela de login (split-screen)
- `references/Skolyo ERP.html` — shell + todas as telas do ERP (Início, Acadêmico, Pessoas)
- `references/styles.css` — **fonte única dos design tokens e primitivas visuais**
- `references/components/*.jsx` — cada módulo como um componente React separado, já ilustrando a divisão esperada no codebase
- `references/assets/skolyo-logo.svg` — logo oficial

**Leia `styles.css` por inteiro antes de começar.** Todos os tokens (cores, tipografia, espaçamento, sombras, componentes base como `.btn`, `.card`, `.pill`, `.table`, `.kpi`, `.row-chip`, `.drawer`) estão definidos ali. Replique esses tokens como CSS variables ou um arquivo de tema — não reinvente.

## Fidelidade

**Alta fidelidade (hi-fi).** Os protótipos são pixel-perfect: cores, tipografia e espaçamentos são finais. Recrie-os fielmente. Se precisar adaptar por limitações do stack existente, mantenha os **tokens** idênticos e ajuste apenas a implementação.

## Sistema de design (resumo)

### Paleta

Tema claro (default):
```
--bg:        #F5F1EA   /* fundo geral, creme */
--panel:     #FFFFFF   /* cartões, painéis */
--panel-2:   #FAF7F0   /* cartões secundários, hovers */
--ink:       #1A1F1C   /* texto principal e superfícies escuras */
--ink-2:     #5B625E   /* texto secundário */
--ink-3:     #8A908B   /* texto terciário, labels */
--ink-4:     #B8BCB9   /* hints, placeholders */
--line:      #E8E2D6   /* bordas */
--line-2:    #D4CDBE   /* bordas fortes */
--accent:    #2F7F5E   /* verde Skolyo */
--accent-ink:#1F5540   /* verde hover/links */
--accent-soft: rgba(47,127,94,0.08)
--ok:   #2F7F5E
--warn: #C88C3C
--err:  #A8473A
```

Tema escuro (`data-theme="dark"` no root):
```
--bg:     #0D1512
--panel:  #142019
--panel-2:#1A2821
--ink:    #E8E0CC
--ink-2:  #A8B0A9
--ink-3:  #7A827D
--line:   rgba(232,224,204,0.08)
```

### Tipografia

Três famílias via Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

- `--font-sans: 'Inter Tight'` — UI geral, corpo de texto, tabelas
- `--font-display: 'Instrument Serif'` — títulos de página, KPIs grandes, tagline do login (dá o tom editorial)
- `--font-mono: 'JetBrains Mono'` — labels, códigos, breadcrumbs, metadados

### Escala e rítmo

- Border radius: 4/6/8/10/12 (cartões geralmente 8 ou 10; pílulas 999)
- Body: 14px | label mono: 10–11px + `letter-spacing: 0.14em` + `text-transform: uppercase`
- Título de página: `font-display`, 44–48px
- KPI: `font-display`, 28–32px, `font-variant-numeric: tabular-nums`

### Componentes base (em `styles.css`)

- `.btn` / `.btn.primary` / `.btn.sm` — botões
- `.pill` / `.pill--ok|warn|err|info|neutral` — badges de status
- `.card` — painel base
- `.table` — tabelas com header mono uppercase
- `.kpi` / `.kpi-sm` — cards de métrica
- `.role-chip` — chip pílula com dot colorido + label + contagem (filtro de perfil)
- `.drawer` / `.drawer-overlay` / `.drawer-tabs` — drawer lateral com abas (ficha de pessoa)
- `.timeline` + `.tl-item` / `.tl-dot` — timeline vertical
- `.mini-grade` + `.mg-row` — barra de progresso inline com nota
- `.parcelas-mini` — grid 6 colunas de parcelas (pago/pendente)
- `.topnav` + `.subnav` — app shell

**Não crie variações novas sem necessidade.** Use estes primitivos.

## Telas

### 1. Login (`references/Login.html`)

Rota: `/escola/:slug` (mesma rota que o backend já expõe).

Split 50/50:
- **Esquerda (hero, dark):** 3 variações visuais (minimal / grid técnico / geométrico) — no handoff final, **use a variação `minimal`** e deixe as outras como componentes opcionais para futuras campanhas.
- **Direita (form, creme):** badge da escola (nome + inicial + slug), campo login, campo senha com toggle show/hide, checkbox "lembrar 30 dias", link "esqueci minha senha", botão preto "ENTRAR →".

**Lógica a manter (já existe no projeto, ver `references/components/Login.jsx` no uploads antigo do usuário):**
- Carregar nome/cor/logo da escola via slug no mount
- POST `/auth/login` com `{ login, senha, escolaSlug: slug, lembrar }`
- Salvar token/role/nome/id/escolaSlug em localStorage
- Redirecionar por role:
  - `DIRECAO` ou `COORDENACAO` → `/escola/:slug/direcao`
  - `PROFESSOR` → `/escola/:slug/professor`
  - `ALUNO` → `/escola/:slug/aluno`

Mobile: hero some, form ocupa tela toda, logo vai pro topo.

### 2. App Shell (`references/components/AppShell.jsx`)

- **Top nav:** logo Skolyo + nome da escola + tabs de módulos (Início, Acadêmico, Pessoas, Financeiro, Secretaria, Ajustes) + busca global + botão tema claro/escuro + avatar
- **Sub nav:** aparece contextualmente conforme o módulo ativo (ex: em Acadêmico → Turmas, Matérias, Horários, Atrasos, Lançamentos, Boletins)
- **Page header:** eyebrow mono + título serif grande + ações à direita
- Tema claro/escuro via `data-theme` no `<html>`, persistido em localStorage

### 3. Início (`Inicio.jsx`)

Dashboard com KPIs, cards de ação rápida e feed de atividade.

### 4. Acadêmico

- `Turmas.jsx` — lista de turmas, drawer com detalhes
- `Materias.jsx` — catálogo de matérias
- `Horarios.jsx` — grade horária visual
- `Atrasos.jsx` — registro e histórico
- `Lancamentos.jsx` — lançamento de notas e faltas
- `Boletins.jsx` — geração e visualização

### 5. Pessoas

- `Usuarios.jsx` — lista unificada, filtro por perfil com `role-chip`, drawer-ficha com abas (Dados, Acadêmico, Histórico, Financeiro, Turmas, Acesso), modal de novo usuário
- `Responsaveis.jsx` — alunos à esquerda, cards de responsáveis à direita, modais de vínculo

## Roles & permissões

Já existem no backend (`DIRECAO`, `COORDENACAO`, `PROFESSOR`, `ALUNO`). O front deve:

- Esconder módulos sem permissão (ex: professor não vê Financeiro)
- Respeitar o redirecionamento inicial por role
- Mostrar badges de perfil nas listas usando o mapeamento de cor:
  - DIRECAO: `#A8473A`
  - COORDENACAO: `#C88C3C`
  - PROFESSOR: `#2F7F5E`
  - ALUNO: `#3D6F9E`
  - ADMIN/SECRETARIA: `#6B5BA8`

## Estrutura sugerida no codebase

```
src/
  theme/
    tokens.css        ← copie as CSS variables de styles.css
    primitives.css    ← copie .btn, .pill, .card, .table, etc.
  components/
    AppShell/
    Drawer/
    RoleChip/
    Pill/
    KpiCard/
    Timeline/
    MiniGrade/
  pages/
    Login/
    Inicio/
    Academico/
      Turmas/
      Materias/
      ...
    Pessoas/
      Usuarios/
      Responsaveis/
  routes.tsx
```

Se o codebase já tem uma estrutura consolidada, **adapte-se a ela** em vez de impor a de cima.

## Convenções

- Sem emojis na UI.
- Sem ícones inventados — use Lucide ou o set já presente no `Icons.jsx` das referências.
- Numérico sempre `font-variant-numeric: tabular-nums`.
- Labels mono em uppercase + letter-spacing.
- Animações curtas (150–250ms), easing padrão (`cubic-bezier(0.4, 0, 0.2, 1)`).
- Transições de hover em bordas/background, não em transform.
- Drawer entra da direita com slide + overlay fade (ver `@keyframes slideInR` em `styles.css`).

## Checklist de implementação

- [ ] Copiar tokens (CSS variables) e montar tema claro/escuro
- [ ] Importar fontes do Google Fonts
- [ ] Portar primitivas (`btn`, `pill`, `card`, `table`, `kpi`, `role-chip`, `drawer`) como componentes
- [ ] Implementar `AppShell` com top nav + sub nav + toggle de tema
- [ ] Implementar tela de Login (variação `minimal`)
- [ ] Migrar módulos: Início → Acadêmico → Pessoas
- [ ] Rodar side-by-side com UI antiga (feature flag) enquanto valida
- [ ] Remover UI antiga

## O que NÃO fazer

- Não copiar o HTML das referências direto. Elas são protótipos JSX vanilla com Babel in-browser. Reimplemente como componentes React reais.
- Não usar o `tweaks-panel.jsx` em produção — é ferramenta de prototipação.
- Não trocar as fontes. Instrument Serif + Inter Tight + JetBrains Mono é a identidade.
- Não adicionar gradientes coloridos chamativos. A paleta é contida e editorial.
- Não introduzir um novo sistema de ícones. Padronize em Lucide.
