import { API_BASE_URL } from '../../../config/api';

const CLAVE_SESION = 'sggdis:sesion';
let renovacionEnCurso = null;

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
  const respuesta = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, contrasena }),
  });
  const sesion = await leerRespuesta(respuesta);
  guardarSesion(sesion);
  return sesion;
}

export async function registrarUsuario(datosRegistro) {
  const respuesta = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datosRegistro),
  });
  return leerRespuesta(respuesta);
}

export function renovarSesion() {
  if (!renovacionEnCurso) {
    renovacionEnCurso = (async () => {
      const respuesta = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (respuesta.status === 401) {
        if (!leerSesion()) limpiarSesion();
        return null;
      }
      const sesion = await leerRespuesta(respuesta);
      guardarSesion(sesion);
      return sesion;
    })().finally(() => {
      renovacionEnCurso = null;
    });
  }
  return renovacionEnCurso;
}

export async function cerrarSesion() {
  const sesion = leerSesion();
  try {
    if (sesion) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${sesion.token}` },
      });
    }
  } finally {
    limpiarSesion();
  }
}

async function leerRespuesta(respuesta) {
  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(cuerpo?.mensaje ?? cuerpo?.title ?? 'La solicitud no pudo completarse.');
  }
  return cuerpo;
}

