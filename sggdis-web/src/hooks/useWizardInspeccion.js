import { useState } from 'react';
import { obtenerSeccionesRenderizables } from '../config/inspeccion';

const VISTAS_COMPUESTAS = new Map([
  ['B1', 'B'],
  ['B2', 'B'],
  ['B3', 'B'],
  ['C1', 'C'],
  ['C2', 'C'],
]);

function obtenerVistas(secciones) {
  const vistas = [];
  obtenerSeccionesRenderizables(secciones).forEach((seccion) => {
    const codigoVista = VISTAS_COMPUESTAS.get(seccion.codigo) ?? seccion.codigo;
    if (!vistas.some((vista) => vista.codigo === codigoVista)) {
      vistas.push({ codigo: codigoVista, secciones: [] });
    }
    vistas.find((vista) => vista.codigo === codigoVista).secciones.push(seccion);
  });
  return vistas;
}

export function useWizardInspeccion(secciones = []) {
  const vistas = obtenerVistas(secciones);
  const [indice, setIndice] = useState(0);
  const vistaActual = vistas[indice] ?? null;

  return {
    vistas,
    vistaActual,
    indice,
    puedeRetroceder: indice > 0,
    puedeAvanzar: indice < vistas.length - 1,
    avanzar: () => setIndice((actual) => Math.min(actual + 1, vistas.length - 1)),
    retroceder: () => setIndice((actual) => Math.max(actual - 1, 0)),
  };
}
