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
  const [vistaEnEdicion, setVistaEnEdicion] = useState(indiceInicial);
  const [vistaCompleta, setVistaCompleta] = useState(false);
  const [vistaVacia, setVistaVacia] = useState(true);
  const vistaActual = vistas[indice] ?? null;
  const puedeCambiar = (esCompleta) => {
    return esCompleta;
  };

  const avanzar = () => {
    if (!puedeCambiar(vistaCompleta)) {
      return;
    }
    
    const siguiente = Math.min(indice + 1, vistas.length - 1);
    setIndice(siguiente);
    setVistaEnEdicion(siguiente);
    setVistaCompleta(false);
  };

  const irAVista = (nuevoIndice, vistaVacia = false) => {
    if (
      nuevoIndice >= 0 &&
      nuevoIndice < vistas.length &&
      nuevoIndice !== indice
    ) {
      // Permite cambiar SI:
      // - La vista está VACÍA (sin respuestas), O
      // - La vista está COMPLETA
      if (!vistaVacia && !puedeCambiar(vistaCompleta)) {
        return;
      }

      setIndice(nuevoIndice);
      setVistaEnEdicion(nuevoIndice);
      setVistaCompleta(false);
    }
  };

  const retroceder = () => {
    if (!puedeCambiar(vistaCompleta)) {
      return;
    }
    
    const anterior = Math.max(indice - 1, 0);
    setIndice(anterior);
    setVistaEnEdicion(anterior);
    setVistaCompleta(false);
  };

  const reiniciar = () => {
    setIndice(0);
    setVistaEnEdicion(0);
    setVistaCompleta(false);
  };

  const marcarVistaCompleta = (esCompleta, vistaVacia = false) => {
    setVistaCompleta(esCompleta);
    setVistaVacia(vistaVacia);
  };

  return {
    vistas,
    vistaActual,
    indice,
    maxAlcanzado: vistas.length - 1,
    puedeRetroceder: indice > 0 && vistaCompleta,
    puedeAvanzar: indice < vistas.length - 1 && vistaCompleta,
    avanzar,
    retroceder,
    irAVista,
    reiniciar,
    marcarVistaCompleta,
    vistaCompleta,
    vistaVacia,
  };
}