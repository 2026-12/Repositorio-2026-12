// Dice si un apartado del Acta General está vacío con los datos que tiene
// AHORA MISMO (no si alguna vez tuvo datos). Es lo que decide si el
// inspector puede salir de un apartado sin completarlo: mientras esté vacío
// puede navegar libremente; en cuanto tenga algún dato, debe completarlo.
// Si llena un apartado y después borra todo, vuelve a contar como vacío.

// Un valor "tiene dato" si es texto no vacío, una lista con elementos, o un
// valor marcado (por ejemplo Sí/No: true o false, pero no null).
function tieneDato(valor) {
  if (typeof valor === 'string') return valor.trim() !== '';
  if (Array.isArray(valor)) return valor.length > 0;
  return valor !== null && valor !== undefined;
}

// Campos que cuentan para decidir si cada apartado está vacío. En Info
// General no se incluyen la fecha y la hora de inicio: se llenan solas con
// el reloj del dispositivo, así que no indican que el inspector empezó.
const CAMPOS_POR_APARTADO = {
  'info-general': [
    'numeroExpediente',
    'numeroDenuncia',
    'nombreComercial',
    'provincia',
    'canton',
    'distrito',
    'direccionExacta',
    'telefonoContacto',
    'correoNotificaciones',
    'autorizaIngreso',
    'autorizaFotos',
  ],
  responsable: ['nombreResponsable', 'cargoResponsable', 'cargoResponsableOtro', 'numeroIdentificacionResponsable'],
  motivo: ['motivoInspeccion', 'motivoInspeccionOtro'],
  hallazgos: ['idsGuias', 'hallazgos'],
  acciones: ['acciones', 'motivoReprogramacion', 'accionOtro'],
};

const CAMPOS_PERSONA = ['nombreCompleto', 'cargoInstitucion', 'numeroIdentificacion', 'firma'];

export function esApartadoVacio(idApartado, datos) {
  if (!datos) return true;

  // Cierre: una persona agregada con todos sus campos en blanco no cuenta
  // como dato; el apartado está vacío si ninguna persona tiene algo escrito.
  if (idApartado === 'cierre') {
    return !(datos.personasPresentes ?? []).some((persona) =>
      CAMPOS_PERSONA.some((campo) => tieneDato(persona[campo]))
    );
  }

  const campos = CAMPOS_POR_APARTADO[idApartado] ?? [];
  return !campos.some((campo) => tieneDato(datos[campo]));
}
