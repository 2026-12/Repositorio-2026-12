import { useState } from 'react';

import EncabezadoOrdenSanitaria
  from './components/comunes/EncabezadoOrdenSanitaria';

import NavegacionOrdenSanitaria
  from './components/comunes/NavegacionOrdenSanitaria';

import InformacionGeneral
  from './components/InformacionGeneral';

import Ubicacion
  from './components/Ubicacion';

import Notificacion
  from './components/Notificacion';

import Motivo
  from './components/Motivo';

import Ordenanzas
  from './components/Ordenanza/Ordenanzas';

import {
  crearOrdenSanitariaInicial,
  crearOrdenanzaInicial,
} from './domain/estructuraOrdenSanitaria';

import {
  validarInformacionGeneral,
  validarUbicacion,
  validarNotificacion,
  validarMotivo,
  validarOrdenanzas,
  validarResponsable,
  tieneErrores,
} from './domain/validacionOrdenSanitaria';

import {
  useNavegacionOrdenSanitaria,
} from './hooks/useNavegacionOrdenSanitaria';

import './styles/ordenSanitaria.css';


export default function OrdenSanitariaModulo({
  onVolverInicio,
  provincias = [],
  cantones = [],
  distritos = [],
}) {
  const [ordenSanitaria, setOrdenSanitaria] = useState(
    crearOrdenSanitariaInicial,
  );

  const [errores, setErrores] = useState({});

  const {
    pasoActual,
    indicePaso,
    totalPasos,
    esPrimerPaso,
    esUltimoPaso,
    avanzar,
    retroceder,
    irAPaso,
  } = useNavegacionOrdenSanitaria();


  // ============================================================
  // Información general
  // ============================================================

  const actualizarInformacionGeneral = (campo, valor) => {
    setOrdenSanitaria((actual) => ({
      ...actual,
      informacionGeneral: {
        ...actual.informacionGeneral,
        [campo]: valor,
      },
    }));
  };


  // ============================================================
  // Ubicación
  // ============================================================

  const actualizarUbicacion = (campo, valor) => {
    setOrdenSanitaria((actual) => {
      const nuevaUbicacion = {
        ...actual.ubicacion,
        [campo]: valor,
      };

      if (campo === 'provincia') {
        nuevaUbicacion.canton = '';
        nuevaUbicacion.distrito = '';
      }

      if (campo === 'canton') {
        nuevaUbicacion.distrito = '';
      }

      return {
        ...actual,
        ubicacion: nuevaUbicacion,
      };
    });
  };


  // ============================================================
  // Notificación
  // ============================================================

  const actualizarNotificacion = (campo, valor) => {
    setOrdenSanitaria((actual) => ({
      ...actual,
      notificacion: {
        ...actual.notificacion,
        [campo]: valor,
      },
    }));
  };


  // ============================================================
  // Motivo
  // ============================================================

  const actualizarMotivo = (valor) => {
    setOrdenSanitaria((actual) => ({
      ...actual,
      motivo: valor,
    }));
  };


  // ============================================================
  // Ordenanzas
  // ============================================================

  const agregarOrdenanza = () => {
    setOrdenSanitaria((actual) => ({
      ...actual,
      ordenanzas: [
        ...actual.ordenanzas,
        crearOrdenanzaInicial(),
      ],
    }));
  };


  const actualizarOrdenanza = (
    indice,
    campo,
    valor,
  ) => {
    setOrdenSanitaria((actual) => ({
      ...actual,

      ordenanzas: actual.ordenanzas.map(
        (ordenanza, indiceActual) =>
          indiceActual === indice
            ? {
                ...ordenanza,
                [campo]: valor,
              }
            : ordenanza,
      ),
    }));
  };


  const eliminarOrdenanza = (indice) => {
    setOrdenSanitaria((actual) => {
      if (actual.ordenanzas.length <= 1) {
        return actual;
      }

      return {
        ...actual,

        ordenanzas: actual.ordenanzas.filter(
          (_, indiceActual) =>
            indiceActual !== indice,
        ),
      };
    });
  };


  // ============================================================
  // Responsable
  // ============================================================

  const actualizarResponsable = (campo, valor) => {
    setOrdenSanitaria((actual) => ({
      ...actual,

      responsable: {
        ...actual.responsable,
        [campo]: valor,
      },
    }));
  };


  // ============================================================
  // Validaciones
  // ============================================================

  const validarPasoActual = () => {
    let erroresPaso = {};

    switch (pasoActual.id) {
      case 'general':
        erroresPaso = validarInformacionGeneral(
          ordenSanitaria.informacionGeneral,
        );
        break;

      case 'ubicacion':
        erroresPaso = validarUbicacion(
          ordenSanitaria.ubicacion,
        );
        break;

      case 'notificacion':
        erroresPaso = validarNotificacion(
          ordenSanitaria.notificacion,
        );
        break;

      case 'motivo':
        erroresPaso = validarMotivo(
          ordenSanitaria.motivo,
        );
        break;

      case 'ordenanzas': {
        const erroresOrdenanzas =
          validarOrdenanzas(
            ordenSanitaria.ordenanzas,
          );

        const erroresResponsable =
          validarResponsable(
            ordenSanitaria.responsable,
          );

        erroresPaso = {
          ordenanzas: erroresOrdenanzas,
          responsable: erroresResponsable,
        };

        break;
      }

      default:
        return true;
    }

    setErrores((actuales) => ({
      ...actuales,
      [pasoActual.id]: erroresPaso,
    }));

    if (pasoActual.id === 'ordenanzas') {
      return (
        !tieneErrores(erroresPaso.ordenanzas)
        && !tieneErrores(erroresPaso.responsable)
      );
    }

    return !tieneErrores(erroresPaso);
  };


  // ============================================================
  // Navegación
  // ============================================================

  const manejarSiguiente = () => {
    if (!validarPasoActual()) {
      return;
    }

    avanzar();
  };


  const manejarIrAPaso = (idPaso) => {
    irAPaso(idPaso);
  };


  // ============================================================
  // Emisión
  // ============================================================

  const emitirOrdenSanitaria = () => {
    if (!validarPasoActual()) {
      return;
    }

    /*
     * En la siguiente etapa este punto se conectará
     * con el servicio y el backend.
     *
     * Por ahora únicamente verificamos el objeto final
     * generado por el frontend.
     */
    console.log(
      'Orden Sanitaria lista para emitir:',
      ordenSanitaria,
    );
  };


  // ============================================================
  // Renderizado
  // ============================================================

  const renderizarPasoActual = () => {
    switch (pasoActual.id) {
      case 'general':
        return (
          <InformacionGeneral
            datos={
              ordenSanitaria.informacionGeneral
            }
            errores={errores.general ?? {}}
            onChange={
              actualizarInformacionGeneral
            }
          />
        );

      case 'ubicacion':
        return (
          <Ubicacion
            datos={ordenSanitaria.ubicacion}
            errores={errores.ubicacion ?? {}}
            onChange={actualizarUbicacion}
            provincias={provincias}
            cantones={cantones}
            distritos={distritos}
          />
        );

      case 'notificacion':
        return (
          <Notificacion
            datos={
              ordenSanitaria.notificacion
            }
            errores={
              errores.notificacion ?? {}
            }
            onChange={actualizarNotificacion}
          />
        );

      case 'motivo':
        return (
          <Motivo
            motivo={ordenSanitaria.motivo}
            errores={errores.motivo ?? {}}
            onChange={actualizarMotivo}
          />
        );

      case 'ordenanzas':
        return (
          <Ordenanzas
            ordenanzas={
              ordenSanitaria.ordenanzas
            }
            errores={
              errores.ordenanzas?.ordenanzas
              ?? {}
            }
            responsable={
              ordenSanitaria.responsable
            }
            erroresResponsable={
              errores.ordenanzas?.responsable
              ?? {}
            }
            onAgregar={agregarOrdenanza}
            onActualizar={
              actualizarOrdenanza
            }
            onEliminar={eliminarOrdenanza}
            onActualizarResponsable={
              actualizarResponsable
            }
          />
        );

      default:
        return null;
    }
  };


  return (
    <div className="orden-sanitaria">
      <div className="orden-sanitaria__superior">
        <EncabezadoOrdenSanitaria
          onVolverInicio={onVolverInicio}
        />

        <NavegacionOrdenSanitaria
          indicePaso={indicePaso}
          onIrAPaso={manejarIrAPaso}
        />
      </div>

      <main className="orden-sanitaria__contenido">
        {renderizarPasoActual()}
      </main>

      <footer className="orden-sanitaria__acciones">
        <button
          type="button"
          className="orden-sanitaria__boton-secundario"
          onClick={retroceder}
          disabled={esPrimerPaso}
        >
          ← Anterior
        </button>

        <span className="orden-sanitaria__contador">
          Paso {indicePaso + 1} de {totalPasos}
        </span>

        {!esUltimoPaso ? (
          <button
            type="button"
            className="orden-sanitaria__boton-principal"
            onClick={manejarSiguiente}
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            className="orden-sanitaria__boton-principal"
            onClick={emitirOrdenSanitaria}
          >
            Emitir Orden Sanitaria
          </button>
        )}
      </footer>
    </div>
  );
}