// Cliente HTTP compartido: hace la petición, lanza un error con el mensaje real
// del backend si la respuesta no es 2xx, y maneja 204 (sin contenido).
export async function solicitarJson(url, opciones) {
  try {
    const token = leerTokenSesion();
    const headers = new Headers(opciones?.headers ?? {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const respuesta = await fetch(url, { ...opciones, headers });
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => null);
      if (respuesta.status === 401 && token) {
        sessionStorage.removeItem('sggdis:sesion');
        window.dispatchEvent(new Event('sggdis:session-changed'));
      }
      throw new Error(cuerpo?.mensaje ?? cuerpo?.title ?? 'La solicitud no pudo completarse.');
    }
    return respuesta.status === 204 ? null : await respuesta.json();
  } catch (error) {
    if (error instanceof TypeError) {
      // fetch tira TypeError cuando ni siquiera logró conectarse (backend apagado, sin red, etc.).
      throw new Error('No se pudo conectar con el servicio de inspecciones.', { cause: error });
    }
    throw error;
  }
}

function leerTokenSesion() {
  try {
    const sesion = JSON.parse(sessionStorage.getItem('sggdis:sesion'));
    return sesion?.token ?? null;
  } catch {
    return null;
  }
}
