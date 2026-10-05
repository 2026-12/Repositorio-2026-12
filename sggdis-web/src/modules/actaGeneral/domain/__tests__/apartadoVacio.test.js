import { describe, it, expect } from 'vitest';
import { esApartadoVacio } from '../apartadoVacio';

describe('esApartadoVacio', () => {
  it('Info General está vacío aunque tenga la fecha y la hora automáticas', () => {
    expect(
      esApartadoVacio('info-general', {
        fechaInspeccion: '2026-10-05',
        horaInicio: '08:30',
        nombreComercial: '   ',
        autorizaIngreso: null,
        autorizaFotos: null,
      })
    ).toBe(true);
  });

  it('Info General deja de estar vacío al marcar Sí o No', () => {
    expect(esApartadoVacio('info-general', { autorizaIngreso: false })).toBe(false);
  });

  it('las selecciones múltiples cuentan como dato solo si tienen elementos', () => {
    expect(esApartadoVacio('motivo', { motivoInspeccion: [], motivoInspeccionOtro: '' })).toBe(true);
    expect(esApartadoVacio('motivo', { motivoInspeccion: ['DENUNCIA'], motivoInspeccionOtro: '' })).toBe(false);
  });

  it('Cierre está vacío si las personas agregadas no tienen ningún dato', () => {
    const personaEnBlanco = { id: 1, nombreCompleto: '', cargoInstitucion: '', numeroIdentificacion: '', firma: '' };
    expect(esApartadoVacio('cierre', { personasPresentes: [] })).toBe(true);
    expect(esApartadoVacio('cierre', { personasPresentes: [personaEnBlanco] })).toBe(true);
    expect(esApartadoVacio('cierre', { personasPresentes: [{ ...personaEnBlanco, firma: 'A. P.' }] })).toBe(false);
  });
});
