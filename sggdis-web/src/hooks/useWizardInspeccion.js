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

export function useWizardInspeccion(
  secciones = [],
  indiceInicial = 0,
  maxAlcanzadoInicial = indiceInicial,
) {
  const vistas = obtenerVistas(secciones);

  const [indice, setIndice] = useState(indiceInicial);
  const [maxAlcanzado, setMaxAlcanzado] = useState(maxAlcanzadoInicial);

  const vistaActual = vistas[indice] ?? null;

  const avanzar = () => {
    const siguiente = Math.min(indice + 1, vistas.length - 1);

    setIndice(siguiente);
    setMaxAlcanzado((maximoActual) =>
      Math.max(maximoActual, siguiente)
    );
  };

  const irAVista = (nuevoIndice) => {
    if (
      nuevoIndice >= 0 &&
      nuevoIndice <= maxAlcanzado &&
      nuevoIndice < vistas.length
    ) {
      setIndice(nuevoIndice);
    }
  };

  const retroceder = () => {
    setIndice((actual) => Math.max(actual - 1, 0));
  };

  const reiniciar = () => {
    setIndice(0);
    setMaxAlcanzado(0);
  };

  return {
    vistas,
    vistaActual,
    indice,
    maxAlcanzado,
    puedeRetroceder: indice > 0,
    puedeAvanzar: indice < vistas.length - 1,
    avanzar,
    retroceder,
    irAVista,
    reiniciar,
  };
}
