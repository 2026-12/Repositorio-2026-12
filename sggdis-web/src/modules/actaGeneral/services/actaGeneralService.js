import { solicitarJson } from '../../inspecciones/services/httpClient';
import { API_BASE_URL } from '../config/actaGeneral';

// Crea el acta vacía en el backend y devuelve { idActa, numeroActa }.
export function crearActaGeneral() {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales`, {
    method: 'POST',
  });
}

// Trae el acta guardada (para restaurar el formulario si el usuario vuelve a entrar).
export function obtenerActaGeneral(idActa) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}`);
}

// Guarda (autoguardado) el Apartado I - Información General del Inmueble.
export function guardarInfoGeneral(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/info-general`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fechaInspeccion: datos.fechaInspeccion,
      horaInicio: datos.horaInicio,
      numeroExpediente: datos.numeroExpediente,
      numeroDenuncia: datos.numeroDenuncia,
      nombreComercial: datos.nombreComercial,
      provincia: datos.provincia,
      canton: datos.canton,
      distrito: datos.distrito,
      direccionExacta: datos.direccionExacta,
      telefonoContacto: datos.telefonoContacto,
      correoNotificaciones: datos.correoNotificaciones,
      autorizaIngreso: datos.autorizaIngreso,
      autorizaFotos: datos.autorizaFotos,
    }),
  });
}
