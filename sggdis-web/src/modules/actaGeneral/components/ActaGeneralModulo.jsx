import { useActaGeneral } from '../hooks/useActaGeneral';
import { APARTADOS_ACTA } from '../config/actaGeneral';
import ApartadoInfoGeneral from './ApartadoInfoGeneral';
import './ActaGeneralModulo.css';

// Índice del apartado activo dentro de APARTADOS_ACTA (para pintar el
// indicador de progreso de los tabs).
function indiceApartado(id) {
  return APARTADOS_ACTA.findIndex((apartado) => apartado.id === id);
}

// Shell del wizard del Acta de Inspección General (HU-004): header con el
// folio del acta, tabs de apartados (indicador de progreso) y el apartado
// activo. Por ahora solo el Apartado I (HU-006) tiene formulario real; los
// demás son las próximas HU (HU-007 a HU-011) y se muestran "en construcción".
function ActaGeneralModulo({ onVolverInicio }) {
  const {
    numeroActa,
    creando,
    errorCreacion,
    apartadoActivo,
    setApartadoActivo,
    infoGeneral,
    erroresInfoGeneral,
    actualizarCampoInfoGeneral,
    guardando,
    errorGuardado,
    guardarYAvanzar,
  } = useActaGeneral();

  const indiceActivo = indiceApartado(apartadoActivo);

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
          <div className="acta-cabecera__logo">MS</div>
          <div>
            <h1>Acta de Inspección General</h1>
            <p>Ministerio de Salud de Costa Rica — SGGDIS</p>
          </div>
        </div>

        <div className="acta-cabecera__derecha">
          <span className="acta-folio">
            <span className="acta-folio__punto" />
            N° {numeroActa}
          </span>
          <button type="button" className="acta-boton-volver" onClick={onVolverInicio}>
            ← Volver al menú
          </button>
        </div>
      </header>

      <nav className="acta-tabs" aria-label="Apartados del acta">
        {APARTADOS_ACTA.map((apartado, indice) => (
          <button
            key={apartado.id}
            type="button"
            className={`acta-tab ${indice === indiceActivo ? 'acta-tab--activa' : ''}`}
            disabled={apartado.id !== 'info-general'}
            onClick={() => setApartadoActivo(apartado.id)}
          >
            <span className="acta-tab__numero">{apartado.numero}</span>
            {apartado.etiqueta}
          </button>
        ))}
      </nav>

      <main className="acta-contenido">
        <div className="acta-tarjeta">
          {apartadoActivo === 'info-general' ? (
            <ApartadoInfoGeneral
              datos={infoGeneral}
              errores={erroresInfoGeneral}
              onCambiarCampo={actualizarCampoInfoGeneral}
            />
          ) : (
            <section className="acta-apartado">
              <p className="acta-apartado__etiqueta">Próximamente</p>
              <h2 className="acta-apartado__titulo">Este apartado está en construcción</h2>
              <p className="acta-apartado__descripcion">
                Corresponde a otra historia de usuario del Acta General (HU-007 a HU-011) y todavía no está implementado.
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

        {apartadoActivo === 'info-general' && (
          <div className="acta-pie">
            <button
              type="button"
              className="acta-boton acta-boton--primario"
              disabled={guardando}
              onClick={guardarYAvanzar}
            >
              {guardando ? 'Guardando…' : 'Siguiente Apartado →'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ActaGeneralModulo;
