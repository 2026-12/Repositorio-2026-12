import { describe, it, expect } from 'vitest';
import {
  APARTADOS_ACTA,
  APARTADO_VISTA_PREVIA,
  CARGOS_RESPONSABLE,
  MOTIVOS_INSPECCION,
  ACCIONES_A_SEGUIR,
} from '../actaGeneral';
import { PROVINCIAS_CATALOGO } from '../divisionTerritorial';

// Cubre la configuración del Acta General: orden de apartados, catálogos de
// opciones y división territorial usada en la cascada provincia-cantón-distrito.
describe('configuración del Acta General', () => {
  it('define los seis apartados en el orden del acta oficial', () => {
    expect(APARTADOS_ACTA.map((apartado) => apartado.id)).toEqual([
      'info-general',
      'responsable',
      'motivo',
      'hallazgos',
      'acciones',
      'cierre',
    ]);
  });

  it('la vista previa no es uno de los seis apartados', () => {
    expect(APARTADOS_ACTA.some((apartado) => apartado.id === APARTADO_VISTA_PREVIA)).toBe(false);
  });

  it.each([
    ['cargos', CARGOS_RESPONSABLE],
    ['motivos', MOTIVOS_INSPECCION],
    ['acciones', ACCIONES_A_SEGUIR],
  ])('el catálogo de %s tiene valores únicos, etiquetas y la opción OTRO al final', (_nombre, catalogo) => {
    const valores = catalogo.map((opcion) => opcion.valor);

    expect(new Set(valores).size).toBe(valores.length);
    expect(catalogo.every((opcion) => opcion.etiqueta)).toBe(true);
    expect(valores.at(-1)).toBe('OTRO');
  });

  it('las acciones incluyen Reprogramación (habilita su motivo)', () => {
    expect(ACCIONES_A_SEGUIR.some((accion) => accion.valor === 'REPROGRAMACION')).toBe(true);
  });

  it('la división territorial tiene las 7 provincias de Costa Rica', () => {
    expect(PROVINCIAS_CATALOGO).toHaveLength(7);
  });

  it('San José → San José incluye el distrito Carmen (cascada)', () => {
    const provincia = PROVINCIAS_CATALOGO.find((item) => item.nombre === 'San José');
    const canton = provincia.cantones.find((item) => item.nombre === 'San José');

    expect(canton.distritos).toContain('Carmen');
  });

  it('todos los cantones tienen al menos un distrito', () => {
    PROVINCIAS_CATALOGO.forEach((provincia) => {
      provincia.cantones.forEach((canton) => {
        expect(canton.distritos.length, `${provincia.nombre} / ${canton.nombre}`).toBeGreaterThan(0);
      });
    });
  });
});
