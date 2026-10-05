import { API_BASE_URL } from '../../../config/api';
import { solicitarJson } from '../../inspecciones/services/httpClient';

export function crearOrdenSanitaria(datos) {
  return solicitarJson(`${API_BASE_URL}/api/ordenes-sanitarias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
}

export function obtenerOrdenSanitaria(idOrdenSanitaria) {
  return solicitarJson(`${API_BASE_URL}/api/ordenes-sanitarias/${idOrdenSanitaria}`);
}

export function obtenerOrdenesPorInspeccion(idInspeccion) {
  return solicitarJson(`${API_BASE_URL}/api/ordenes-sanitarias/inspeccion/${idInspeccion}`);
}