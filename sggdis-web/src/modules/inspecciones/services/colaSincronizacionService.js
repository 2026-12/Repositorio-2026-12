function obtenerClaveCola() {
  try {
    const sesion = JSON.parse(sessionStorage.getItem('sggdis:sesion'));
    return `sggdis:inspecciones-pendientes-sincronizacion:${encodeURIComponent(sesion?.correo?.toLowerCase() ?? 'anonimo')}`;
  } catch {
    return 'sggdis:inspecciones-pendientes-sincronizacion:anonimo';
  }
}

function obtenerCola() {
  const valor = localStorage.getItem(obtenerClaveCola());
  return valor ? JSON.parse(valor) : [];
}

export function obtenerCierrePendiente(idInspeccion) {
  return obtenerCola().find((registro) => registro.idInspeccion === idInspeccion) ?? null;
}

export function encolarCierrePendiente(registro) {
  const cola = obtenerCola().filter((actual) => actual.idInspeccion !== registro.idInspeccion);
  cola.push({ ...registro, estado: 'pendiente de sincronización', actualizado: new Date().toISOString() });
  localStorage.setItem(obtenerClaveCola(), JSON.stringify(cola));
}

export function eliminarCierrePendiente(idInspeccion) {
  const cola = obtenerCola().filter((registro) => registro.idInspeccion !== idInspeccion);
  localStorage.setItem(obtenerClaveCola(), JSON.stringify(cola));
}
