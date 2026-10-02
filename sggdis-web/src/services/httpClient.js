import { leerSesion, limpiarSesion, renovarSesion } from '../modules/auth/services/authService';

export async function solicitarJson(url, opciones) {
  try {
    const token = leerSesion()?.token ?? null;
    const headers = new Headers(opciones?.headers ?? {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const opcionesPeticion = { ...opciones, headers };
    let respuesta = await fetch(url, opcionesPeticion);
    if (respuesta.status === 401 && token && !url.includes('/api/auth/')) {
      const sesionRenovada = await renovarSesion();
      if (sesionRenovada) {
        headers.set('Authorization', `Bearer ${sesionRenovada.token}`);
        respuesta = await fetch(url, opcionesPeticion);
      } else {
        limpiarSesion();
      }
    }
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => null);
      throw new Error(cuerpo?.mensaje ?? cuerpo?.title ?? 'La solicitud no pudo completarse.');
    }
    return respuesta.status === 204 ? null : await respuesta.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servicio.', { cause: error });
    }
    throw error;
  }
}