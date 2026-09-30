import { API_BASE_URL } from '../../inspecciones/config/inspeccion';
import { solicitarJson } from '../../inspecciones/services/httpClient';

const CLAVE_SESION = 'sggdis:sesion';

export function leerSesion() {
  try {
    const sesion = JSON.parse(sessionStorage.getItem(CLAVE_SESION));
    if (!sesion?.token || !sesion?.correo || new Date(sesion.expira) <= new Date()) {
      sessionStorage.removeItem(CLAVE_SESION);
      return null;
    }
    return sesion;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  window.dispatchEvent(new Event('sggdis:session-changed'));
}

export function limpiarSesion() {
  sessionStorage.removeItem(CLAVE_SESION);
  window.dispatchEvent(new Event('sggdis:session-changed'));
}

export async function iniciarSesion(correo, contrasena) {
  const sesion = await solicitarJson(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, contrasena }),
  });
  guardarSesion(sesion);
  return sesion;
}

export async function cerrarSesion() {
  try {
    await solicitarJson(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
  } finally {
    limpiarSesion();
  }
}

