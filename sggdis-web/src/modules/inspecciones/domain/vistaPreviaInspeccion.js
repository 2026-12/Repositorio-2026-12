import { agruparPorArticulo } from './agrupacionItems';
import { calcularResumen } from './calculoPuntaje';
import {
  calcularPorcentajeCumplimiento,
  calcularPuntajeMaximoAjustado,
  calcularPuntosExcluidosPorNoAplica,
  calcularResumenTotal,
  clasificarPorcentaje,
} from './cierreInspeccion';
import { ESTADO_CUMPLE, ESTADO_NO_APLICA, ESTADO_NO_CUMPLE } from './opcionesRespuesta';
import {
  nombresVistas,
  TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS,
} from '../inspeccionAlimentos/config/inspeccionAlimentos';

const CODIGOS_VISTA_COMPUESTA = {
  B1: 'B',
  B2: 'B',
  B3: 'B',
  C1: 'C',
  C2: 'C',
};

function obtenerVistasDocumento(datos, vistas, seccionesCache) {
  const resultado = (vistas ?? []).map((vista) => ({ ...vista, secciones: [...vista.secciones] }));
  const codigosIncluidos = new Set(resultado.flatMap((vista) => vista.secciones.map((seccion) => seccion.codigo)));

  const seccionesDisponibles = [
    ...(datos.secciones ?? []),
    ...Object.values(seccionesCache),
  ];
  seccionesDisponibles.forEach((seccion) => {
    const codigo = seccion.codigo;
    const codigoVista = CODIGOS_VISTA_COMPUESTA[codigo] ?? codigo;
    if (!codigosIncluidos.has(codigo)) {
      let vista = resultado.find((actual) => actual.codigo === codigoVista);
      if (!vista) {
        vista = { codigo: codigoVista, secciones: [] };
        resultado.push(vista);
      }
      vista.secciones.push(seccion);
      codigosIncluidos.add(codigo);
    }
  });

  return resultado;
}

export function construirVistaPrevia(datos, seccionesCache = {}, respuestas = {}, vistas = []) {
  const vistasDocumento = obtenerVistasDocumento(datos, vistas, seccionesCache);
  const secciones = vistasDocumento.flatMap((vista) => {
    const detalleSecciones = vista.secciones.flatMap((seccionRaw) => {
      const seccion = seccionesCache[seccionRaw.codigo];
      if (!seccion) return [];

      const grupos = agruparPorArticulo(seccion.items ?? []);
      const resumen = calcularResumen(grupos, respuestas);
      const items = grupos.flatMap((grupo) => grupo.items.map((item) => {
        const respuesta = respuestas[item.id];
        const estado = respuesta?.estado;
        return {
          id: item.id,
          texto: item.texto,
          articulo: grupo.articulo,
          estado,
          resultado: estado === ESTADO_CUMPLE
            ? 'Cumple'
            : estado === ESTADO_NO_CUMPLE
              ? 'No cumple'
              : estado === ESTADO_NO_APLICA
                ? 'N/A'
                : 'Sin respuesta',
          puntosObtenidos: estado === ESTADO_CUMPLE ? respuesta.puntos ?? 0 : 0,
          puntosMaximos: item.valor,
          critico: Boolean(item.critico),
          criticoIncumplido: Boolean(item.critico) && estado === ESTADO_NO_CUMPLE,
        };
      }));

      const puntosNoAplicables = items
        .filter((item) => item.estado === ESTADO_NO_APLICA)
        .reduce((total, item) => total + item.puntosMaximos, 0);
      const puntajeMaximo = Math.max(0, resumen.maximo - puntosNoAplicables);

      return [{
        codigo: seccion.codigo ?? seccionRaw.codigo,
        nombre: seccion.nombre ?? seccionRaw.nombre ?? nombresVistas[vista.codigo] ?? `Sección ${seccionRaw.codigo}`,
        items,
        resumen: {
          obtenidos: resumen.obtenidos,
          maximo: puntajeMaximo,
          maximoNominal: resumen.maximo,
          criticosIncumplidos: resumen.criticosIncumplidos,
          porcentaje: calcularPorcentajeCumplimiento(resumen.obtenidos, puntajeMaximo),
          itemsAplicables: items.filter((item) => item.estado !== ESTADO_NO_APLICA).length,
          itemsCumplen: items.filter((item) => item.estado === ESTADO_CUMPLE).length,
        },
      }];
    });

    return detalleSecciones.length > 0
      ? [{
          codigo: vista.codigo,
          nombre: vista.nombre ?? (
            detalleSecciones.length === 1
              ? detalleSecciones[0].nombre
              : nombresVistas[vista.codigo] ?? detalleSecciones[0].nombre
          ),
          secciones: detalleSecciones,
          resumen: detalleSecciones.reduce((total, seccion) => ({
            obtenidos: total.obtenidos + seccion.resumen.obtenidos,
            maximo: total.maximo + seccion.resumen.maximo,
            criticosIncumplidos: total.criticosIncumplidos + seccion.resumen.criticosIncumplidos,
          }), { obtenidos: 0, maximo: 0, criticosIncumplidos: 0 }),
        }]
      : [];
  });

  const resumenTotalNominal = calcularResumenTotal(vistasDocumento, seccionesCache, respuestas);
  const puntosNoAplicables = calcularPuntosExcluidosPorNoAplica(vistasDocumento, seccionesCache, respuestas);
  const puntajeMaximo = calcularPuntajeMaximoAjustado(datos.puntajeMaximo, puntosNoAplicables);
  const porcentaje = calcularPorcentajeCumplimiento(resumenTotalNominal.obtenidos, puntajeMaximo);

  return {
    establecimiento: datos.nombre,
    tipoEstablecimiento: datos.tipoLabel,
    estado: 'En proceso',
    fecha: datos.fecha,
    consecutivo: datos.consecutivo,
    idInspeccion: datos.idInspeccion,
    secciones,
    resumen: {
      obtenidos: resumenTotalNominal.obtenidos,
      maximo: puntajeMaximo,
      porcentaje,
      clasificacion: clasificarPorcentaje(porcentaje),
      criticosIncumplidos: resumenTotalNominal.criticosIncumplidos,
      ordenSanitariaProcede: resumenTotalNominal.criticosIncumplidos > 0,
      puntosNoAplicables,
    },
    textoAdvertenciaCritico: TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS,
  };
}
