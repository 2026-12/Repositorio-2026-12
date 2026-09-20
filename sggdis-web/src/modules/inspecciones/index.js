// API pública del módulo de inspecciones: el shell de la app (App.jsx) solo
// necesita este componente para arrancar el flujo completo de una inspección.
export { default as InspeccionModulo } from './InspeccionModulo';
export { existeProgresoGuardado } from './services/progresoInspeccionService';
