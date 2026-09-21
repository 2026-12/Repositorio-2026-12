import { useEffect } from 'react';
import { guardarProgreso, limpiarProgreso } from '../services/progresoInspeccionService';

// Persiste el progreso completo de la inspección en curso en localStorage,
// y lo limpia cuando ya no hay una inspección activa (datos === null).
export function usePersistenciaProgreso({ datos, respuestas, respuestasGuardadas, seccionesCache, wizard, cierreActivo, datosCierre }) {
  useEffect(() => {
    if (!datos) {
      limpiarProgreso();
      return;
    }

    guardarProgreso({
      datos,
      respuestas,
      respuestasGuardadas,
      seccionesCache,
      indiceWizard: wizard.indice,
      maxAlcanzado: wizard.maxAlcanzado,
      cierreActivo,
      datosCierre,
    });
  }, [datos, respuestas, respuestasGuardadas, seccionesCache, wizard.indice, wizard.maxAlcanzado, cierreActivo, datosCierre]);
}
