import { useState } from 'react';
import { obtenerSeccionesRenderizables } from '../config/inspeccion';

// Algunas secciones "reales" de la base de datos se agrupan visualmente en una
// sola pantalla (vista) del asistente: B1+B2+B3 se muestran juntas como "B",
// y C1+C2 como "C". Las demás secciones (A, D, E, F, G, H) son su propia vista.
const VISTAS_COMPUESTAS = new Map([
  ['B1', 'B'],
  ['B2', 'B'],
  ['B3', 'B'],
  ['C1', 'C'],
  ['C2', 'C'],
]);

// Agrupa la lista de secciones (tal como vienen del backend) en "vistas" del
// asistente, usando el mapa de arriba para juntar las subsecciones compuestas.
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

// Hook que maneja la navegación del asistente (wizard) paso a paso: en qué
// vista está el usuario, hasta dónde puede avanzar/retroceder, y controla que
// no se pueda saltar a una vista futura que todavía no se ha alcanzado.
export function useWizardInspeccion(
  secciones = [],
  indiceInicial = 0,
  maxAlcanzadoInicial = indiceInicial,
) {
  const vistas = obtenerVistas(secciones);

  const [indice, setIndice] = useState(indiceInicial);
  // maxAlcanzado guarda la vista más avanzada a la que el usuario ya llegó,
  // para permitirle regresar a ver vistas anteriores sin perder su progreso.
  const [maxAlcanzado, setMaxAlcanzado] = useState(maxAlcanzadoInicial);

  const vistaActual = vistas[indice] ?? null;

  // Avanza a la siguiente vista (sin pasarse del total) y actualiza el máximo alcanzado.
  const avanzar = () => {
    const siguiente = Math.min(indice + 1, vistas.length - 1);

    setIndice(siguiente);
    setMaxAlcanzado((maximoActual) =>
      Math.max(maximoActual, siguiente)
    );
  };

  // Salta directo a una vista específica, pero solo si ya fue alcanzada antes
  // (evita que el usuario se salte secciones que todavía no completó).
  const irAVista = (nuevoIndice) => {
    if (
      nuevoIndice >= 0 &&
      nuevoIndice <= maxAlcanzado &&
      nuevoIndice < vistas.length
    ) {
      setIndice(nuevoIndice);
    }
  };

  // Retrocede una vista (sin bajar de la primera).
  const retroceder = () => {
    setIndice((actual) => Math.max(actual - 1, 0));
  };

  // Reinicia el asistente al principio (ej. al empezar una inspección nueva).
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
