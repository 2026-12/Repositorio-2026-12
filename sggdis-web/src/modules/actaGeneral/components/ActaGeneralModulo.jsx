import { useCallback, useEffect } from 'react';
import { useActaGeneral } from '../hooks/useActaGeneral';
import { useConfirmacionSalida } from '../hooks/useConfirmacionSalida';
import { APARTADOS_ACTA, APARTADO_VISTA_PREVIA } from '../config/actaGeneral';
import { eliminarActaGeneral } from '../services/actaGeneralService';
import { limpiarActaActiva } from '../services/progresoActaGeneralService';
import ApartadoInfoGeneral from './ApartadoInfoGeneral';
import ApartadoResponsable from './ApartadoResponsable';
import ApartadoMotivo from './ApartadoMotivo';
import ApartadoHallazgos from './ApartadoHallazgos';
import ApartadoAcciones from './ApartadoAcciones';
import ApartadoCierre from './ApartadoCierre';
import VistaPreviaActaGeneral from './VistaPreviaActaGeneral';
import ModalConfirmacionSalida from './ModalConfirmacionSalida';
import AvisoCamposObligatorios from './AvisoCamposObligatorios';
import mapaDorado from '../../../assets/mapa-dorado.png';
import './ActaGeneralModulo.css';

// Índice del apartado activo dentro de APARTADOS_ACTA (para pintar la
// pestaña activa y el "Paso X de Y").
function indiceApartado(id) {
  return APARTADOS_ACTA.findIndex((apartado) => apartado.id === id);
}

// Lleva al inspector al campo que quedó sin llenar: lo centra en pantalla y
// le da el foco. La clave del error coincide con el id del campo; los
// selectores múltiples y la lista de guías/personas no tienen un id propio
// por clave, así que se marcan con data-campo y se enfoca su primer control.
function enfocarCampo(clave) {
  const elemento =
    document.getElementById(clave) ?? document.querySelector(`[data-campo="${clave}"]`);

  if (!elemento) return;

  const controlEnfocable = elemento.matches('input, select, textarea, button')
    ? elemento
    : elemento.querySelector('input, select, textarea, button');

  (controlEnfocable ?? elemento).scrollIntoView({ behavior: 'smooth', block: 'center' });
  controlEnfocable?.focus({ preventScroll: true });
}

// Shell del wizard del Acta de Inspección General (HU-004): header con el
// folio del acta, tabs de apartados (indicador de progreso) y el apartado
// activo. Los seis apartados (HU-006 a HU-011) tienen formulario real. Al
// "Finalizar" el último apartado se pasa a la vista previa
// (VistaPreviaActaGeneral), desde donde se guarda y envía el acta completa a
// la base de datos.
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
    avisoValidacion,
    cerrarAvisoValidacion,
    avanzarAlSiguienteApartado,
    retrocederAlApartadoAnterior,
    enviando,
    errorEnvio,
    enviada,
    enviarActa,
  } = useActaGeneral();

  const salida = useConfirmacionSalida();

  // Al intentar continuar con campos sin llenar: se lleva al inspector al
  // primer campo que falta (se centra y se enfoca) y el aviso flotante se
  // cierra solo a los pocos segundos, igual que en Guía de Inspección.
  useEffect(() => {
    if (!avisoValidacion) return undefined;

    const cuadro = requestAnimationFrame(() => enfocarCampo(avisoValidacion.primerCampo));
    const temporizador = setTimeout(cerrarAvisoValidacion, 3500);

    return () => {
      cancelAnimationFrame(cuadro);
      clearTimeout(temporizador);
    };
    // cerrarAvisoValidacion cambia en cada render; solo importa el aviso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avisoValidacion]);

  const indiceActivo = indiceApartado(apartadoActivo);
  const enVistaPrevia = apartadoActivo === APARTADO_VISTA_PREVIA;

  // Mientras se guarda o se envía no se puede cambiar de apartado; una vez
  // enviada, el acta ya no se edita.
  const navegacionBloqueada = guardando || enviando || enviada;

  // Una vez enviada, "Volver al menú" sale directo: el acta ya quedó guardada
  // en la BD y no hay nada que descartar (el modal la eliminaría).
  const volverAlMenu = enviada ? onVolverInicio : salida.abrir;

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
          const activo = !enviada && indice === indiceActivo;

          return (
            <button
              key={apartado.id}
              type="button"
              className={`acta-tab ${activo ? 'acta-tab--activa' : ''} ${completo ? 'acta-tab--completa' : ''}`}
              aria-current={activo ? 'step' : undefined}
              disabled={navegacionBloqueada}
              onClick={() => irAApartado(apartado.id)}
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

          {apartadoActivo ==='info-general' && (
            <ApartadoInfoGeneral
              datos={infoGeneral}
              errores={erroresInfoGeneral}
              onCambiarCampo={actualizarCampoInfoGeneral}
            />
          )}

          {apartadoActivo ==='responsable' && (
            <ApartadoResponsable
              datos={responsable}
              errores={erroresResponsable}
              onCambiarCampo={actualizarCampoResponsable}
            />
          )}

          {apartadoActivo ==='motivo' && (
            <ApartadoMotivo
              datos={motivo}
              errores={erroresMotivo}
              onCambiarCampo={actualizarCampoMotivo}
            />
          )}

          {apartadoActivo ==='hallazgos' && (
            <ApartadoHallazgos
              datos={hallazgos}
              errores={erroresHallazgos}
              onCambiarCampo={actualizarCampoHallazgos}
            />
          )}

          {apartadoActivo ==='acciones' && (
            <ApartadoAcciones
              datos={acciones}
              errores={erroresAcciones}
              onCambiarCampo={actualizarCampoAcciones}
            />
          )}

          {apartadoActivo ==='cierre' && (
            <ApartadoCierre
              horaInicio={horaInicio}
              datos={cierre}
              errores={erroresCierre}
              onAgregarPersona={agregarPersonaPresente}
              onEliminarPersona={eliminarPersonaPresente}
              onCambiarPersona={actualizarPersonaPresente}
            />
          )}

          {enVistaPrevia && !enviada && (
            <VistaPreviaActaGeneral
              numeroActa={numeroActa}
              infoGeneral={infoGeneral}
              responsable={responsable}
              motivo={motivo}
              hallazgos={hallazgos}
              acciones={acciones}
              cierre={cierre}
            />
          )}
        </div>

        {errorGuardado && (
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
        ) : (
          <>
            {enVistaPrevia || indiceActivo > 0 ? (
              <button
                type="button"
                className="acta-boton acta-boton--secundario"
                disabled={guardando || enviando}
                onClick={retrocederAlApartadoAnterior}
              >
                ← Anterior
              </button>
            ) : (
              <span className="acta-pie__espaciador" aria-hidden="true" />
            )}

            <span className="acta-pie__paso">
              {enVistaPrevia ? 'Vista previa' : `Paso ${indiceActivo + 1} de ${APARTADOS_ACTA.length}`}
            </span>

            {enVistaPrevia ? (
              // Vista previa: el acta ya está completa; aquí se guarda en la BD y se envía.
              <button
                type="button"
                className="acta-boton acta-boton--secundario"
                disabled={enviando}
                onClick={enviarActa}
              >
                {enviando ? 'Enviando…' : 'Guardar y enviar acta'}
              </button>
            ) : (
              // En el último apartado el botón dice "Finalizar": valida toda el
              // acta y, si está completa, lleva a la vista previa.
              <button
                type="button"
                className="acta-boton acta-boton--secundario"
                disabled={guardando}
                onClick={avanzarAlSiguienteApartado}
              >
                {guardando
                  ? 'Guardando…'
                  : indiceActivo === APARTADOS_ACTA.length - 1
                    ? 'Finalizar'
                    : 'Siguiente →'}
              </button>
            )}
          </>
        )}
      </footer>

      {avisoValidacion && <AvisoCamposObligatorios />}

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
