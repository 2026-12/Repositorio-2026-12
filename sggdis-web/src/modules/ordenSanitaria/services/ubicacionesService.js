import { API_BASE_URL } from '../../../config/api';
import { solicitarJson } from '../../inspecciones/services/httpClient';

const PREFIJO_CACHE = 'sggdis:ubicaciones';

function leerCache(clave) {
  try {
    const valor = localStorage.getItem(clave);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

function guardarCache(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // La aplicación continúa usando la API aunque no haya localStorage.
  }
}

export async function obtenerProvincias() {
  const clave = `${PREFIJO_CACHE}:provincias`;
  const cache = leerCache(clave);

  if (cache) return cache;

  const resultado = await solicitarJson(`${API_BASE_URL}/api/ubicaciones/provincias`);
  guardarCache(clave, resultado);

  return resultado;
}

export async function obtenerCantones(idProvincia) {
  if (!idProvincia) return [];

  const clave = `${PREFIJO_CACHE}:cantones:${idProvincia}`;
  const cache = leerCache(clave);

  if (cache) return cache;

  const resultado = await solicitarJson(`${API_BASE_URL}/api/ubicaciones/provincias/${idProvincia}/cantones`);
  guardarCache(clave, resultado);

  return resultado;
}

export async function obtenerDistritos(idCanton) {
  if (!idCanton) return [];

  const clave = `${PREFIJO_CACHE}:distritos:${idCanton}`;
  const cache = leerCache(clave);

  if (cache) return cache;

  const resultado = await solicitarJson(`${API_BASE_URL}/api/ubicaciones/cantones/${idCanton}/distritos`);
  guardarCache(clave, resultado);

  return resultado;
}