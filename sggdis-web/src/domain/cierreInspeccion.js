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

export function obtenerVistasIncompletas(vistas = [], seccionesCache = {}, respuestas = {}) {
  return vistas.filter((vista) => !esVistaCompleta(vista, seccionesCache, respuestas));
}

// Campos obligatorios de la sección de cierre (HU-005I, criterio de aceptación).
export function obtenerCamposCierrePendientes({
  nombreInspector,
  identificacionInspector,
  nombreRepresentante,
  identificacionRepresentante,
}) {
  const pendientes = [];
  if (!nombreInspector?.trim()) pendientes.push('Nombre del inspector');
  if (!identificacionInspector?.trim()) pendientes.push('Identificación del inspector');
  if (!nombreRepresentante?.trim()) pendientes.push('Nombre del representante del establecimiento');
  if (!identificacionRepresentante?.trim()) pendientes.push('Identificación del representante del establecimiento');
  return pendientes;
}

// Valor inicial del formulario de cierre; vive 100% en el cliente (localStorage
// vía progresoInspeccionService), no se envía al backend.
export const DATOS_CIERRE_INICIALES = {
  nombreInspector: '',
  identificacionInspector: '',
  nombreRepresentante: '',
  identificacionRepresentante: '',
  observacionesFinales: '',
  ordenSanitaria: false,
};