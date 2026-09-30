import { describe, expect, it } from 'vitest';
import { nombresVistas } from './inspeccion';

describe('nombresVistas', () => {
  it('usa un nombre legible para la sección H de Servicio de Catering', () => {
    expect(nombresVistas.H).toBe('Servicio de Catering');
  });
});
