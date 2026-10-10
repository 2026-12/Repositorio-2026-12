import { agruparPorArticulo } from './agrupacionItems';
import { calcularResumen } from './calculoPuntaje';
import { esVistaCompleta } from './progresoVistas';
import { ESTADO_NO_APLICA } from './opcionesRespuesta';
import { RANGOS_CLASIFICACION } from '../config/inspeccion';

// Suma los puntajes de todas las secciones ya visitadas para el resumen
// total de la inspección (no solo la sección actual).
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

// Valor inicial del formulario de cierre. Sin "nombreRepresentante": ya no
// se le pide al usuario, se usa datos.nombre (capturado en SeleccionEstablecimiento).
export const DATOS_CIERRE_INICIALES = {
  identificacionRepresentante: '',
  observacionesFinales: '',
  ordenSanitaria: false,
};

// Reglas de formato para los campos de identificación del cierre.
// Nombre: solo letras y espacios, incluye acentos, Ñ/ñ y Ü/ü (nombres en español).
// Identificación: solo dígitos (sin guiones ni otros separadores).
export const NOMBRE_INSPECTOR_REGEX = /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]+$/;
export const IDENTIFICACION_REGEX = /^[0-9]+$/;

// Máximo de caracteres de los campos del cierre. Son los mismos tamaños de las
// columnas IDENTIFICACION_REPRESENTANTE VARCHAR2(30) y OBSERVACIONES_FINALES
// VARCHAR2(2000) de INS_INSPECCION, y los que valida el backend al cerrar.
export const LONGITUD_MAXIMA_IDENTIFICACION_REPRESENTANTE = 30;
export const LONGITUD_MAXIMA_OBSERVACIONES_FINALES = 2000;

// Filtra el campo de nombre mientras se escribe: solo letras (con acentos) y espacios.
export function limpiarSoloLetras(valor = '') {
  return valor.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü\s]/g, '');
}

// Filtra un campo de identificación mientras se escribe: solo dígitos.
export function limpiarSoloNumeros(valor = '') {
  return valor.replace(/\D/g, '');
}

// La identidad del inspector viene de su cuenta; en el cierre solo valida la contraparte.
// También revisa los tamaños máximos: el maxLength del input no cubre datos
// restaurados desde localStorage.
export function obtenerCamposCierrePendientes({ identificacionRepresentante, observacionesFinales }) {
  const pendientes = [];

  const idRepresentante = identificacionRepresentante?.trim() ?? '';
  if (!idRepresentante) {
    pendientes.push('Identificación del representante del establecimiento');
  } else if (!IDENTIFICACION_REGEX.test(idRepresentante)) {
    pendientes.push('Identificación del representante del establecimiento (solo se permiten números)');
  } else if (idRepresentante.length > LONGITUD_MAXIMA_IDENTIFICACION_REPRESENTANTE) {
    pendientes.push(
      `Identificación del representante del establecimiento (máximo ${LONGITUD_MAXIMA_IDENTIFICACION_REPRESENTANTE} caracteres)`,
    );
  }

  if ((observacionesFinales?.trim().length ?? 0) > LONGITUD_MAXIMA_OBSERVACIONES_FINALES) {
    pendientes.push(`Observaciones finales (máximo ${LONGITUD_MAXIMA_OBSERVACIONES_FINALES} caracteres)`);
  }

  return pendientes;
}

// Suma los puntos de los ítems en "N/A" para restarlos del máximo
// (si no aplica, no debería contar como falta).
export function calcularPuntosExcluidosPorNoAplica(vistas = [], seccionesCache = {}, respuestas = {}) {
  return vistas.reduce((totalExcluido, vista) => {
    vista.secciones.forEach((seccionRaw) => {
      const seccion = seccionesCache[seccionRaw.codigo];
      if (!seccion) return;
      seccion.items.forEach((item) => {
        if (respuestas[item.idItem]?.estado === ESTADO_NO_APLICA) {
          totalExcluido += item.puntaje;
        }
      });
    });
    return totalExcluido;
  }, 0);
}

// Puntaje máximo real de la inspección: el del tipo de establecimiento,
// menos los puntos de los ítems en "N/A".
export function calcularPuntajeMaximoAjustado(puntajeMaximoTipo, puntosExcluidosPorNoAplica) {
  return Math.max(0, (puntajeMaximoTipo ?? 0) - (puntosExcluidosPorNoAplica ?? 0));
}