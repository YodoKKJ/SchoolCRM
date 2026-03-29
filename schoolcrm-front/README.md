# Skolyo - Frontend

Frontend do **Skolyo**, sistema de gestão escolar (ERP) para escolas particulares de pequeno e médio porte.

## Stack

- **React 19** + **Vite 7**
- **Tailwind CSS 3** para estilização utilitária
- **Lucide React** para ícones
- **Recharts** para gráficos e dashboards
- **Axios** para comunicação com a API
- **React Router DOM 7** com rotas multi-tenant (slug por escola)

## Estrutura

```
src/
  pages/
    LandingSkolyo.jsx      # Landing page institucional (skolyo.com/)
    LandingEscola.jsx      # Landing pública por escola
    Login.jsx              # Login multi-tenant
    DirecaoDashboard.jsx   # Painel da Direção/Coordenação
    ProfessorDashboard.jsx # Painel do Professor
    AlunoDashboard.jsx     # Painel do Aluno
    MasterLogin.jsx        # Login do admin master
    MasterDashboard.jsx    # Painel do admin master
  components/
    SearchSelect.jsx       # Dropdown com busca
  App.jsx                  # Rotas e autenticação
  main.jsx                 # Entry point
```

## Rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Landing page (ou redirect se logado) |
| `/landing` | Público | Landing page institucional |
| `/escola/:slug/login` | Público | Login da escola |
| `/escola/:slug/direcao` | DIRECAO, COORDENACAO | Dashboard administrativo |
| `/escola/:slug/professor` | PROFESSOR | Dashboard do professor |
| `/escola/:slug/aluno` | ALUNO | Dashboard do aluno |
| `/master/login` | Público | Login master |
| `/master` | MASTER | Painel master |

## Desenvolvimento

```bash
# Instalar dependencias
npm install

# Rodar dev server (porta 5173)
npm run dev

# Build de producao
npm run build

# Lint
npm run lint
```

O dev server faz proxy das chamadas de API para `http://localhost:8080` (backend Spring Boot).

## Deploy

O build de produção (`npm run build`) gera a pasta `dist/` que é servida como assets estáticos pelo Spring Boot em produção. O deploy é feito via Railway em `skolyo.com`.
