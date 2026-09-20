import { agruparPorArticulo } from './agrupacionItems';
import { calcularResumen } from './calculoPuntaje';
import { esVistaCompleta } from './progresoVistas';
import { RANGOS_CLASIFICACION } from '../config/inspeccion';

// Suma los puntajes de TODAS las secciones ya visitadas (cacheadas) para obtener
// el resumen total de la inspección, no solo el de la sección actual.
export function calcularResumenTotal(vistas = [], seccionesCache = {}, respuestas = {}) {
  return vistas.reduce((total, vista) => {
    vista.secciones.forEach((seccionRaw) => {
      const seccion = seccionesCache[seccionRaw.codigo];
      if (!seccion) return;
      const grupos = agruparPorArticulo(seccion.items);
      const resumenSeccion = calcularResumen(grupos, respuestas);
      total.obtenidos += resumenSeccion.obtenidos;
      total.maximo += resumenSeccion.maximo;
      total.criticosIncumplidos += resumenSeccion.criticosIncumplidos;
    });
    return total;
  }, { obtenidos: 0, maximo: 0, criticosIncumplidos: 0 });
}

// Porcentaje de cumplimiento = puntaje obtenido / puntaje máximo del tipo de
// establecimiento (INS_TIPO_ESTABLECIMIENTO.PUNTAJE_MAXIMO, ya existente en BD).
export function calcularPorcentajeCumplimiento(puntajeObtenido, puntajeMaximoTipo) {
  if (!puntajeMaximoTipo) return 0;
  const porcentaje = (puntajeObtenido / puntajeMaximoTipo) * 100;
  return Math.max(0, Math.min(100, Math.round(porcentaje * 100) / 100));
}

// Clasifica el porcentaje de cumplimiento según los rangos del Art. 65.
export function clasificarPorcentaje(porcentaje) {
  return (
    RANGOS_CLASIFICACION.find((rango) => porcentaje <= rango.hasta) ??
    RANGOS_CLASIFICACION[RANGOS_CLASIFICACION.length - 1]
  );
}

// Todas las vistas (secciones aplicables al tipo de establecimiento) deben
// estar completas antes de habilitar el cierre.
export function todasLasSeccionesCompletas(vistas = [], seccionesCache = {}, respuestas = {}) {
  return vistas.every((vista) => esVistaCompleta(vista, seccionesCache, respuestas));
}

// Devuelve la lista de vistas que todavía tienen ítems sin responder, para
// poder decirle al usuario exactamente cuáles secciones le faltan por cerrar.
export function obtenerVistasIncompletas(vistas = [], seccionesCache = {}, respuestas = {}) {
  return vistas.filter((vista) => !esVistaCompleta(vista, seccionesCache, respuestas));
}

// Valor inicial del formulario de cierre. No incluye "nombreRepresentante":
// ese dato ya no se le pide al usuario, se usa datos.nombre (el nombre del
// establecimiento, capturado al iniciar la inspección en SeleccionEstablecimiento).
export const DATOS_CIERRE_INICIALES = {
  nombreInspector: '',
  identificacionInspector: '',
  identificacionRepresentante: '',
  observacionesFinales: '',
  ordenSanitaria: false,
};

// Reglas de formato para los campos de identificación del cierre.
// Nombre: solo letras y espacios, incluye acentos, Ñ/ñ y Ü/ü (nombres en español).
// Identificación: solo dígitos (sin guiones ni otros separadores).
export const NOMBRE_INSPECTOR_REGEX = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/;
export const IDENTIFICACION_REGEX = /^[0-9]+$/;

// Filtra en tiempo real lo que el usuario escribe en el campo de nombre: deja
// pasar solo letras (con sus variantes en español) y espacios.
export function limpiarSoloLetras(valor = '') {
  return valor.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]/g, '');
}

// Filtra en tiempo real lo que el usuario escribe en un campo de identificación:
// deja pasar solo dígitos.
export function limpiarSoloNumeros(valor = '') {
  return valor.replace(/\D/g, '');
}

// Campos obligatorios y de formato de la sección de cierre.
// Valida: presencia, que el nombre del inspector sea solo letras, que ambas
// identificaciones sean solo números, y que no sean iguales entre sí (no
// tiene sentido que inspector y representante compartan identificación).
export function obtenerCamposCierrePendientes({
  nombreInspector,
  identificacionInspector,
  identificacionRepresentante,
}) {
  const pendientes = [];

  const nombre = nombreInspector?.trim() ?? '';
  if (!nombre) {
    pendientes.push('Nombre del inspector');
  } else if (!NOMBRE_INSPECTOR_REGEX.test(nombre)) {
    pendientes.push('Nombre del inspector (solo se permiten letras y espacios)');
  }

  const idInspector = identificacionInspector?.trim() ?? '';
  if (!idInspector) {
    pendientes.push('Identificación del inspector');
  } else if (!IDENTIFICACION_REGEX.test(idInspector)) {
    pendientes.push('Identificación del inspector (solo se permiten números)');
  }

  const idRepresentante = identificacionRepresentante?.trim() ?? '';
  if (!idRepresentante) {
    pendientes.push('Identificación del representante del establecimiento');
  } else if (!IDENTIFICACION_REGEX.test(idRepresentante)) {
    pendientes.push('Identificación del representante del establecimiento (solo se permiten números)');
  }

  const ambasValidasYPresentes =
    idInspector && idRepresentante &&
    IDENTIFICACION_REGEX.test(idInspector) && IDENTIFICACION_REGEX.test(idRepresentante);

  if (ambasValidasYPresentes && idInspector === idRepresentante) {
    pendientes.push('Identificación del inspector y del representante (no pueden ser iguales)');
  }

  return pendientes;
}

// Suma los puntos de los ítems marcados "N/A" en toda la inspección. Un ítem
// que no aplica no debe contar como falta ni exigirse para llegar al 100%,
// así que sus puntos deben restarse del máximo, no quedarse fijos.
export function calcularPuntosExcluidosPorNoAplica(vistas = [], seccionesCache = {}, respuestas = {}) {
  return vistas.reduce((totalExcluido, vista) => {
    vista.secciones.forEach((seccionRaw) => {
      const seccion = seccionesCache[seccionRaw.codigo];
      if (!seccion) return;
      seccion.items.forEach((item) => {
        if (respuestas[item.idItem]?.estado === 'N/A') {
          totalExcluido += item.puntaje;
        }
      });
    });
    return totalExcluido;
  }, 0);
}

// Puntaje máximo REALMENTE aplicable de la inspección: el fijo del tipo de
// establecimiento, menos los puntos de los ítems marcados "N/A".
export function calcularPuntajeMaximoAjustado(puntajeMaximoTipo, puntosExcluidosPorNoAplica) {
  return Math.max(0, (puntajeMaximoTipo ?? 0) - (puntosExcluidosPorNoAplica ?? 0));
}