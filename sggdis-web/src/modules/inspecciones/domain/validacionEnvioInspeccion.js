import { agruparPorArticulo } from './agrupacionItems';
import { obtenerPendientes } from './validacionSeccion';

export function validarInspeccionCompleta(vistas = [], seccionesCache = {}, respuestas = {}) {
  const errores = [];

  vistas.forEach((vista) => {
    const erroresVista = [];

    vista.secciones.forEach((seccionRaw) => {
      const seccion = seccionesCache[seccionRaw.codigo];
      if (!seccion) {
        erroresVista.push({
          codigo: seccionRaw.codigo,
          nombre: seccionRaw.nombre ?? seccionRaw.titulo ?? `Sección ${seccionRaw.codigo}`,
          incompleta: true,
          pendientes: [],
        });
        return;
      }

      const pendientes = obtenerPendientes(agruparPorArticulo(seccion.items), respuestas);
      if (pendientes.length > 0) {
        erroresVista.push({
          codigo: seccionRaw.codigo,
          nombre: seccion.nombre ?? seccionRaw.nombre ?? seccionRaw.titulo ?? `Sección ${seccionRaw.codigo}`,
          incompleta: false,
          pendientes,
        });
      }
    });

    if (erroresVista.length > 0) {
      errores.push({
        codigo: vista.codigo,
        nombre: vista.nombre ?? vista.codigo,
        secciones: erroresVista,
      });
    }
  });

  return errores;
}
