import { API_BASE_URL } from '../config/inspeccion';
import { solicitarJson } from './httpClient';

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

// Envía los datos de cierre y marca la inspección como FINALIZADA. No manda
// el nombre del representante: el backend usa el nombre del establecimiento ya registrado.
export function cerrarInspeccion(idInspeccion, datosCierre) {
  return solicitarJson(`${API_BASE_URL}/api/inspecciones/${idInspeccion}/cierre`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosCierre),
  });
}