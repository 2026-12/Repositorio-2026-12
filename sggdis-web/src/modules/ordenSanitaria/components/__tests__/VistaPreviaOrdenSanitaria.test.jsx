import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import VistaPreviaOrdenSanitaria from '../VistaPreviaOrdenSanitaria';

// Cubre HU-024 (vista previa de la Orden Sanitaria): la vista previa muestra
// exactamente la información registrada, con fechas y plazos legibles, y es de
// solo lectura. La navegación (regresar a editar y emitir) se cubre en la
// prueba E2E cypress/e2e/08-vista-previa-orden-sanitaria.cy.js.

const PROVINCIAS = [{ idProvincia: 1, nombre: 'San José' }];
const CANTONES = [{ idCanton: 1, nombre: 'San José' }];
const DISTRITOS = [{ idDistrito: 1, nombre: 'Carmen' }];

/**
 * Crea una orden completa para mostrar en la vista previa.
 * @param {object[]} ordenanzas Ordenanzas que se quieren mostrar.
 */
function crearOrden(ordenanzas) {
  return {
    idInspeccion: 1,
    informacionGeneral: {
      nombreCompleto: 'Juan Carlos Rodríguez Mora',
      condicion: 'Propietario',
      otraCondicion: '',
      identificacion: '1-1234-5678',
      nombreEstablecimiento: 'Restaurante El Buen Sabor',
      numeroExpediente: 'MS-DRRSCS-ARS-SJ-AI-0002-2026',
      numeroConsecutivo: '',
    },
    ubicacion: {
      idProvincia: 1,
      idCanton: 1,
      idDistrito: 1,
      direccionExacta: 'Frente al parque central',
    },
    notificacion: {
      fechaEmision: '2026-10-07',
      fechaNotificacion: '2026-10-09',
    },
    ordenanzas: ordenanzas ?? [
      {
        numeroOrden: 1,
        ordenanza: 'Instalar un lavamanos exclusivo en el área de preparación.',
        fundamentoLegal: 'Art. 18 del Reglamento',
        plazo: { tipoPlazo: 'DIAS', cantidad: '5' },
      },
    ],
    responsable: {
      nombreCompleto: 'María Fernández Solís',
      cargo: 'Directora',
      unidadOrganizativaArs: 'ARS San José Centro',
      firma: '',
    },
  };
}

/**
 * Renderiza la vista previa con los catálogos de ubicación de prueba.
 * @param {object} datos Orden Sanitaria a mostrar.
 */
function renderizarVistaPrevia(datos) {
  return render(
    <VistaPreviaOrdenSanitaria
      datos={datos}
      provincias={PROVINCIAS}
      cantones={CANTONES}
      distritos={DISTRITOS}
    />
  );
}

/**
 * Devuelve los valores mostrados junto a una etiqueta (puede haber varios,
 * por ejemplo uno por ordenanza).
 * @param {string} etiqueta Texto exacto de la etiqueta.
 */
function obtenerValores(etiqueta) {
  return screen
    .getAllByText(etiqueta, { exact: true })
    .map((elemento) => elemento.nextElementSibling?.textContent);
}

describe('VistaPreviaOrdenSanitaria', () => {
  it('muestra los datos generales, la ubicación y el responsable registrados', () => {
    renderizarVistaPrevia(crearOrden());

    expect(obtenerValores('Número de expediente')).toEqual(['MS-DRRSCS-ARS-SJ-AI-0002-2026']);
    expect(obtenerValores('Nombre completo de la persona a notificar')).toEqual(['Juan Carlos Rodríguez Mora']);
    expect(obtenerValores('Condición')).toEqual(['Propietario']);
    expect(obtenerValores('Provincia')).toEqual(['San José']);
    expect(obtenerValores('Distrito')).toEqual(['Carmen']);
    expect(obtenerValores('Dirección exacta para notificar')).toEqual(['Frente al parque central']);
    expect(obtenerValores('Cargo del responsable')).toEqual(['Directora']);
  });

  it('muestra las fechas en formato dd/mm/aaaa', () => {
    renderizarVistaPrevia(crearOrden());

    expect(obtenerValores('Fecha de emisión')).toEqual(['07/10/2026']);
    expect(obtenerValores('Fecha de notificación')).toEqual(['09/10/2026']);
  });

  it('numera las ordenanzas y muestra el plazo en días, meses u horas en singular o plural', () => {
    renderizarVistaPrevia(crearOrden([
      { ordenanza: 'Limpiar la campana', fundamentoLegal: 'Art. 1', plazo: { tipoPlazo: 'DIAS', cantidad: '1' } },
      { ordenanza: 'Cambiar el piso', fundamentoLegal: 'Art. 2', plazo: { tipoPlazo: 'MESES', cantidad: '2' } },
      { ordenanza: 'Retirar alimentos', fundamentoLegal: 'Art. 3', plazo: { tipoPlazo: 'HORAS', cantidad: '24' } },
    ]));

    expect(screen.getByText('Ordenanza 1')).toBeInTheDocument();
    expect(screen.getByText('Ordenanza 3')).toBeInTheDocument();
    expect(obtenerValores('Ordenanza')).toEqual(['Limpiar la campana', 'Cambiar el piso', 'Retirar alimentos']);
    expect(obtenerValores('Plazo de cumplimiento')).toEqual(['1 día', '2 meses', '24 horas']);
  });

  it('muestra el plazo por fecha específica junto con la hora', () => {
    renderizarVistaPrevia(crearOrden([
      {
        ordenanza: 'Presentar el permiso sanitario',
        fundamentoLegal: 'Art. 4',
        plazo: { tipoPlazo: 'FECHA', diaCumplimiento: 5, mesCumplimiento: 3, anioCumplimiento: 2027, horaCumplimiento: '14:30' },
      },
    ]));

    expect(obtenerValores('Plazo de cumplimiento')).toEqual(['05/03/2027 - 14:30']);
  });

  it('muestra el detalle escrito cuando la condición es "Otro"', () => {
    const orden = crearOrden();
    orden.informacionGeneral.condicion = 'Otro';
    orden.informacionGeneral.otraCondicion = 'Administrador del local';

    renderizarVistaPrevia(orden);

    expect(obtenerValores('Condición')).toEqual(['Administrador del local']);
  });

  it('indica los datos que aún no existen en lugar de dejarlos en blanco', () => {
    renderizarVistaPrevia(crearOrden());

    // El consecutivo se genera al emitir y la firma es opcional.
    expect(obtenerValores('Número consecutivo')).toEqual(['No indicado']);
    expect(obtenerValores('Firma')).toEqual(['No indicada']);
  });

  it('es de solo lectura: no contiene campos editables ni botones', () => {
    const { container } = renderizarVistaPrevia(crearOrden());

    expect(container.querySelectorAll('input, textarea, select, button')).toHaveLength(0);
  });
});