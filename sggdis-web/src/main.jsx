// Punto de entrada de la aplicación React: monta el componente App dentro
// del elemento con id "root" (definido en index.html).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)