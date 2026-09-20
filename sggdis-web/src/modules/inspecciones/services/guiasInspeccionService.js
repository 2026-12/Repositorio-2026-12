import { API_BASE_URL } from '../config/inspeccion';

// GET interno que devuelve el JSON. Si falla, lanza un mensaje claro en vez
// del error técnico crudo.
async function solicitarJson(url) {
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error('La API respondió con un error.');
    }
    return await respuesta.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // fetch tira TypeError cuando ni siquiera logró conectarse (backend apagado, sin red, etc.).
      throw new Error('No se pudo conectar con el servicio de inspecciones.', { cause: error });
    }
    throw error;
  }
}

// Trae los tipos de establecimiento disponibles para una guía.
export function obtenerTiposEstablecimiento(idGuia) {
  return solicitarJson(`${API_BASE_URL}/api/guias-inspeccion/${idGuia}/tipos-establecimiento`);
}

// Trae una sección con sus ítems. idTipoEstablecimiento es opcional: si se
// manda, el backend valida que esa sección en verdad le aplique a ese tipo.
export function obtenerSeccion(idGuia, codigo, idTipoEstablecimiento = null) {
  const parametros = new URLSearchParams();
  if (idTipoEstablecimiento !== null && idTipoEstablecimiento !== undefined) {
    parametros.set('idTipoEstablecimiento', idTipoEstablecimiento);
  }
  const query = parametros.toString();
  return solicitarJson(
    `${API_BASE_URL}/api/guias-inspeccion/${idGuia}/secciones/${codigo}${query ? `?${query}` : ''}`,
  );
}