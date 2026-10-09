import { beforeEach, describe, expect, it, vi } from 'vitest';
import { solicitarJson } from '../../../inspecciones/services/httpClient';
import {
  crearActaGeneral,
  guardarCierre,
  guardarInfoGeneral,
  guardarMotivo,
  guardarResponsable,
  enviarActaGeneral,
  eliminarActaGeneral,
} from '../actaGeneralService';

vi.mock('../../../inspecciones/services/httpClient', () => ({
  solicitarJson: vi.fn(),
}));

// Cubre que cada apartado se envíe al endpoint correcto con el cuerpo
// esperado (autoguardado por apartado y envío del acta completa).
describe('actaGeneralService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    solicitarJson.mockResolvedValue(null);
  });

  it('crearActaGeneral hace POST a /api/actas-generales', async () => {
    await crearActaGeneral();

    const [url, opciones] = solicitarJson.mock.calls[0];
    expect(url).toMatch(/\/api\/actas-generales$/);
    expect(opciones.method).toBe('POST');
  });

  it('guardarMotivo hace PUT a /motivo con los dos campos del apartado', async () => {
    await guardarMotivo(4, { motivoInspeccion: ['OTRO'], motivoInspeccionOtro: 'Texto', campoAjeno: 'no va' });

    const [url, opciones] = solicitarJson.mock.calls[0];
    expect(url).toMatch(/\/api\/actas-generales\/4\/motivo$/);
    expect(opciones.method).toBe('PUT');
    expect(JSON.parse(opciones.body)).toEqual({ motivoInspeccion: ['OTRO'], motivoInspeccionOtro: 'Texto' });
  });

  it('guardarResponsable hace PUT a /responsable', async () => {
    await guardarResponsable(4, {
      nombreResponsable: 'María',
      cargoResponsable: ['ENCARGADO'],
      cargoResponsableOtro: '',
      numeroIdentificacionResponsable: '1-2345-6789',
    });

    const [url, opciones] = solicitarJson.mock.calls[0];
    expect(url).toMatch(/\/api\/actas-generales\/4\/responsable$/);
    expect(JSON.parse(opciones.body).nombreResponsable).toBe('María');
  });

  it('guardarInfoGeneral hace PUT a /info-general con las autorizaciones Sí/No', async () => {
    await guardarInfoGeneral(9, { nombreComercial: 'Soda', autorizaIngreso: true, autorizaFotos: false });

    const [url, opciones] = solicitarJson.mock.calls[0];
    expect(url).toMatch(/\/api\/actas-generales\/9\/info-general$/);
    const cuerpo = JSON.parse(opciones.body);
    expect(cuerpo.autorizaIngreso).toBe(true);
    expect(cuerpo.autorizaFotos).toBe(false);
  });

  it('guardarCierre no envía el id interno de cada persona', async () => {
    await guardarCierre(4, {
      personasPresentes: [
        { id: 'abc', nombreCompleto: 'Juan', cargoInstitucion: 'Inspector', numeroIdentificacion: '1-1', firma: 'J' },
      ],
    });

    const [url, opciones] = solicitarJson.mock.calls[0];
    expect(url).toMatch(/\/api\/actas-generales\/4\/cierre$/);
    expect(JSON.parse(opciones.body)).toEqual({
      personasPresentes: [{ nombreCompleto: 'Juan', cargoInstitucion: 'Inspector', numeroIdentificacion: '1-1', firma: 'J' }],
    });
  });

  it('enviarActaGeneral hace PUT a /envio con los seis apartados juntos', async () => {
    await enviarActaGeneral(4, {
      infoGeneral: { nombreComercial: 'Soda' },
      responsable: { nombreResponsable: 'María' },
      motivo: { motivoInspeccion: ['SEGUIMIENTO'] },
      hallazgos: { idsGuias: [1], hallazgos: 'Todo bien' },
      acciones: { acciones: ['CIERRE_CASO'] },
      cierre: { personasPresentes: [] },
    });

    const [url, opciones] = solicitarJson.mock.calls[0];
    expect(url).toMatch(/\/api\/actas-generales\/4\/envio$/);
    expect(opciones.method).toBe('PUT');
    expect(Object.keys(JSON.parse(opciones.body))).toEqual([
      'infoGeneral',
      'responsable',
      'motivo',
      'hallazgos',
      'acciones',
      'cierre',
    ]);
  });

  it('eliminarActaGeneral hace DELETE del acta indicada', async () => {
    await eliminarActaGeneral(7);

    const [url, opciones] = solicitarJson.mock.calls[0];
    expect(url).toMatch(/\/api\/actas-generales\/7$/);
    expect(opciones.method).toBe('DELETE');
  });
});
