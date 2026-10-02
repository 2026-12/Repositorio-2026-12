import { describe, expect, it } from 'vitest';
import { nombresVistas } from '../modules/inspecciones/inspeccionAlimentos/config/inspeccionAlimentos';

describe('nombresVistas', () => {
  it('usa un nombre legible para la sección H de Servicio de Catering', () => {
    expect(nombresVistas.H).toBe('Servicio de Catering');
  });
});
