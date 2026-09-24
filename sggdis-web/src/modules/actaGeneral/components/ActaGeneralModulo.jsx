import { useActaGeneral } from '../hooks/useActaGeneral';
import { APARTADOS_ACTA } from '../config/actaGeneral';
import ApartadoInfoGeneral from './ApartadoInfoGeneral';
import mapaDorado from '../../../assets/mapa-dorado.png';
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
    creando,
    errorCreacion,
    apartadoActivo,
    irAApartado,
    infoGeneral,
    erroresInfoGeneral,
    actualizarCampoInfoGeneral,
    guardando,
    errorGuardado,
    avanzarAlSiguienteApartado,
    retrocederAlApartadoAnterior,
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
          <div className="acta-cabecera__logo">
            <img src={mapaDorado} alt="Ministerio de Salud de Costa Rica" />
          </div>
          <div>
            <h1>Acta de Inspección General</h1>
            <p>Ministerio de Salud de Costa Rica — SGGDIS</p>
          </div>
        </div>

        <div className="acta-cabecera__derecha">
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
            disabled={guardando}
            onClick={() => irAApartado(apartado.id)}
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
    </div>
  );
}

export default ActaGeneralModulo;
