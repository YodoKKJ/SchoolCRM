import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

function gitVersion() {
  try {
    // "git describe --tags --always" retorna:
    //   "v2.4.0"          → exatamente na tag
    //   "v2.4.0-3-gabc123" → 3 commits depois da tag v2.4.0
    //   "gabc123"          → sem nenhuma tag ainda
    const raw = execSync('git describe --tags --always', { encoding: 'utf8' }).trim()
    return raw.replace(/^v/, '') // remove o "v" inicial
  } catch {
    return '0.0.0-dev'
  }
}

export default defineConfig({
  define: {
    // Injeta a versão como string literal no bundle.
    // Acesse em qualquer arquivo JS/JSX como: __APP_VERSION__
    __APP_VERSION__: JSON.stringify(gitVersion()),
  },
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8080',
      '/usuarios': 'http://localhost:8080',
      '/turmas': 'http://localhost:8080',
      '/materias': 'http://localhost:8080',
      '/series': 'http://localhost:8080',
      '/vinculos': 'http://localhost:8080',
      '/atrasos': 'http://localhost:8080',
      '/notas': 'http://localhost:8080',
      '/presencas': 'http://localhost:8080',
      '/presenca': 'http://localhost:8080',
      '/aulas': 'http://localhost:8080',
      '/horarios': 'http://localhost:8080',
      '/fin': 'http://localhost:8080',
      '/escolas': 'http://localhost:8080',
      '/relatorios': 'http://localhost:8080',
    }
  }
})
