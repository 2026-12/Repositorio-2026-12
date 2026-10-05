// Barrel liviano (sin arrastrar OrdenSanitariaModulo, que se carga de forma
// perezosa) para que el shell de la app (routing.jsx) pueda consultar si hay
// una Orden Sanitaria pendiente sin descargar todo el módulo.
export { existeProgresoOrdenSanitaria } from './services/progresoOrdenSanitariaService';
