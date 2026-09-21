import { API_BASE_URL } from '../config/inspeccion';
import { solicitarJson } from './httpClient';

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