import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VistaPreviaInspeccion from '../VistaPreviaInspeccion';

const documento = {
  establecimiento: 'Soda Cypress',
  tipoEstablecimiento: 'Soda, Restaurante o Bar con servicio Express',
  estado: 'En proceso',
  fecha: '8/10/2026',
  consecutivo: 'MS-DRRSBR-ARS-BA-AI-7310-2026',
  idInspeccion: 7310,
  textoAdvertenciaCritico: 'Ítem crítico incumplido: procede valorar Orden Sanitaria.',
  secciones: [
    {
      codigo: 'A',
      nombre: 'Condiciones Físicas y Sanitarias Generales de las Instalaciones',
      resumen: { obtenidos: 32, maximo: 40, criticosIncumplidos: 1 },
      secciones: [
        {
          codigo: 'A',
          nombre: 'Condiciones Físicas y Sanitarias Generales de las Instalaciones',
          resumen: { obtenidos: 32, maximo: 40, porcentaje: 80, itemsAplicables: 2, itemsCumplen: 1 },
          items: [
            {
              id: 1,
              texto: 'Pisos en buen estado de conservación.',
              articulo: 'Art. 45',
              estado: 'Cumple',
              resultado: 'Cumple',
              puntosObtenidos: 4,
              puntosMaximos: 4,
              critico: false,
              criticoIncumplido: false,
            },
            {
              id: 2,
              texto: 'Abastecimiento de agua potable.',
              articulo: 'Art. 52',
              estado: 'No cumple',
              resultado: 'No cumple',
              puntosObtenidos: 0,
              puntosMaximos: 8,
              critico: true,
              criticoIncumplido: true,
            },
          ],
        },
      ],
    },
  ],
  resumen: {
    obtenidos: 32,
    maximo: 40,
    porcentaje: 80,
    clasificacion: { etiqueta: 'Aprobado' },
    criticosIncumplidos: 1,
    ordenSanitariaProcede: true,
  },
};

const datosCierre = { observacionesFinales: 'Se indicaron las correcciones al responsable.' };
const identidadInspector = { nombreCompleto: 'Inspectora Cypress Prueba', identificacion: '001110011' };

function renderVistaPrevia(props = {}) {
  return render(
    <VistaPreviaInspeccion
      documento={documento}
      datosCierre={datosCierre}
      identidadInspector={identidadInspector}
      onRegresarEditar={vi.fn()}
      onConfirmar={vi.fn()}
      onVolverMenu={vi.fn()}
      confirmando={false}
      pendienteSincronizacion={false}
      error=""
      {...props}
    />,
  );
}

describe('VistaPreviaInspeccion', () => {
  it('muestra la intro, el encabezado del documento y la información general', () => {
    renderVistaPrevia();

    expect(screen.getByRole('heading', { name: 'Vista previa' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Documento de Inspección' })).toBeInTheDocument();
    expect(screen.getAllByText('Soda Cypress').length).toBeGreaterThan(0);
    expect(screen.getByText('MS-DRRSBR-ARS-BA-AI-7310-2026')).toBeInTheDocument();

    expect(screen.getByText('Información General')).toBeInTheDocument();
    expect(screen.getByText('Tipo de establecimiento')).toBeInTheDocument();
    expect(screen.getByText('Fecha de inspección')).toBeInTheDocument();
    expect(screen.getByText('Inspector')).toBeInTheDocument();
  });

  it('muestra cada sección de la guía con su tabla de ítems y resultados', () => {
    renderVistaPrevia();

    expect(
      screen.getAllByText('Condiciones Físicas y Sanitarias Generales de las Instalaciones').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Sección A · 32\/40 pts \(80%\)/)).toBeInTheDocument();

    expect(screen.getByText('Pisos en buen estado de conservación.')).toBeInTheDocument();
    expect(screen.getByText('Cumple')).toBeInTheDocument();

    expect(screen.getByText('CRÍTICO')).toBeInTheDocument();
    expect(screen.getByText('No cumple')).toBeInTheDocument();
    expect(
      screen.getByText('Ítem crítico incumplido: procede valorar Orden Sanitaria.'),
    ).toBeInTheDocument();
  });

  it('muestra el resumen general con puntaje, resultado y observaciones', () => {
    renderVistaPrevia();

    expect(screen.getByText('Resumen General')).toBeInTheDocument();
    expect(screen.getByText('32 / 40')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Aprobado')).toBeInTheDocument();
    expect(
      screen.getByText(/Procede revisar la emisión de una Orden Sanitaria/),
    ).toBeInTheDocument();
    expect(screen.getByText('Se indicaron las correcciones al responsable.')).toBeInTheDocument();
  });

  it('ejecuta las acciones de volver, regresar a editar y confirmar', () => {
    const onVolverMenu = vi.fn();
    const onRegresarEditar = vi.fn();
    const onConfirmar = vi.fn();
    renderVistaPrevia({ onVolverMenu, onRegresarEditar, onConfirmar });

    fireEvent.click(screen.getByRole('button', { name: '← Volver al menú' }));
    expect(onVolverMenu).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Regresar y editar' }));
    expect(onRegresarEditar).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar y enviar' }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it('muestra el aviso y bloquea las acciones cuando está pendiente de sincronización', () => {
    renderVistaPrevia({ pendienteSincronizacion: true });

    expect(screen.getByText('Inspección pendiente de sincronización')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pendiente de sincronización' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Regresar y editar' })).toBeDisabled();
  });

  it('muestra el error de envío en una alerta', () => {
    renderVistaPrevia({ error: 'No se pudo enviar la inspección.' });

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo enviar la inspección.');
  });
});
