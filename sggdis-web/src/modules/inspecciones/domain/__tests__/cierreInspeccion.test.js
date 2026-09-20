import { describe, it, expect } from 'vitest';
import {
  calcularResumenTotal,
  calcularPorcentajeCumplimiento,
  clasificarPorcentaje,
  todasLasSeccionesCompletas,
  obtenerVistasIncompletas,
  obtenerCamposCierrePendientes,
  calcularPuntosExcluidosPorNoAplica,
  calcularPuntajeMaximoAjustado,
  limpiarSoloLetras,
  limpiarSoloNumeros,
} from '../cierreInspeccion';

// Cubre HU I: puntaje total, porcentaje de cumplimiento, clasificación por
// rangos del Art. 65, campos obligatorios del cierre y validación de secciones completas.

const seccionesCache = {
  A: { items: [{ idItem: 1, puntaje: 10 }, { idItem: 2, puntaje: 5 }] },
  D: { items: [{ idItem: 3, puntaje: 8 }] },
};
const vistas = [
  { codigo: 'A', secciones: [{ codigo: 'A' }] },
  { codigo: 'D', secciones: [{ codigo: 'D' }] },
];

describe('calcularResumenTotal', () => {
  it('suma los puntajes obtenidos y máximos de todas las secciones ya cargadas', () => {
    const respuestas = {
      1: { estado: 'Cumple', puntos: 10 },
      2: { estado: 'No cumple', puntos: 0 },
      3: { estado: 'Cumple', puntos: 8 },
    };
    const resumen = calcularResumenTotal(vistas, seccionesCache, respuestas);
    expect(resumen).toEqual({ obtenidos: 18, maximo: 23, criticosIncumplidos: 0 });
  });

  it('ignora secciones que todavía no están en caché', () => {
    const resumen = calcularResumenTotal(vistas, {}, {});
    expect(resumen).toEqual({ obtenidos: 0, maximo: 0, criticosIncumplidos: 0 });
  });
});

describe('calcularPorcentajeCumplimiento', () => {
  it('calcula el porcentaje respecto al puntaje máximo del tipo de establecimiento', () => {
    expect(calcularPorcentajeCumplimiento(76, 152)).toBe(50);
  });

  it('devuelve 0 si no hay puntaje máximo definido', () => {
    expect(calcularPorcentajeCumplimiento(10, 0)).toBe(0);
    expect(calcularPorcentajeCumplimiento(10, null)).toBe(0);
  });

  it('nunca excede el 100% ni baja de 0%', () => {
    expect(calcularPorcentajeCumplimiento(200, 100)).toBe(100);
    expect(calcularPorcentajeCumplimiento(-5, 100)).toBe(0);
  });
});

describe('clasificarPorcentaje (Art. 65)', () => {
  it('hasta 69% => Condiciones inaceptables', () => {
    expect(clasificarPorcentaje(0).etiqueta).toBe('Condiciones inaceptables');
    expect(clasificarPorcentaje(69).etiqueta).toBe('Condiciones inaceptables');
  });

  it('70% a 80% => Condiciones deficientes', () => {
    expect(clasificarPorcentaje(70).etiqueta).toBe('Condiciones deficientes');
    expect(clasificarPorcentaje(80).etiqueta).toBe('Condiciones deficientes');
  });

  it('81% a 100% => Buenas condiciones', () => {
    expect(clasificarPorcentaje(81).etiqueta).toBe('Buenas condiciones');
    expect(clasificarPorcentaje(100).etiqueta).toBe('Buenas condiciones');
  });
});

describe('todasLasSeccionesCompletas / obtenerVistasIncompletas', () => {
  it('es false y reporta la vista faltante si alguna sección no está completa', () => {
    const respuestas = { 1: { estado: 'Cumple', puntos: 10 }, 2: { estado: 'Cumple', puntos: 5 } };
    expect(todasLasSeccionesCompletas(vistas, seccionesCache, respuestas)).toBe(false);
    expect(obtenerVistasIncompletas(vistas, seccionesCache, respuestas).map((v) => v.codigo)).toEqual(['D']);
  });

  it('es true cuando todas las vistas están completas', () => {
    const respuestas = {
      1: { estado: 'Cumple', puntos: 10 },
      2: { estado: 'Cumple', puntos: 5 },
      3: { estado: 'Cumple', puntos: 8 },
    };
    expect(todasLasSeccionesCompletas(vistas, seccionesCache, respuestas)).toBe(true);
    expect(obtenerVistasIncompletas(vistas, seccionesCache, respuestas)).toEqual([]);
  });
});

describe('obtenerCamposCierrePendientes', () => {
  it('exige nombre e identificación del inspector, e identificación del representante', () => {
    const pendientes = obtenerCamposCierrePendientes({
      nombreInspector: '',
      identificacionInspector: '',
      identificacionRepresentante: '',
    });
    expect(pendientes).toEqual([
      'Nombre del inspector',
      'Identificación del inspector',
      'Identificación del representante del establecimiento',
    ]);
  });

  it('no reporta pendientes cuando todos los campos obligatorios están completos y son válidos', () => {
    const pendientes = obtenerCamposCierrePendientes({
      nombreInspector: 'Juan Pérez Núñez',
      identificacionInspector: '112345678',
      identificacionRepresentante: '223456789',
    });
    expect(pendientes).toEqual([]);
  });

  it('rechaza el nombre del inspector si contiene números o símbolos', () => {
    const pendientes = obtenerCamposCierrePendientes({
      nombreInspector: '873$%__:',
      identificacionInspector: '112345678',
      identificacionRepresentante: '223456789',
    });
    expect(pendientes).toContain('Nombre del inspector (solo se permiten letras y espacios)');
  });

  it('acepta nombres con tildes, Ñ y Ü', () => {
    const pendientes = obtenerCamposCierrePendientes({
      nombreInspector: 'María José Piña Güell',
      identificacionInspector: '112345678',
      identificacionRepresentante: '223456789',
    });
    expect(pendientes).toEqual([]);
  });

  it('rechaza identificaciones con letras, guiones o símbolos', () => {
    const pendientes = obtenerCamposCierrePendientes({
      nombreInspector: 'Juan Pérez',
      identificacionInspector: '1-2345-6789',
      identificacionRepresentante: '223456789',
    });
    expect(pendientes).toContain('Identificación del inspector (solo se permiten números)');
  });

  it('rechaza cuando inspector y representante tienen la misma identificación', () => {
    const pendientes = obtenerCamposCierrePendientes({
      nombreInspector: 'Juan Pérez',
      identificacionInspector: '112345678',
      identificacionRepresentante: '112345678',
    });
    expect(pendientes).toContain('Identificación del inspector y del representante (no pueden ser iguales)');
  });
});

describe('limpiarSoloLetras / limpiarSoloNumeros', () => {
  it('limpiarSoloLetras descarta números y símbolos, conserva letras y espacios', () => {
    expect(limpiarSoloLetras('873$%__:')).toBe('');
    expect(limpiarSoloLetras('José Ñúñez123')).toBe('José Ñúñez');
  });

  it('limpiarSoloNumeros descarta letras, guiones y símbolos, conserva solo dígitos', () => {
    expect(limpiarSoloNumeros('1-2345-6789')).toBe('123456789');
    expect(limpiarSoloNumeros('abc123def456')).toBe('123456');
  });
});

describe('exclusión de puntos por ítems "N/A" del puntaje máximo (HU I)', () => {
  it('resta del máximo aplicable los puntos de los ítems marcados N/A', () => {
    const respuestas = { 1: { estado: 'N/A' } };
    const excluidos = calcularPuntosExcluidosPorNoAplica(vistas, seccionesCache, respuestas);
    expect(excluidos).toBe(10);
    expect(calcularPuntajeMaximoAjustado(152, excluidos)).toBe(142);
  });

  it('el máximo ajustado nunca es negativo', () => {
    expect(calcularPuntajeMaximoAjustado(5, 20)).toBe(0);
  });
});
