// Cliente HTTP compartido: hace la petición, lanza un error con el mensaje real
// del backend si la respuesta no es 2xx, y maneja 204 (sin contenido).
export async function solicitarJson(url, opciones) {
  try {
    const respuesta = await fetch(url, opciones);
    if (!respuesta.ok) {
      const mensaje = await respuesta.text();
      throw new Error(mensaje || 'La API respondió con un error.');
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
