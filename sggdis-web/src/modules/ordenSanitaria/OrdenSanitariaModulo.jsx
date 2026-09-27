import { useEffect, useMemo, useState } from 'react';
import DatosResponsable from './components/DatosResponsable';
import InformacionGeneral from './components/InformacionGeneral';
import Notificacion from './components/Notificacion';
import Ordenanzas from './components/Ordenanza/Ordenanzas';
import Ubicacion from './components/Ubicacion';
import EncabezadoOrdenSanitaria from './components/comunes/EncabezadoOrdenSanitaria';
import NavegacionOrdenSanitaria from './components/comunes/NavegacionOrdenSanitaria';
import { crearOrdenanzaVacia, crearOrdenSanitariaInicial, prepararOrdenSanitariaParaApi } from './domain/estructuraOrdenSanitaria';
import { validarOrdenSanitaria } from './domain/validacionOrdenSanitaria';
import { crearOrdenSanitaria } from './services/ordenSanitariaService';
import { obtenerCantones, obtenerDistritos, obtenerProvincias } from './services/ubicacionesService';
import './styles/ordenSanitaria.css';

const TOTAL_PASOS = 5;

export default function OrdenSanitariaModulo({ idInspeccion, inspeccionRelacionada, onFinalizar, onVolverInicio }) {
  const infoInspeccion = useMemo(() => inspeccionRelacionada || {
    idInspeccion: idInspeccion || '',
    consecutivo: '',
    nombreEstablecimiento: '',
    nombrePersonaNotificar: '',
    identificacionPersonaNotificar: '',
    tipoEstablecimiento: '',
  }, [idInspeccion, inspeccionRelacionada]);

  const [datos, setDatos] = useState(() => crearOrdenSanitariaInicial({
    idInspeccion: infoInspeccion.idInspeccion,
    nombreEstablecimiento: infoInspeccion.nombreEstablecimiento || '',
  }));

  const [pasoActual, setPasoActual] = useState(0);
  const [errores, setErrores] = useState({});
  const [provincias, setProvincias] = useState([]);
  const [cantones, setCantones] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [ordenRegistrada, setOrdenRegistrada] = useState(null);

  useEffect(() => {
    setDatos((actual) => ({
      ...actual,
      idInspeccion: infoInspeccion.idInspeccion || actual.idInspeccion,
      informacionGeneral: {
        ...actual.informacionGeneral,
        numeroConsecutivo: infoInspeccion.consecutivo || '',
        nombreCompleto: infoInspeccion.nombrePersonaNotificar || '',
        identificacion: infoInspeccion.identificacionPersonaNotificar || '',
        nombreEstablecimiento: infoInspeccion.nombreEstablecimiento || '',
      },
    }));
  }, [infoInspeccion]);

  useEffect(() => {
    obtenerProvincias().then(setProvincias).catch(() => setErrorEnvio('No fue posible cargar las provincias.'));
  }, []);

  useEffect(() => {
    if (!datos.ubicacion.idProvincia) {
      setCantones([]);
      return;
    }

    obtenerCantones(datos.ubicacion.idProvincia).then(setCantones).catch(() => setErrorEnvio('No fue posible cargar los cantones.'));
  }, [datos.ubicacion.idProvincia]);

  useEffect(() => {
    if (!datos.ubicacion.idCanton) {
      setDistritos([]);
      return;
    }

    obtenerDistritos(datos.ubicacion.idCanton).then(setDistritos).catch(() => setErrorEnvio('No fue posible cargar los distritos.'));
  }, [datos.ubicacion.idCanton]);

  const actualizarInformacionGeneral = (campo, valor) => {
    setDatos((actual) => ({ ...actual, informacionGeneral: { ...actual.informacionGeneral, [campo]: valor } }));
  };

  const actualizarUbicacion = (campo, valor) => {
    setDatos((actual) => ({ ...actual, ubicacion: { ...actual.ubicacion, [campo]: valor } }));
  };

  const actualizarNotificacion = (campo, valor) => {
    setDatos((actual) => ({ ...actual, notificacion: { ...actual.notificacion, [campo]: valor } }));
  };

  const actualizarResponsable = (campo, valor) => {
    setDatos((actual) => ({ ...actual, responsable: { ...actual.responsable, [campo]: valor } }));
  };

  const agregarOrdenanza = () => {
    setDatos((actual) => ({ ...actual, ordenanzas: [...actual.ordenanzas, crearOrdenanzaVacia(actual.ordenanzas.length + 1)] }));
  };

  const actualizarOrdenanza = (index, nuevaOrdenanza) => {
    setDatos((actual) => ({ ...actual, ordenanzas: actual.ordenanzas.map((ordenanza, i) => i === index ? nuevaOrdenanza : ordenanza) }));
  };

  const eliminarOrdenanza = (index) => {
    setDatos((actual) => {
      const ordenanzas = actual.ordenanzas.filter((_, i) => i !== index).map((ordenanza, i) => ({ ...ordenanza, numeroOrden: i + 1 }));
      return { ...actual, ordenanzas };
    });
  };

  const manejarAnterior = () => {
    setErrorEnvio('');
    setPasoActual((actual) => Math.max(0, actual - 1));
  };

  const manejarSiguiente = () => {
    setErrorEnvio('');
    setPasoActual((actual) => Math.min(TOTAL_PASOS - 1, actual + 1));
  };

  const manejarCambiarPaso = (paso) => {
    setErrorEnvio('');
    setPasoActual(paso);
  };

  const pasosCompletos = [];

  if (
    datos.informacionGeneral?.numeroConsecutivo?.trim() &&
    datos.informacionGeneral?.nombreCompleto?.trim() &&
    datos.informacionGeneral?.condicion?.trim() &&
    datos.informacionGeneral?.identificacion?.trim() &&
    datos.informacionGeneral?.nombreEstablecimiento?.trim()
  ) pasosCompletos.push(0);

  if (
    datos.ubicacion?.idProvincia &&
    datos.ubicacion?.idCanton &&
    datos.ubicacion?.idDistrito &&
    datos.ubicacion?.direccionExacta?.trim()
  ) pasosCompletos.push(1);

  if (datos.notificacion?.fechaEmision && datos.notificacion?.fechaNotificacion) pasosCompletos.push(2);

  if (
    datos.ordenanzas?.length > 0 &&
    datos.ordenanzas.every((ordenanza) => (
      ordenanza.ordenanza?.trim() &&
      ordenanza.fundamentoLegal?.trim() &&
      ordenanza.plazo?.tipoPlazo &&
      (
        ordenanza.plazo.tipoPlazo === 'FECHA'
          ? ordenanza.plazo.diaCumplimiento && ordenanza.plazo.mesCumplimiento && ordenanza.plazo.anioCumplimiento
          : ordenanza.plazo.cantidad
      )
    ))
  ) pasosCompletos.push(3);

  if (
    datos.responsable?.nombreCompleto?.trim() &&
    datos.responsable?.cargo?.trim() &&
    datos.responsable?.unidadOrganizativaArs?.trim()
  ) pasosCompletos.push(4);

  const manejarGuardar = async () => {
    const nuevosErrores = validarOrdenSanitaria(datos);
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) {
      setErrorEnvio('Complete los campos obligatorios antes de emitir la Orden Sanitaria.');
      return;
    }

    try {
      setGuardando(true);
      setErrorEnvio('');

      const payload = prepararOrdenSanitariaParaApi(datos);
      const respuesta = await crearOrdenSanitaria(payload);

      setOrdenRegistrada(respuesta);
      if (onFinalizar) onFinalizar(respuesta);
    } catch (error) {
      setErrorEnvio(error.message || 'No fue posible registrar la Orden Sanitaria.');
    } finally {
      setGuardando(false);
    }
  };

  const renderizarPaso = () => {
    switch (pasoActual) {
      case 0:
        return <InformacionGeneral datos={datos.informacionGeneral} errores={errores} onChange={actualizarInformacionGeneral} />;

      case 1:
        return <Ubicacion datos={datos.ubicacion} errores={errores} provincias={provincias} cantones={cantones} distritos={distritos} onChange={actualizarUbicacion} />;

      case 2:
        return <Notificacion datos={datos.notificacion} errores={errores} onChange={actualizarNotificacion} />;

      case 3:
        return <Ordenanzas ordenanzas={datos.ordenanzas} errores={errores} onAgregar={agregarOrdenanza} onActualizar={actualizarOrdenanza} onEliminar={eliminarOrdenanza} />;

      case 4:
        return <DatosResponsable datos={datos.responsable} errores={errores} onChange={actualizarResponsable} />;

      default:
        return null;
    }
  };

  if (ordenRegistrada) {
    return (
      <div className="orden-pagina">
        <EncabezadoOrdenSanitaria inspeccionRelacionada={infoInspeccion} onVolverInicio={onVolverInicio} />

        <div className="orden-contenedor">
          <main className="orden-tarjeta">
            <div className="orden-confirmacion">
              <div className="orden-confirmacion__icono">✓</div>
              <h2>Orden Sanitaria guardada correctamente</h2>
              <p>La información fue registrada correctamente en el sistema.</p>

              <div className="orden-confirmacion__id">
                <span>Identificador</span>
                <strong>{ordenRegistrada.idOrdenSanitaria}</strong>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="orden-pagina">
      <EncabezadoOrdenSanitaria inspeccionRelacionada={infoInspeccion} onVolverInicio={onVolverInicio} />

      <NavegacionOrdenSanitaria pasoActual={pasoActual} pasosCompletos={pasosCompletos} onCambiarPaso={manejarCambiarPaso} />

      <div className="orden-contenedor">
        <main className="orden-tarjeta">
          {errorEnvio && (
            <div className="orden-alerta">
              <strong>No se pudo continuar</strong>
              <span>{errorEnvio}</span>
            </div>
          )}

          {renderizarPaso()}
        </main>
      </div>

      <footer className="orden-pie">
        <button type="button" className="orden-boton orden-boton--anterior" onClick={manejarAnterior} disabled={pasoActual === 0 || guardando}>
          ← Anterior
        </button>

        <span className="orden-pie__contador">Paso {pasoActual + 1} de {TOTAL_PASOS}</span>

        {pasoActual < TOTAL_PASOS - 1 ? (
          <button type="button" className="orden-boton orden-boton--siguiente" onClick={manejarSiguiente} disabled={guardando}>
            Siguiente →
          </button>
        ) : (
          <button type="button" className="orden-boton orden-boton--siguiente" onClick={manejarGuardar} disabled={guardando}>
            {guardando ? 'Registrando…' : 'Emitir Orden Sanitaria'}
          </button>
        )}
      </footer>
    </div>
  );
}