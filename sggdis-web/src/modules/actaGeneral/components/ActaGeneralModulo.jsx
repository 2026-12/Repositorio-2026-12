import { useCallback } from 'react';
import { useActaGeneral } from '../hooks/useActaGeneral';
import { useConfirmacionSalida } from '../hooks/useConfirmacionSalida';
import { APARTADOS_ACTA } from '../config/actaGeneral';
import { eliminarActaGeneral } from '../services/actaGeneralService';
import { limpiarActaActiva } from '../services/progresoActaGeneralService';
import ApartadoInfoGeneral from './ApartadoInfoGeneral';
import ApartadoResponsable from './ApartadoResponsable';
import ApartadoMotivo from './ApartadoMotivo';
import ApartadoHallazgos from './ApartadoHallazgos';
import ApartadoAcciones from './ApartadoAcciones';
import ApartadoCierre from './ApartadoCierre';
import ResumenActa from './ResumenActa';
import ModalConfirmacionSalida from './ModalConfirmacionSalida';
import mapaDorado from '../../../assets/mapa-dorado.png';
import './ActaGeneralModulo.css';

// Índice del apartado activo dentro de APARTADOS_ACTA (para pintar la
// pestaña activa y el "Paso X de Y").
function indiceApartado(id) {
  return APARTADOS_ACTA.findIndex((apartado) => apartado.id === id);
}

// Shell del wizard del Acta de Inspección General (HU-004): header con el
// folio del acta, tabs de apartados (indicador de progreso) y el apartado
// activo. Los seis apartados (HU-006 a HU-011) tienen formulario real. Al
// "Finalizar" el último apartado se pasa a la vista general (ResumenActa),
// desde donde se guarda y envía el acta completa a la base de datos.
function ActaGeneralModulo({ onVolverInicio }) {
  const {
    idActa,
    numeroActa,
    creando,
    errorCreacion,
    apartadoActivo,
    irAApartado,
    estadoApartados,
    infoGeneral,
    erroresInfoGeneral,
    actualizarCampoInfoGeneral,
    responsable,
    erroresResponsable,
    actualizarCampoResponsable,
    motivo,
    erroresMotivo,
    actualizarCampoMotivo,
    hallazgos,
    erroresHallazgos,
    actualizarCampoHallazgos,
    acciones,
    erroresAcciones,
    actualizarCampoAcciones,
    horaInicio,
    cierre,
    erroresCierre,
    agregarPersonaPresente,
    eliminarPersonaPresente,
    actualizarPersonaPresente,
    guardando,
    errorGuardado,
    avanzarAlSiguienteApartado,
    retrocederAlApartadoAnterior,
    avisoFinalizacion,
    finalizarActa,
    mostrandoResumen,
    volverAEditar,
    enviando,
    errorEnvio,
    enviada,
    enviarActa,
  } = useActaGeneral();

  const salida = useConfirmacionSalida();

  const indiceActivo = indiceApartado(apartadoActivo);

  // Mientras se guarda o se envía no se puede cambiar de apartado; una vez
  // enviada, el acta ya no se edita.
  const navegacionBloqueada = guardando || enviando || enviada;

  // Una vez enviada, "Volver al menú" sale directo: el acta ya quedó guardada
  // en la BD y no hay nada que descartar (el modal la eliminaría).
  const volverAlMenu = enviada ? onVolverInicio : salida.abrir;

  const seleccionarApartado = (idApartado) => {
    if (mostrandoResumen) {
      volverAEditar(idApartado);
    } else {
      irAApartado(idApartado);
    }
  };

  // Confirmó que quiere salir: se descarta el acta de verdad (backend +
  // localStorage), para que la próxima vez que entre a Acta General
  // arranque en blanco en vez de retomar esta.
  const salirSinGuardar = useCallback(async () => {
    salida.setError(null);
    salida.setEliminando(true);

    if (idActa) {
      try {
        await eliminarActaGeneral(idActa);
      } catch (error) {
        salida.setError(`No se pudo salir del acta: ${error.message}`);
        salida.setEliminando(false);
        return;
      }
    }

    limpiarActaActiva();

    salida.cerrar();
    salida.setEliminando(false);

    onVolverInicio();
  }, [idActa, onVolverInicio, salida]);

  if (creando) {
    return (
      <div className="acta-modulo acta-modulo--cargando">
        <p>Creando el acta de inspección…</p>
      </div>
    );
  }

  if (errorCreacion) {
    return (
      <div className="acta-modulo acta-modulo--cargando">
        <div className="acta-alerta" role="alert">
          <strong>No se pudo crear el acta</strong>
          <span>{errorCreacion}</span>
        </div>
        <button type="button" className="acta-boton acta-boton--secundario" onClick={onVolverInicio}>
          ← Volver al menú
        </button>
      </div>
    );
  }

  return (
    <div className="acta-modulo">
      <header className="acta-cabecera">
        <div className="acta-cabecera__marca">
          <div className="acta-cabecera__logo">
            <img src={mapaDorado} alt="Ministerio de Salud de Costa Rica" />
          </div>
          <div>
            <h1>Acta de Inspección General</h1>
            <p>Ministerio de Salud de Costa Rica — SGGDIS</p>
          </div>
        </div>

        <div className="acta-cabecera__derecha">
          <button type="button" className="acta-boton-volver" onClick={volverAlMenu} disabled={enviando}>
            ← Volver al menú
          </button>
        </div>
      </header>

      <nav className="acta-tabs" aria-label="Apartados del acta">
        {APARTADOS_ACTA.map((apartado, indice) => {
          const completo = estadoApartados[apartado.id] === 'completo';
          const activo = !mostrandoResumen && !enviada && indice === indiceActivo;

          return (
            <button
              key={apartado.id}
              type="button"
              className={`acta-tab ${activo ? 'acta-tab--activa' : ''} ${completo ? 'acta-tab--completa' : ''}`}
              aria-current={activo ? 'step' : undefined}
              disabled={navegacionBloqueada}
              onClick={() => seleccionarApartado(apartado.id)}
            >
              {apartado.etiqueta}
              {completo && <span className="acta-tab__srSolo"> (completo)</span>}
            </button>
          );
        })}
      </nav>

      <main className="acta-contenido">
        <div className="acta-tarjeta">
          {enviada && (
            <div className="acta-envio-exitoso" role="status">
              <span className="acta-envio-exitoso__etiqueta">ACTA ENVIADA</span>
              <h2>El acta {numeroActa} se guardó correctamente</h2>
              <p>Toda la información del acta quedó registrada en el sistema y el acta quedó finalizada.</p>
            </div>
          )}

          {mostrandoResumen && !enviada && (
            <ResumenActa
              infoGeneral={infoGeneral}
              responsable={responsable}
              motivo={motivo}
              hallazgos={hallazgos}
              acciones={acciones}
              cierre={cierre}
              bloqueado={enviando}
              onEditarApartado={volverAEditar}
            />
          )}

          {!mostrandoResumen && apartadoActivo === 'info-general' && (
            <ApartadoInfoGeneral
              datos={infoGeneral}
              errores={erroresInfoGeneral}
              onCambiarCampo={actualizarCampoInfoGeneral}
            />
          )}

          {!mostrandoResumen && apartadoActivo === 'responsable' && (
            <ApartadoResponsable
              datos={responsable}
              errores={erroresResponsable}
              onCambiarCampo={actualizarCampoResponsable}
            />
          )}

          {!mostrandoResumen && apartadoActivo === 'motivo' && (
            <ApartadoMotivo
              datos={motivo}
              errores={erroresMotivo}
              onCambiarCampo={actualizarCampoMotivo}
            />
          )}

          {!mostrandoResumen && apartadoActivo === 'hallazgos' && (
            <ApartadoHallazgos
              datos={hallazgos}
              errores={erroresHallazgos}
              onCambiarCampo={actualizarCampoHallazgos}
            />
          )}

          {!mostrandoResumen && apartadoActivo === 'acciones' && (
            <ApartadoAcciones
              datos={acciones}
              errores={erroresAcciones}
              onCambiarCampo={actualizarCampoAcciones}
            />
          )}

          {!mostrandoResumen && apartadoActivo === 'cierre' && (
            <ApartadoCierre
              horaInicio={horaInicio}
              datos={cierre}
              errores={erroresCierre}
              onAgregarPersona={agregarPersonaPresente}
              onEliminarPersona={eliminarPersonaPresente}
              onCambiarPersona={actualizarPersonaPresente}
            />
          )}
        </div>

        {avisoFinalizacion && !mostrandoResumen && (
          <div className="acta-alerta" role="alert">
            <strong>Faltan datos por completar</strong>
            <span>{avisoFinalizacion}</span>
          </div>
        )}

        {errorGuardado && !mostrandoResumen && (
          <div className="acta-alerta" role="alert">
            <strong>No se pudo guardar</strong>
            <span>{errorGuardado}</span>
          </div>
        )}

        {errorEnvio && (
          <div className="acta-alerta" role="alert">
            <strong>No se pudo enviar el acta</strong>
            <span>{errorEnvio}</span>
          </div>
        )}

      </main>

      {/* Barra de navegación inferior fija: mismo estándar de colores que el
          footer del módulo de Guía de Inspección (fondo degradado azul,
          ambos botones en contorno blanco sobre el mismo fondo del footer). */}
      <footer className="acta-pie acta-pie--fija">
        {enviada ? (
          <>
            <span className="acta-pie__espaciador" aria-hidden="true" />
            <span className="acta-pie__paso">Acta enviada</span>
            <button type="button" className="acta-boton acta-boton--secundario" onClick={onVolverInicio}>
              Volver al menú
            </button>
          </>
        ) : mostrandoResumen ? (
          <>
            <button
              type="button"
              className="acta-boton acta-boton--secundario"
              disabled={enviando}
              onClick={() => volverAEditar()}
            >
              ← Volver a editar
            </button>

            <span className="acta-pie__paso">Vista general</span>

            <button
              type="button"
              className="acta-boton acta-boton--secundario"
              disabled={enviando}
              onClick={enviarActa}
            >
              {enviando ? 'Enviando…' : 'Guardar y enviar acta'}
            </button>
          </>
        ) : (
          <>
            {indiceActivo > 0 ? (
              <button
                type="button"
                className="acta-boton acta-boton--secundario"
                disabled={guardando}
                onClick={retrocederAlApartadoAnterior}
              >
                ← Anterior
              </button>
            ) : (
              <span className="acta-pie__espaciador" aria-hidden="true" />
            )}

            <span className="acta-pie__paso">
              Paso {indiceActivo + 1} de {APARTADOS_ACTA.length}
            </span>

            {indiceActivo < APARTADOS_ACTA.length - 1 ? (
              <button
                type="button"
                className="acta-boton acta-boton--secundario"
                disabled={guardando}
                onClick={avanzarAlSiguienteApartado}
              >
                {guardando ? 'Guardando…' : 'Siguiente →'}
              </button>
            ) : (
              // Último apartado: "Finalizar" valida todo el acta y, si está
              // completa, pasa a la vista general para guardarla y enviarla.
              <button
                type="button"
                className="acta-boton acta-boton--secundario"
                disabled={guardando}
                onClick={finalizarActa}
              >
                {guardando ? 'Guardando…' : 'Finalizar'}
              </button>
            )}
          </>
        )}
      </footer>

      {salida.mostrar && (
        <ModalConfirmacionSalida
          error={salida.error}
          eliminando={salida.eliminando}
          onCancelar={salida.cancelar}
          onConfirmar={salirSinGuardar}
        />
      )}
    </div>
  );
}

export default ActaGeneralModulo;
