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

// Campos obligatorios de la sección de cierre (HU-005I, criterio de aceptación).
export function obtenerCamposCierrePendientes({
  nombreInspector,
  identificacionInspector,
  identificacionRepresentante,
}) {
  const pendientes = [];
  if (!nombreInspector?.trim()) pendientes.push('Nombre del inspector');
  if (!identificacionInspector?.trim()) pendientes.push('Identificación del inspector');
  if (!identificacionRepresentante?.trim()) pendientes.push('Identificación del representante del establecimiento');
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