import { API_BASE_URL } from '../config/inspeccion';

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

export function crearInspeccion({ idGuia, idTipoEstablecimiento, nombreEstablecimiento, consecutivo, fecha }) {
  return solicitarJson(`${API_BASE_URL}/api/inspecciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idGuia, idTipoEstablecimiento, nombreEstablecimiento, consecutivo, fecha }),
  });
}

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
