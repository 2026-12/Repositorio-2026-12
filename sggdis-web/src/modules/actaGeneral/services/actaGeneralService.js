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

// Guarda (autoguardado) el Apartado II - Información del Responsable.
export function guardarResponsable(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/responsable`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombreResponsable: datos.nombreResponsable,
      cargoResponsable: datos.cargoResponsable,
      cargoResponsableOtro: datos.cargoResponsableOtro,
      numeroIdentificacionResponsable: datos.numeroIdentificacionResponsable,
    }),
  });
}

// Guarda (autoguardado) el Apartado III - Motivo de la inspección.
export function guardarMotivo(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/motivo`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      motivoInspeccion: datos.motivoInspeccion,
      motivoInspeccionOtro: datos.motivoInspeccionOtro,
    }),
  });
}
