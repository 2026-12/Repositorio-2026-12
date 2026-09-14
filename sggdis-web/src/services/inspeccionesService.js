import { API_BASE_URL } from '../config/inspeccion';

// Helper interno igual en espíritu al de guiasInspeccionService.js, pero además
// lee el texto del error que manda el backend (para mostrar mensajes como
// "El número consecutivo ya está registrado") y sabe manejar respuestas 204
// (sin contenido), que es lo que devuelven varios de estos endpoints.
// NOTA: esta función está duplicada entre los dos archivos de services/.
// Se podría mover a un solo archivo compartido (ej. services/httpClient.js)
// para no mantener la misma lógica en dos lugares.
async function solicitarJson(url, opciones) {
  try {
    const respuesta = await fetch(url, opciones);
    if (!respuesta.ok) {
      const mensaje = await respuesta.text();
      throw new Error(mensaje || 'La API respondió con un error.');
    }
    return respuesta.status === 204 ? null : await respuesta.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servicio de inspecciones.', { cause: error });
    }
    throw error;
  }
}

// Crea una nueva inspección en el backend y devuelve su id.
export function crearInspeccion({ idGuia, idTipoEstablecimiento, nombreEstablecimiento, consecutivo, fecha }) {
  return solicitarJson(`${API_BASE_URL}/api/inspecciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idGuia, idTipoEstablecimiento, nombreEstablecimiento, consecutivo, fecha }),
  });
}

// Elimina una inspección (y sus respuestas) del backend.
export function eliminarInspeccion(idInspeccion) {
  return solicitarJson(`${API_BASE_URL}/api/inspecciones/${idInspeccion}`, {
    method: 'DELETE',
  });
}

// Convierte el mapa de respuestas del wizard ({ [idItem]: { estado, puntos } })
// al formato de lista que espera el backend.
export function guardarRespuestas(idInspeccion, respuestas) {
  const cuerpo = Object.entries(respuestas).map(([idItem, respuesta]) => ({
    idItem: Number(idItem),
    estado: respuesta.estado,
    puntosOtorgados: respuesta.puntos ?? null,
  }));
  return solicitarJson(`${API_BASE_URL}/api/inspecciones/${idInspeccion}/respuestas`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
}

// Envía los datos de cierre (inspector, identificación del representante,
// observaciones y orden sanitaria) y marca la inspección como FINALIZADA en
// el backend. El nombre del representante no se envía: el backend
// usa el nombre del establecimiento ya registrado.
export function cerrarInspeccion(idInspeccion, datosCierre) {
  return solicitarJson(`${API_BASE_URL}/api/inspecciones/${idInspeccion}/cierre`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosCierre),
  });
}