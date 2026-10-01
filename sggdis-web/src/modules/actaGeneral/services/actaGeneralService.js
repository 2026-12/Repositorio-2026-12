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

// Guarda (autoguardado) el Apartado IV - Hallazgos de la inspección.
export function guardarHallazgos(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/hallazgos`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idsGuias: datos.idsGuias,
      hallazgos: datos.hallazgos,
    }),
  });
}

// Guarda (autoguardado) el Apartado V - Acciones a seguir.
export function guardarAcciones(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/acciones`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      acciones: datos.acciones,
      motivoReprogramacion: datos.motivoReprogramacion,
      accionOtro: datos.accionOtro,
    }),
  });
}

// Trae el catálogo de guías de inspección (INS_GUIA) para el selector de
// guías aplicables del Apartado IV: [{ idGuia, nombre }].
export function obtenerGuias() {
  return solicitarJson(`${API_BASE_URL}/api/guias-inspeccion`);
}

// Descarta el acta en curso (el inspector salió sin terminarla desde
// "Volver al menú"), para que no quede ocupando un folio a medio llenar.
export function eliminarActaGeneral(idActa) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}`, {
    method: 'DELETE',
  });
}
