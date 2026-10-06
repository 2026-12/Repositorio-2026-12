import { defineConfig } from 'cypress'

// Apunta al servidor de desarrollo de Vite (npm run dev). El backend debe
// estar corriendo aparte (Visual Studio) porque estas son pruebas E2E
// reales contra la API y la base de datos, no simuladas.
export default defineConfig({
  // Con `npx cypress run` graba un video de cada spec (cypress/videos) y las
  // capturas quedan en cypress/screenshots, como evidencia de las pruebas.
  video: true,
  // Esperas más holgadas: son pruebas reales contra la API y Oracle, que a
  // veces tardan más de los 4 s por defecto (sobre todo el primer guardado).
  defaultCommandTimeout: 8000,
  requestTimeout: 15000,
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: false,
    // Por defecto Cypress sube cada elemento al borde superior de la pantalla,
    // donde quedaría tapado por los tabs fijos de arriba o por la barra
    // inferior fija del acta ("element is covered by..."). Centrarlo lo evita.
    scrollBehavior: 'center',
  },
})
