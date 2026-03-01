import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8080',
      '/usuarios': 'http://localhost:8080',
      '/turmas': 'http://localhost:8080',
      '/materias': 'http://localhost:8080',
      '/vinculos': 'http://localhost:8080',
      '/atrasos': 'http://localhost:8080',
      '/notas': 'http://localhost:8080',
      '/presencas': 'http://localhost:8080',
      '/horarios': 'http://localhost:8080',
    }
  }
})
