import { API_BASE_URL } from '../../inspecciones/config/inspeccion';
import { solicitarJson } from '../../inspecciones/services/httpClient';

const URL_USUARIOS = `${API_BASE_URL}/api/administracion/usuarios`;

export function obtenerUsuarios() {
  return solicitarJson(URL_USUARIOS);
}

export function obtenerAreas() {
  return solicitarJson(`${URL_USUARIOS}/areas`);
}

export function crearUsuarioAdministrador({ correo, contrasena, rol, idArea }) {
  return solicitarJson(URL_USUARIOS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, contrasena, rol, idArea: idArea || null }),
  });
}

export function actualizarAsignacionUsuario(idUsuario, rol, idArea) {
  return solicitarJson(`${URL_USUARIOS}/${idUsuario}/asignacion`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rol, idArea: idArea || null }),
  });
}