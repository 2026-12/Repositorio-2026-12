// Datos de prueba para poder abrir /orden-sanitaria directamente mientras se
// desarrolla, sin tener que pasar por el flujo completo de cerrar una
// inspección real. Solo se usa en modo desarrollo (ver rutas.jsx) y nunca se
// incluye en el build de producción porque `import.meta.env.DEV` se reemplaza
// por `false` y el bloque que la usa queda eliminado al compilar.
export const inspeccionPruebaOrdenSanitaria = {
  idInspeccion: 2, // se coloca lo que genera el select
  consecutivo: 'MS-DRRSCS-ARS-SJ-AI-0002-2026',
  nombreEstablecimiento: 'Restaurante El Buen Sabor',
  nombrePersonaNotificar: 'Juan Carlos Rodríguez Mora',
  identificacionPersonaNotificar: '1-1234-5678',
  tipoEstablecimiento: 'Servicio de Alimentación al Público',
};
