import { useEffect, useMemo, useState } from 'react';

import DatosResponsable from './components/DatosResponsable';
import InformacionGeneral from './components/InformacionGeneral';
import Notificacion from './components/Notificacion';
import Ordenanzas from './components/Ordenanza/Ordenanzas';
import Ubicacion from './components/Ubicacion';
import VistaPreviaOrdenSanitaria from './components/VistaPreviaOrdenSanitaria';

import EncabezadoOrdenSanitaria from './components/comunes/EncabezadoOrdenSanitaria';
import NavegacionOrdenSanitaria from './components/comunes/NavegacionOrdenSanitaria';
import ModalConfirmacionSalidaOrden from './components/comunes/ModalConfirmacionSalidaOrden';

import {
  crearOrdenanzaVacia,
  crearOrdenSanitariaInicial,
  prepararOrdenSanitariaParaApi,
} from './domain/estructuraOrdenSanitaria';

import { validarOrdenSanitaria } from './domain/validacionOrdenSanitaria';
import { crearOrdenSanitaria } from './services/ordenSanitariaService';
import { obtenerCantones, obtenerDistritos, obtenerProvincias } from './services/ubicacionesService';

import {
  cargarProgresoOrdenSanitaria,
  guardarProgresoOrdenSanitaria,
  limpiarProgresoOrdenSanitaria,
} from './services/progresoOrdenSanitariaService';

import './styles/ordenSanitaria.css';

const TOTAL_PASOS = 5;
const SEGUNDOS_CONFIRMACION = 180;

const MENSAJE_VALIDACION =
  'Existen campos obligatorios pendientes. Revise las secciones marcadas en rojo antes de continuar.';

// PROVISIONAL: el consecutivo se genera en frontend al emitir.
// Luego se reemplazará por la generación definitiva en backend.
function generarConsecutivoOrdenSanitaria() {
  const fecha = new Date();

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  const segundos = String(fecha.getSeconds()).padStart(2, '0');
  const milisegundos = String(fecha.getMilliseconds()).padStart(3, '0');

  return `OS-${anio}${mes}${dia}-${horas}${minutos}${segundos}-${milisegundos}`;
}

function obtenerPasosConError(errores) {
  const pasos = [];

  if (
    [
      'numeroExpediente',
      'nombreCompleto',
      'identificacion',
      'nombreEstablecimiento',
      'condicion',
      'otraCondicion',
    ].some((campo) => errores[campo])
  ) {
    pasos.push(0);
  }

  if (['idProvincia', 'idCanton', 'idDistrito', 'direccionExacta'].some((campo) => errores[campo])) {
    pasos.push(1);
  }

  if (['fechaEmision', 'fechaNotificacion'].some((campo) => errores[campo])) {
    pasos.push(2);
  }

  if (
    Object.keys(errores).some(
      (clave) =>
        clave === 'ordenanzas' ||
        clave.startsWith('ordenanza-') ||
        clave.startsWith('fundamento-') ||
        clave.startsWith('plazo-')
    )
  ) {
    pasos.push(3);
  }

  if (['responsableNombre', 'responsableCargo', 'responsableUnidad'].some((campo) => errores[campo])) {
    pasos.push(4);
  }

  return pasos;
}

export default function OrdenSanitariaModulo({
  idInspeccion,
  inspeccionRelacionada,
  onFinalizar,
  onVolverInicio,
}) {
  // EH5-05: se carga el progreso de la inspección recibida, no el de la
  // última orden activa. Así una orden pendiente de otra inspección nunca se
  // mezcla con esta. Si idInspeccion no llega (recarga de la página, se
  // pierde location.state), el servicio retoma la orden activa.
  const [progresoGuardado] = useState(() => cargarProgresoOrdenSanitaria(idInspeccion));
  
  const infoInspeccion = useMemo(
    () =>
      inspeccionRelacionada ||
      progresoGuardado?.inspeccionRelacionada || {
        idInspeccion: idInspeccion || '',
        consecutivo: '',
        nombreEstablecimiento: '',
        nombrePersonaNotificar: '',
        identificacionPersonaNotificar: '',
        tipoEstablecimiento: '',
      },
    [idInspeccion, inspeccionRelacionada, progresoGuardado]
  );

  const [datos, setDatos] = useState(() => {
    if (progresoGuardado?.datos) return progresoGuardado.datos;

    return crearOrdenSanitariaInicial({
      idInspeccion: infoInspeccion.idInspeccion,
      nombreEstablecimiento: infoInspeccion.nombreEstablecimiento || '',
    });
  });

  const [pasoActual, setPasoActual] = useState(progresoGuardado?.pasoActual ?? 0);
  const [errores, setErrores] = useState({});
  const [provincias, setProvincias] = useState([]);
  const [cantones, setCantones] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [ordenRegistrada, setOrdenRegistrada] = useState(null);
  const [validacionIntentada, setValidacionIntentada] = useState(progresoGuardado?.validacionIntentada ?? false);
  const [mostrandoVistaPrevia, setMostrandoVistaPrevia] = useState(progresoGuardado?.mostrandoVistaPrevia ?? false);
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_CONFIRMACION);

  useEffect(() => {
    if (progresoGuardado?.datos) return;

    setDatos((actual) => ({
      ...actual,
      idInspeccion: infoInspeccion.idInspeccion || actual.idInspeccion,
      informacionGeneral: {
        ...actual.informacionGeneral,
        numeroConsecutivo: '',
        numeroExpediente:
          infoInspeccion.consecutivo ||
          actual.informacionGeneral.numeroExpediente ||
          '',
        nombreCompleto:
          infoInspeccion.nombrePersonaNotificar ||
          actual.informacionGeneral.nombreCompleto ||
          '',
        identificacion:
          infoInspeccion.identificacionPersonaNotificar ||
          actual.informacionGeneral.identificacion ||
          '',
        nombreEstablecimiento:
          infoInspeccion.nombreEstablecimiento ||
          actual.informacionGeneral.nombreEstablecimiento ||
          '',
      },
    }));
  }, [infoInspeccion, progresoGuardado]);

  useEffect(() => {
    if (ordenRegistrada || !datos.idInspeccion) return;

    guardarProgresoOrdenSanitaria({
      datos,
      pasoActual,
      validacionIntentada,
      mostrandoVistaPrevia,
      inspeccionRelacionada: infoInspeccion,
    });
  }, [
    datos,
    pasoActual,
    validacionIntentada,
    mostrandoVistaPrevia,
    ordenRegistrada,
    infoInspeccion,
  ]);

  useEffect(() => {
    obtenerProvincias()
      .then(setProvincias)
      .catch(() => setErrorEnvio('No fue posible cargar las provincias.'));
  }, []);

  useEffect(() => {
    if (!datos.ubicacion.idProvincia) {
      setCantones([]);
      return;
    }

    obtenerCantones(datos.ubicacion.idProvincia)
      .then(setCantones)
      .catch(() => setErrorEnvio('No fue posible cargar los cantones.'));
  }, [datos.ubicacion.idProvincia]);

  useEffect(() => {
    if (!datos.ubicacion.idCanton) {
      setDistritos([]);
      return;
    }

    obtenerDistritos(datos.ubicacion.idCanton)
      .then(setDistritos)
      .catch(() => setErrorEnvio('No fue posible cargar los distritos.'));
  }, [datos.ubicacion.idCanton]);

  useEffect(() => {
    if (!validacionIntentada) return;

    const nuevosErrores = validarOrdenSanitaria(datos);
    setErrores(nuevosErrores);

    const pendientes = obtenerPasosConError(nuevosErrores);

    if (pendientes.length === 0) {
      if (errorEnvio === MENSAJE_VALIDACION) setErrorEnvio('');
      return;
    }

    if (!pendientes.includes(pasoActual) && errorEnvio === MENSAJE_VALIDACION) {
      setErrorEnvio('');
    }
  }, [datos, validacionIntentada, pasoActual, errorEnvio]);

  useEffect(() => {
    if (!ordenRegistrada) return undefined;

    const duracionMs = SEGUNDOS_CONFIRMACION * 1000;
    const fechaLimite = Date.now() + duracionMs;

    setSegundosRestantes(SEGUNDOS_CONFIRMACION);

    const actualizarContador = () => {
      const tiempoRestante = fechaLimite - Date.now();
      setSegundosRestantes(Math.max(0, Math.ceil(tiempoRestante / 1000)));
    };

    const intervalo = window.setInterval(actualizarContador, 250);

    const temporizador = window.setTimeout(() => {
      setSegundosRestantes(0);
      onFinalizar?.(ordenRegistrada);
      onVolverInicio?.();
    }, duracionMs);

    return () => {
      window.clearInterval(intervalo);
      window.clearTimeout(temporizador);
    };
  }, [ordenRegistrada, onFinalizar, onVolverInicio]);

  const actualizarInformacionGeneral = (campo, valor) => {
    setDatos((actual) => {
      const informacionGeneral = { ...actual.informacionGeneral, [campo]: valor };

      if (campo === 'condicion' && valor !== 'Otro') {
        informacionGeneral.otraCondicion = '';
      }

      return { ...actual, informacionGeneral };
    });
  };

  const actualizarUbicacion = (campo, valor) => {
    setDatos((actual) => ({
      ...actual,
      ubicacion: { ...actual.ubicacion, [campo]: valor },
    }));
  };

  const actualizarNotificacion = (campo, valor) => {
    setDatos((actual) => {
      const notificacion = { ...actual.notificacion, [campo]: valor };

      if (
        campo === 'fechaEmision' &&
        valor &&
        notificacion.fechaNotificacion &&
        notificacion.fechaNotificacion < valor
      ) {
        notificacion.fechaNotificacion = '';
      }

      let ordenanzas = actual.ordenanzas;

      if (campo === 'fechaNotificacion' && valor) {
        ordenanzas = actual.ordenanzas.map((ordenanza) => {
          if (ordenanza.plazo?.tipoPlazo !== 'FECHA') return ordenanza;

          const dia = ordenanza.plazo.diaCumplimiento;
          const mes = ordenanza.plazo.mesCumplimiento;
          const anio = ordenanza.plazo.anioCumplimiento;

          if (!dia || !mes || !anio) return ordenanza;

          const fechaCumplimiento =
            `${String(anio).padStart(4, '0')}-` +
            `${String(mes).padStart(2, '0')}-` +
            `${String(dia).padStart(2, '0')}`;

          if (fechaCumplimiento >= valor) return ordenanza;

          return {
            ...ordenanza,
            plazo: {
              ...ordenanza.plazo,
              diaCumplimiento: '',
              mesCumplimiento: '',
              anioCumplimiento: '',
            },
          };
        });
      }

      return { ...actual, notificacion, ordenanzas };
    });
  };

  const actualizarResponsable = (campo, valor) => {
    setDatos((actual) => ({
      ...actual,
      responsable: { ...actual.responsable, [campo]: valor },
    }));
  };

  const agregarOrdenanza = () => {
    setDatos((actual) => ({
      ...actual,
      ordenanzas: [
        ...actual.ordenanzas,
        crearOrdenanzaVacia(actual.ordenanzas.length + 1),
      ],
    }));
  };

  const actualizarOrdenanza = (index, nuevaOrdenanza) => {
    setDatos((actual) => ({
      ...actual,
      ordenanzas: actual.ordenanzas.map((ordenanza, i) =>
        i === index ? nuevaOrdenanza : ordenanza
      ),
    }));
  };

  const eliminarOrdenanza = (index) => {
    setDatos((actual) => {
      const ordenanzas = actual.ordenanzas
        .filter((_, i) => i !== index)
        .map((ordenanza, i) => ({ ...ordenanza, numeroOrden: i + 1 }));

      return { ...actual, ordenanzas };
    });
  };

  const erroresActuales = validarOrdenSanitaria(datos);
  const pasosPendientesActuales = obtenerPasosConError(erroresActuales);
  const pasosConError = validacionIntentada ? pasosPendientesActuales : [];
  const pasosCompletos = [0, 1, 2, 3, 4].filter((paso) => !pasosPendientesActuales.includes(paso));

  const solicitarVolverInicio = () => setMostrarModalSalida(true);
  const cancelarSalida = () => setMostrarModalSalida(false);

  const confirmarSalida = () => {
    limpiarProgresoOrdenSanitaria(datos.idInspeccion);
    setMostrarModalSalida(false);
    setErrorEnvio('');
    onVolverInicio?.();
  };

  const manejarAnterior = () => {
    setErrorEnvio('');

    if (mostrandoVistaPrevia) {
      setMostrandoVistaPrevia(false);
      setPasoActual(TOTAL_PASOS - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPasoActual((actual) => Math.max(0, actual - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const manejarSiguiente = () => {
    if (!validacionIntentada) {
      setErrorEnvio('');
      setPasoActual((actual) => Math.min(TOTAL_PASOS - 1, actual + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const nuevosErrores = validarOrdenSanitaria(datos);
    setErrores(nuevosErrores);

    const seccionesConError = obtenerPasosConError(nuevosErrores);

    if (seccionesConError.includes(pasoActual)) {
      setErrorEnvio(MENSAJE_VALIDACION);
      return;
    }

    const siguientePendiente = seccionesConError.find((paso) => paso > pasoActual);

    if (siguientePendiente !== undefined) {
      setErrorEnvio('');
      setPasoActual(siguientePendiente);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (seccionesConError.length > 0) {
      setErrorEnvio('');
      setPasoActual(seccionesConError[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrorEnvio('');
    setPasoActual((actual) => Math.min(TOTAL_PASOS - 1, actual + 1));
  };

  const manejarCambiarPaso = (paso) => {
    setMostrandoVistaPrevia(false);
    setPasoActual(paso);

    if (validacionIntentada && pasosPendientesActuales.includes(paso)) {
      setErrorEnvio(MENSAJE_VALIDACION);
    } else {
      setErrorEnvio('');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const manejarVistaPrevia = () => {
    const nuevosErrores = validarOrdenSanitaria(datos);

    setErrores(nuevosErrores);
    setValidacionIntentada(true);

    const seccionesConError = obtenerPasosConError(nuevosErrores);

    if (seccionesConError.length > 0) {
      setMostrandoVistaPrevia(false);
      setErrorEnvio(MENSAJE_VALIDACION);
      setPasoActual(seccionesConError[0]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setErrorEnvio('');
    setMostrandoVistaPrevia(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const manejarGuardar = async () => {
    const nuevosErrores = validarOrdenSanitaria(datos);
    setErrores(nuevosErrores);

    const seccionesConError = obtenerPasosConError(nuevosErrores);

    if (seccionesConError.length > 0) {
      setValidacionIntentada(true);
      setMostrandoVistaPrevia(false);
      setErrorEnvio(MENSAJE_VALIDACION);
      setPasoActual(seccionesConError[0]);
      return;
    }

    if (!datos.idInspeccion || Number(datos.idInspeccion) <= 0) {
      setErrorEnvio(
        'No es posible emitir la Orden Sanitaria porque no existe una inspección relacionada válida.'
      );
      return;
    }

    try {
      setGuardando(true);
      setErrorEnvio('');

      // PROVISIONAL: generar consecutivo justo al emitir.
      const numeroConsecutivo = generarConsecutivoOrdenSanitaria();

      const datosConConsecutivo = {
        ...datos,
        informacionGeneral: {
          ...datos.informacionGeneral,
          numeroConsecutivo,
        },
      };

      setDatos(datosConConsecutivo);

      const payload = prepararOrdenSanitariaParaApi(datosConConsecutivo);
      const respuesta = await crearOrdenSanitaria(payload);

      limpiarProgresoOrdenSanitaria(datos.idInspeccion);

      setOrdenRegistrada({
        ...respuesta,
        numeroConsecutivo: respuesta?.numeroConsecutivo || numeroConsecutivo,
      });
    } catch (error) {
      console.error('Error al crear la Orden Sanitaria:', error);

      setErrorEnvio(
        error?.message || 'Ocurrió un error al crear la Orden Sanitaria.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const volverAlMenuDespuesDeEmitir = () => {
    onFinalizar?.(ordenRegistrada);
    onVolverInicio?.();
  };

  const renderizarPaso = () => {
    switch (pasoActual) {
      case 0:
        return (
          <InformacionGeneral
            datos={datos.informacionGeneral}
            errores={errores}
            onChange={actualizarInformacionGeneral}
          />
        );

      case 1:
        return (
          <Ubicacion
            datos={datos.ubicacion}
            errores={errores}
            provincias={provincias}
            cantones={cantones}
            distritos={distritos}
            onChange={actualizarUbicacion}
          />
        );

      case 2:
        return (
          <Notificacion
            datos={datos.notificacion}
            errores={errores}
            onChange={actualizarNotificacion}
          />
        );

      case 3:
        return (
          <Ordenanzas
            ordenanzas={datos.ordenanzas}
            errores={errores}
            fechaNotificacion={datos.notificacion.fechaNotificacion}
            onAgregar={agregarOrdenanza}
            onActualizar={actualizarOrdenanza}
            onEliminar={eliminarOrdenanza}
          />
        );

      case 4:
        return (
          <DatosResponsable
            datos={datos.responsable}
            errores={errores}
            onChange={actualizarResponsable}
          />
        );

      default:
        return null;
    }
  };

  if (ordenRegistrada) {
    return (
      <div className="orden-pagina orden-pagina--confirmacion">
        <main className="orden-exito">
          <span className="orden-exito__etiqueta">ORDEN SANITARIA</span>

          <div className="orden-exito__icono" aria-hidden="true">✓</div>

          <p className="orden-exito__estado">PROCESO FINALIZADO</p>

          <h1 className="orden-exito__titulo">
            Orden Sanitaria enviada exitosamente
          </h1>

          <p className="orden-exito__descripcion">
            La Orden Sanitaria fue registrada correctamente en el sistema.
            El proceso de emisión ha finalizado satisfactoriamente.
          </p>

          <div className="orden-exito__detalle">
            <span className="orden-exito__detalle-etiqueta">
              NÚMERO DE CONSECUTIVO
            </span>

            <strong className="orden-exito__detalle-valor">
              {ordenRegistrada.numeroConsecutivo}
            </strong>

            <span className="orden-exito__detalle-tiempo">
              Orden Sanitaria emitida correctamente
            </span>

            <span className="orden-exito__detalle-tiempo">
              Regresando al menú principal en{' '}
              <strong>{segundosRestantes}</strong>{' '}
              {segundosRestantes === 1 ? 'segundo' : 'segundos'}
            </span>
          </div>

          <button
            type="button"
            className="orden-exito__boton"
            onClick={volverAlMenuDespuesDeEmitir}
          >
            Ir al menú principal
          </button>
        </main>
      </div>
    );
  }

  const esMensajeValidacion = errorEnvio === MENSAJE_VALIDACION;

  return (
    <div className="orden-pagina">
      <EncabezadoOrdenSanitaria
        inspeccionRelacionada={infoInspeccion}
        onVolverInicio={solicitarVolverInicio}
      />

      <NavegacionOrdenSanitaria
        pasoActual={pasoActual}
        pasosCompletos={pasosCompletos}
        pasosConError={pasosConError}
        onCambiarPaso={manejarCambiarPaso}
      />

      {errorEnvio && !esMensajeValidacion && (
        <div className="orden-alerta-error-flotante" role="alert">
          <span className="orden-alerta-error-flotante__icono">!</span>

          <div className="orden-alerta-error-flotante__contenido">
            <strong>Error</strong>
            <span>{errorEnvio}</span>
          </div>
        </div>
      )}

      <div className="orden-contenedor">
        <main className="orden-tarjeta">
          {errorEnvio && esMensajeValidacion && (
            <div className="orden-alerta-validacion" role="alert">
              {errorEnvio}
            </div>
          )}

          {mostrandoVistaPrevia ? (
            <VistaPreviaOrdenSanitaria
              datos={datos}
              provincias={provincias}
              cantones={cantones}
              distritos={distritos}
            />
          ) : (
            renderizarPaso()
          )}
        </main>
      </div>

      <footer className="orden-pie">
        <button
          type="button"
          className="orden-boton orden-boton--anterior"
          onClick={manejarAnterior}
          disabled={(!mostrandoVistaPrevia && pasoActual === 0) || guardando}
        >
          ← Anterior
        </button>

        <span className="orden-pie__contador">
          {mostrandoVistaPrevia
            ? 'Vista previa'
            : `Paso ${pasoActual + 1} de ${TOTAL_PASOS}`}
        </span>

        {mostrandoVistaPrevia ? (
          <button
            type="button"
            className="orden-boton orden-boton--siguiente"
            onClick={manejarGuardar}
            disabled={guardando}
          >
            {guardando ? 'Registrando…' : 'Emitir Orden Sanitaria'}
          </button>
        ) : pasoActual < TOTAL_PASOS - 1 ? (
          <button
            type="button"
            className="orden-boton orden-boton--siguiente"
            onClick={manejarSiguiente}
            disabled={guardando}
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            className="orden-boton orden-boton--siguiente"
            onClick={manejarVistaPrevia}
            disabled={guardando}
          >
            Vista previa →
          </button>
        )}
      </footer>

      {mostrarModalSalida && (
        <ModalConfirmacionSalidaOrden
          onCancelar={cancelarSalida}
          onConfirmar={confirmarSalida}
        />
      )}
    </div>
  );
}