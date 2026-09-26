import { useCallback, useMemo, useState } from 'react';

import {
  PASOS_ORDEN_SANITARIA,
} from '../config/ordenSanitaria';

export function useNavegacionOrdenSanitaria() {
  const [indicePaso, setIndicePaso] = useState(0);

  const pasoActual = useMemo(
    () => PASOS_ORDEN_SANITARIA[indicePaso],
    [indicePaso],
  );

  const esPrimerPaso = indicePaso === 0;

  const esUltimoPaso =
    indicePaso === PASOS_ORDEN_SANITARIA.length - 1;

  const avanzar = useCallback(() => {
    setIndicePaso((indiceActual) =>
      Math.min(
        indiceActual + 1,
        PASOS_ORDEN_SANITARIA.length - 1,
      ),
    );
  }, []);

  const retroceder = useCallback(() => {
    setIndicePaso((indiceActual) =>
      Math.max(indiceActual - 1, 0),
    );
  }, []);

  const irAPaso = useCallback((idPaso) => {
    const nuevoIndice =
      PASOS_ORDEN_SANITARIA.findIndex(
        (paso) => paso.id === idPaso,
      );

    if (nuevoIndice === -1) {
      return;
    }

    setIndicePaso(nuevoIndice);
  }, []);

  return {
    pasoActual,
    indicePaso,
    totalPasos: PASOS_ORDEN_SANITARIA.length,
    esPrimerPaso,
    esUltimoPaso,
    avanzar,
    retroceder,
    irAPaso,
  };
}