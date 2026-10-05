import { solicitarJson } from '../../inspecciones/services/httpClient';
import { API_BASE_URL } from '../config/actaGeneral';

// Cuerpo JSON de cada apartado: el mismo lo usan el autoguardado (un PUT por
// apartado) y el envío del acta (todos los apartados juntos).
function construirCuerpoInfoGeneral(datos) {
  return {
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
  };
}

function construirCuerpoResponsable(datos) {
  return {
    nombreResponsable: datos.nombreResponsable,
    cargoResponsable: datos.cargoResponsable,
    cargoResponsableOtro: datos.cargoResponsableOtro,
    numeroIdentificacionResponsable: datos.numeroIdentificacionResponsable,
  };
}

function construirCuerpoMotivo(datos) {
  return {
    motivoInspeccion: datos.motivoInspeccion,
    motivoInspeccionOtro: datos.motivoInspeccionOtro,
  };
}

function construirCuerpoHallazgos(datos) {
  return {
    idsGuias: datos.idsGuias,
    hallazgos: datos.hallazgos,
  };
}

function construirCuerpoAcciones(datos) {
  return {
    acciones: datos.acciones,
    motivoReprogramacion: datos.motivoReprogramacion,
    accionOtro: datos.accionOtro,
  };
}

function construirCuerpoCierre(datos) {
  return {
    personasPresentes: datos.personasPresentes.map((persona) => ({
      nombreCompleto: persona.nombreCompleto,
      cargoInstitucion: persona.cargoInstitucion,
      numeroIdentificacion: persona.numeroIdentificacion,
      firma: persona.firma,
    })),
  };
}

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
    body: JSON.stringify(construirCuerpoInfoGeneral(datos)),
  });
}

// Guarda (autoguardado) el Apartado II - Información del Responsable.
export function guardarResponsable(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/responsable`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(construirCuerpoResponsable(datos)),
  });
}

// Guarda (autoguardado) el Apartado III - Motivo de la inspección.
export function guardarMotivo(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/motivo`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(construirCuerpoMotivo(datos)),
  });
}

// Guarda (autoguardado) el Apartado IV - Hallazgos de la inspección.
export function guardarHallazgos(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/hallazgos`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(construirCuerpoHallazgos(datos)),
  });
}

// Guarda (autoguardado) el Apartado V - Acciones a seguir.
export function guardarAcciones(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/acciones`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(construirCuerpoAcciones(datos)),
  });
}

// Guarda (autoguardado) el Apartado VI - Cierre de la inspección. El "id" de
// cada persona solo existe en el frontend (key de React), no se envía.
export function guardarCierre(idActa, datos) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/cierre`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(construirCuerpoCierre(datos)),
  });
}

// Envía el acta: manda los seis apartados juntos y el backend los guarda en la
// base de datos y la marca como FINALIZADA en un solo paso.
export function enviarActaGeneral(idActa, apartados) {
  return solicitarJson(`${API_BASE_URL}/api/actas-generales/${idActa}/envio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      infoGeneral: construirCuerpoInfoGeneral(apartados.infoGeneral),
      responsable: construirCuerpoResponsable(apartados.responsable),
      motivo: construirCuerpoMotivo(apartados.motivo),
      hallazgos: construirCuerpoHallazgos(apartados.hallazgos),
      acciones: construirCuerpoAcciones(apartados.acciones),
      cierre: construirCuerpoCierre(apartados.cierre),
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
