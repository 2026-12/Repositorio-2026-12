import { beforeEach, describe, expect, it } from 'vitest';
import {
  obtenerActaActiva,
  guardarActaActiva,
  limpiarActaActiva,
} from '../progresoActaGeneralService';

// Cubre la persistencia del acta en curso: al recargar la página se retoma
// la misma acta y el apartado donde quedó el inspector.
describe('progresoActaGeneralService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('devuelve null cuando no hay un acta en curso', () => {
    expect(obtenerActaActiva()).toBeNull();
  });

  it('guarda y recupera el id del acta y el apartado activo', () => {
    guardarActaActiva({ idActa: 12, apartadoActivo: 'responsable' });

    expect(obtenerActaActiva()).toEqual({ idActa: 12, apartadoActivo: 'responsable' });
  });

  it('no guarda nada si no hay id de acta', () => {
    guardarActaActiva({ idActa: null, apartadoActivo: 'info-general' });

    expect(obtenerActaActiva()).toBeNull();
  });

  it('el último apartado guardado reemplaza al anterior', () => {
    guardarActaActiva({ idActa: 5, apartadoActivo: 'motivo' });
    guardarActaActiva({ idActa: 5, apartadoActivo: 'hallazgos' });

    expect(obtenerActaActiva().apartadoActivo).toBe('hallazgos');
  });

  it('limpiarActaActiva olvida el acta en curso', () => {
    guardarActaActiva({ idActa: 5, apartadoActivo: 'motivo' });
    limpiarActaActiva();

    expect(obtenerActaActiva()).toBeNull();
  });

  it('devuelve null si el valor guardado está corrupto', () => {
    localStorage.setItem('sggdis:acta-general-activa', '{no es json');

    expect(obtenerActaActiva()).toBeNull();
  });
});
