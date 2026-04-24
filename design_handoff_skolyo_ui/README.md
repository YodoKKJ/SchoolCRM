# Handoff: Skolyo ERP — Novo Front-end

## Overview

Este pacote contém o **redesign completo da UI do Skolyo ERP**. O backend já existe e está funcionando em produção (autenticação multi-tenant por slug, roles DIREÇÃO/COORDENAÇÃO/PROFESSOR/ALUNO, endpoints acadêmicos, financeiros e de pessoas). A missão é substituir a UI antiga por esta nova, **preservando toda a lógica de negócio, contratos de API e fluxos já implementados**.

## Sobre os arquivos de design

Os arquivos em `references/` são **protótipos em HTML/JSX vanilla** criados como *design reference* — eles mostram a aparência e o comportamento pretendidos, **não são código de produção**. Sua tarefa é recriá-los no codebase existente (React + React Router + Axios) usando os padrões, pastas e bibliotecas já estabelecidos no projeto.

Você vai encontrar:

- `references/Login.html` — tela de login (auto-contida, 3 variações visuais)
- `references/Skolyo ERP.html` — app shell com Início, Acadêmico e Pessoas
- `references/styles.css` — **fonte única dos design tokens e primitivas CSS**
- `references/components/*.jsx` — cada módulo já dividido em componentes, indicando a organização sugerida
- `references/tweaks-panel.jsx` — helper de prototipação (**não portar para produção**)
- `references/assets/skolyo-logo.svg` — logo oficial

## Fidelidade

**Alta fidelidade.** Cores, tipografia, espaçamentos e interações são finais. Recrie pixel-perfect.

## Leia primeiro

1. **`CLAUDE.md`** (neste mesmo diretório) — guia completo com tokens, componentes, telas, permissões, convenções, checklist e estrutura de pastas sugerida.
2. **`references/styles.css`** — contém todas as CSS variables e componentes base.

## Escopo entregue

- ✅ Login (split-screen com 3 variações — usar `minimal` em produção)
- ✅ App Shell (top nav + sub nav + tema claro/escuro)
- ✅ Início (dashboard)
- ✅ Acadêmico: Turmas, Matérias, Horários, Atrasos, Lançamentos, Boletins
- ✅ Pessoas: Usuários (lista unificada + drawer-ficha com abas) e Responsáveis

## Fora de escopo (ainda em design)

- ⏳ Financeiro (Contratos, Contas a Receber, Contas a Pagar, Inadimplência)
- ⏳ Secretaria
- ⏳ Ajustes

## Como usar com Claude Code

1. Baixe este pacote (já vem com `CLAUDE.md`).
2. Copie a pasta `design_handoff_skolyo_ui/` para a raiz do seu projeto Skolyo (ou guarde separada e referencie).
3. Abra o projeto no Claude Code.
4. Na primeira mensagem, diga algo como:

> Leia `design_handoff_skolyo_ui/CLAUDE.md` e as referências em `design_handoff_skolyo_ui/references/`. Vamos substituir a UI antiga pela nova. Comece portando os design tokens e o AppShell — rode em paralelo com a UI antiga via feature flag até eu validar.

5. Claude Code vai ler, entender o sistema de design e começar a implementar módulo a módulo. Você valida cada etapa antes de ir pra próxima.

## Dicas de migração

- **Comece pelos tokens.** Antes de portar qualquer tela, estabilize o arquivo de tema (cores, tipografia, espaçamento). Isso dá a base consistente pra tudo.
- **Feature flag.** Rode as rotas novas atrás de uma flag (`?ui=next` ou env var) pra poder comparar lado a lado com a UI antiga.
- **Módulo por módulo.** Login → Shell → Início → Acadêmico → Pessoas. Não tente portar tudo de uma vez.
- **Preserve os contratos.** Os hooks/serviços que chamam a API continuam iguais. Mude só o que renderiza.

## Arquivos

```
design_handoff_skolyo_ui/
├── README.md                 ← este arquivo
├── CLAUDE.md                 ← guia técnico completo
└── references/
    ├── Login.html
    ├── Skolyo ERP.html
    ├── styles.css
    ├── tweaks-panel.jsx
    ├── assets/
    │   └── skolyo-logo.svg
    └── components/
        ├── AppShell.jsx
        ├── Icons.jsx
        ├── Inicio.jsx
        ├── Turmas.jsx
        ├── Materias.jsx
        ├── Horarios.jsx
        ├── Atrasos.jsx
        ├── Lancamentos.jsx
        ├── Boletins.jsx
        ├── Usuarios.jsx
        └── Responsaveis.jsx
```
