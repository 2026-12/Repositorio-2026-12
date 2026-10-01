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
import ModalConfirmacionSalida from './ModalConfirmacionSalida';
import mapaDorado from '../../../assets/mapa-dorado.png';
import './ActaGeneralModulo.css';

// Índice del apartado activo dentro de APARTADOS_ACTA (para pintar el
// indicador de progreso de los tabs).
function indiceApartado(id) {
  return APARTADOS_ACTA.findIndex((apartado) => apartado.id === id);
}

// Shell del wizard del Acta de Inspección General (HU-004): header con el
// folio del acta, tabs de apartados (indicador de progreso) y el apartado
// activo. Los Apartados I a V (HU-006 a HU-010) ya tienen formulario
// real; el VI es la próxima HU (HU-011) y se muestra "en construcción".
function ActaGeneralModulo({ onVolverInicio }) {
  const {
    idActa,
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
    guardando,
    errorGuardado,
    avanzarAlSiguienteApartado,
    retrocederAlApartadoAnterior,
  } = useActaGeneral();

  const salida = useConfirmacionSalida();

  const indiceActivo = indiceApartado(apartadoActivo);

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
          <button type="button" className="acta-boton-volver" onClick={salida.abrir}>
            ← Volver al menú
          </button>
        </div>
      </header>

      <nav className="acta-tabs" aria-label="Apartados del acta">
        {APARTADOS_ACTA.map((apartado, indice) => {
          // Los apartados que todavía no tienen formulario real (HU-011) no
          // están en estadoApartados, así que por ahora se quedan sin marca
          // de completado/pendiente.
          const completo = estadoApartados[apartado.id] === 'completo';

          return (
            <button
              key={apartado.id}
              type="button"
              className={`acta-tab ${indice === indiceActivo ? 'acta-tab--activa' : ''} ${completo ? 'acta-tab--completa' : ''}`}
              disabled={guardando}
              onClick={() => irAApartado(apartado.id)}
            >
              <span className="acta-tab__numero" aria-hidden="true">
                {completo ? '✓' : apartado.numero}
              </span>
              {apartado.etiqueta}
              {completo && <span className="acta-tab__srSolo"> (completo)</span>}
            </button>
          );
        })}
      </nav>

      <main className="acta-contenido">
        <div className="acta-tarjeta">
          {apartadoActivo === 'info-general' && (
            <ApartadoInfoGeneral
              datos={infoGeneral}
              errores={erroresInfoGeneral}
              onCambiarCampo={actualizarCampoInfoGeneral}
            />
          )}

          {apartadoActivo === 'responsable' && (
            <ApartadoResponsable
              datos={responsable}
              errores={erroresResponsable}
              onCambiarCampo={actualizarCampoResponsable}
            />
          )}

          {apartadoActivo === 'motivo' && (
            <ApartadoMotivo
              datos={motivo}
              errores={erroresMotivo}
              onCambiarCampo={actualizarCampoMotivo}
            />
          )}

          {apartadoActivo === 'hallazgos' && (
            <ApartadoHallazgos
              datos={hallazgos}
              errores={erroresHallazgos}
              onCambiarCampo={actualizarCampoHallazgos}
            />
          )}

          {apartadoActivo === 'acciones' && (
            <ApartadoAcciones
              datos={acciones}
              errores={erroresAcciones}
              onCambiarCampo={actualizarCampoAcciones}
            />
          )}

          {apartadoActivo !== 'info-general' &&
            apartadoActivo !== 'responsable' &&
            apartadoActivo !== 'motivo' &&
            apartadoActivo !== 'hallazgos' &&
            apartadoActivo !== 'acciones' && (
              <section className="acta-apartado">
                <p className="acta-apartado__etiqueta">Próximamente</p>
                <h2 className="acta-apartado__titulo">Este apartado está en construcción</h2>
                <p className="acta-apartado__descripcion">
                  Corresponde a otra historia de usuario del Acta General (HU-011) y todavía no está implementado.
                </p>
              </section>
            )}
        </div>

        {errorGuardado && (
          <div className="acta-alerta" role="alert">
            <strong>No se pudo guardar</strong>
            <span>{errorGuardado}</span>
          </div>
        )}

      </main>

      {/* Barra de navegación inferior fija: mismo estándar de colores que el
          footer del módulo de Guía de Inspección (fondo degradado azul,
          ambos botones en contorno blanco sobre el mismo fondo del footer). */}
      <footer className="acta-pie acta-pie--fija">
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
          <span className="acta-pie__espaciador" aria-hidden="true" />
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
