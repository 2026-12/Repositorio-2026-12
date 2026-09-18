import { defineConfig } from 'cypress'

// Apunta al servidor de desarrollo de Vite (npm run dev). El backend debe
// estar corriendo aparte (Visual Studio) porque estas son pruebas E2E
// reales contra la API y la base de datos, no simuladas.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: false,
  },
})
