import { useCallback, useEffect, useState } from 'react';

// Estado y comportamiento del modal "¿Volver al menú principal?": abrir/cerrar,
// bloquear el cierre mientras se está saliendo, y permitir cerrar con Escape.
export function useConfirmacionSalida() {
  const [mostrar, setMostrar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);

  const abrir = useCallback(() => {
    setError(null);
    setMostrar(true);
  }, []);

  const cancelar = useCallback(() => {
    if (eliminando) return;
    setError(null);
    setMostrar(false);
  }, [eliminando]);

  const cerrar = useCallback(() => setMostrar(false), []);

  useEffect(() => {
    const manejarEscape = (event) => {
      if (event.key === 'Escape' && mostrar) cancelar();
    };

    document.addEventListener('keydown', manejarEscape);
    return () => document.removeEventListener('keydown', manejarEscape);
  }, [mostrar, cancelar]);

  return { mostrar, eliminando, setEliminando, error, setError, abrir, cancelar, cerrar };
}
