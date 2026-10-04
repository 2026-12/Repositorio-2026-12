import { API_BASE_URL } from '../../../config/api';
import { solicitarJson } from '../../../services/httpClient';

const URL_USUARIOS = `${API_BASE_URL}/api/administracion/usuarios`;

export function obtenerUsuarios() {
  return solicitarJson(URL_USUARIOS);
}

export function obtenerAreas() {
  return solicitarJson(`${URL_USUARIOS}/areas`);
}

export function obtenerRegiones() {
  return solicitarJson(`${URL_USUARIOS}/regiones`);
}

export function actualizarAsignacionUsuario(idUsuario, rol, idArea, idRegion) {
  return solicitarJson(`${URL_USUARIOS}/${idUsuario}/asignacion`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rol, idArea: idArea || null, idRegion: idRegion || null }),
  });
}