import { API_BASE_URL } from '../config/inspeccion';

async function solicitarJson(url) {
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error('La API respondió con un error.');
    }
    return await respuesta.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servicio de inspecciones.', { cause: error });
    }
    throw error;
  }
}

export function obtenerTiposEstablecimiento(idGuia) {
  return solicitarJson(`${API_BASE_URL}/api/guias-inspeccion/${idGuia}/tipos-establecimiento`);
}

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