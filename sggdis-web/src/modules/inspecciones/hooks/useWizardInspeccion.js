import { useState } from 'react';
import { obtenerSeccionesRenderizables } from '../alimentos/config/inspeccionAlimentos';

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
    const codigoVista =
      VISTAS_COMPUESTAS.get(seccion.codigo) ??
      seccion.codigo;

    if (
      !vistas.some(
        (vista) =>
          vista.codigo === codigoVista
      )
    ) {
      vistas.push({
        codigo: codigoVista,
        secciones: [],
      });
    }

    vistas
      .find(
        (vista) =>
          vista.codigo === codigoVista
      )
      .secciones.push(seccion);
  });

  return vistas;
}

export function useWizardInspeccion(
  secciones = [],
  indiceInicial = 0,
  maxAlcanzadoInicial = indiceInicial,
) {
  const vistas =
    obtenerVistas(secciones);

  const [indice, setIndice] =
    useState(indiceInicial);

  const [
    vistaCompleta,
    setVistaCompleta,
  ] = useState(false);

  const [
    vistaVacia,
    setVistaVacia,
  ] = useState(true);

  const vistaActual =
    vistas[indice] ?? null;

  const puedeCambiarVista = () => {
    return (
      vistaVacia ||
      vistaCompleta
    );
  };

  const avanzar = () => {
    if (
      !puedeCambiarVista()
    ) {
      return;
    }

    const siguiente =
      Math.min(
        indice + 1,
        vistas.length - 1
      );

    setIndice(siguiente);
    setVistaCompleta(false);
    setVistaVacia(true);
  };

  const irAVista = (
    nuevoIndice
  ) => {
    if (
      nuevoIndice < 0 ||
      nuevoIndice >=
        vistas.length ||
      nuevoIndice === indice
    ) {
      return;
    }

    // Si la vista está completamente vacía,
    // puede abandonarse sin necesidad de completarla.
    //
    // Si ya se empezó a responder,
    // solo puede abandonarse cuando esté completa.
    if (
      !puedeCambiarVista()
    ) {
      return;
    }

    setIndice(
      nuevoIndice
    );

    setVistaCompleta(false);
    setVistaVacia(true);
  };

  const retroceder = () => {
    if (
      !puedeCambiarVista()
    ) {
      return;
    }

    const anterior =
      Math.max(
        indice - 1,
        0
      );

    setIndice(anterior);
    setVistaCompleta(false);
    setVistaVacia(true);
  };

  const reiniciar = () => {
    setIndice(0);
    setVistaCompleta(false);
    setVistaVacia(true);
  };

  const marcarVistaCompleta = (
    esCompleta,
    esVacia = false
  ) => {
    setVistaCompleta(
      esCompleta
    );

    setVistaVacia(
      esVacia
    );
  };

  return {
    vistas,
    vistaActual,
    indice,

    // Todas las pestañas están disponibles desde el inicio.
    maxAlcanzado:
      Math.max(
        vistas.length - 1,
        0
      ),

    puedeRetroceder:
      indice > 0 &&
      puedeCambiarVista(),

    puedeAvanzar:
      indice <
        vistas.length - 1 &&
      puedeCambiarVista(),

    avanzar,
    retroceder,
    irAVista,
    reiniciar,
    marcarVistaCompleta,
    vistaCompleta,
    vistaVacia,
  };
}