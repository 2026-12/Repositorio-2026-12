// Validación del Apartado VI (Cierre de la inspección). Mismo formato que
// los demás apartados: un objeto plano { campo: mensaje } solo con lo que
// falla. Los errores de cada persona presente usan una clave propia por
// persona y campo (ver clavePersona), así el mecanismo común de
// useActaGeneral (bloquear la salida, indicador completo/pendiente, limpiar
// el error al editar) funciona igual que con un formulario de campos fijos.

import { esSoloNumeros, MENSAJE_SOLO_NUMEROS } from './validacionInfoGeneral';

// Campos de cada persona presente y su mensaje cuando están vacíos.
const MENSAJES_CAMPOS_PERSONA = {
  nombreCompleto: 'El nombre completo es obligatorio.',
  cargoInstitucion: 'El cargo o institución es obligatorio.',
  numeroIdentificacion: 'El número de identificación es obligatorio.',
  firma: 'La firma es obligatoria.',
};

// Clave del error de un campo de una persona, ej. "persona-3-firma".
export function clavePersona(idPersona, campo) {
  return `persona-${idPersona}-${campo}`;
}

export function validarCierre(datos) {
  const errores = {};
  const personas = datos.personasPresentes ?? [];

  if (personas.length === 0) {
    errores.personasPresentes = 'Debe agregar al menos una persona presente.';
  }

  personas.forEach((persona) => {
    Object.entries(MENSAJES_CAMPOS_PERSONA).forEach(([campo, mensaje]) => {
      if (!persona[campo]?.trim()) {
        errores[clavePersona(persona.id, campo)] = mensaje;
      } else if (campo === 'numeroIdentificacion' && !esSoloNumeros(persona[campo])) {
        errores[clavePersona(persona.id, campo)] = MENSAJE_SOLO_NUMEROS;
      }
    });
  });

  return errores;
}
