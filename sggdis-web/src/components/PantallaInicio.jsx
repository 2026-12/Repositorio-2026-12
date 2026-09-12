import './PantallaInicio.css';
import logoMinisterio from '../assets/logo-ministerio-salud.png';
import mapaCostaRica from '../assets/mapa.png';

export default function PantallaInicio({
  onNuevaInspeccion,
  onHistorial,
  onReportes,
  onCerrarSesion,
}) {
  const manejarTecla = (event, accion) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      accion?.();
    }
  };

  return (
    <div className="inicio">

      <header className="inicio__cabecera">

        <img
          className="inicio__logo"
          src={logoMinisterio}
          alt="Ministerio de Salud de Costa Rica"
        />

        <nav
          className="inicio__nav"
          aria-label="Navegación principal"
        >
          <button
            type="button"
            className="inicio__navLink"
            onClick={onNuevaInspeccion}
          >
            Nueva inspección
          </button>

          <button
            type="button"
            className="inicio__navLink"
            onClick={onHistorial}
          >
            Historial
          </button>

          <button
            type="button"
            className="inicio__navLink"
            onClick={onReportes}
          >
            Reportes
          </button>

          <button
            type="button"
            className="inicio__cerrarSesion"
            onClick={onCerrarSesion}
          >
            Cerrar sesión
          </button>
        </nav>

      </header>


      <main>

        <section
          className="inicio__hero"
          aria-labelledby="titulo-inicio"
        >

          <img
            className="inicio__mapa"
            src={mapaCostaRica}
            alt=""
            aria-hidden="true"
          />

          <div className="inicio__heroContenido">

            <p className="inicio__nombreSistema">
              Sistema de Gestión de Guías Digitales de Inspecciones Sanitarias
            </p>

            <h1
              id="titulo-inicio"
              className="inicio__titulo"
            >
              Ministerio de Salud{' '}
              <span className="inicio__tituloAcento">
                de Costa Rica.
              </span>
            </h1>

            <p className="inicio__descripcion">
              Plataforma institucional para la gestión digital de las
              guías de inspección sanitaria.
            </p>

            <button
              type="button"
              className="inicio__accionPrincipal"
              onClick={onNuevaInspeccion}
            >
              Nueva inspección
            </button>

          </div>

        </section>

        <section
          className="inicio__areas"
          aria-labelledby="titulo-areas"
        >

          <h2
            id="titulo-areas"
            className="inicio__areasTitulo"
          >
            Áreas principales
          </h2>

          <div className="inicio__areasGrid">

            {/* NUEVA INSPECCIÓN */}
            <article
              className="inicio__area"
              role="button"
              tabIndex={0}
              onClick={onNuevaInspeccion}
              onKeyDown={(event) =>
                manejarTecla(event, onNuevaInspeccion)
              }
            >

              <div className="inicio__areaVisual">

                <div className="inicio__nube inicio__nube--derecha" />

                <svg
                  viewBox="0 0 120 120"
                  className="inicio__areaIcono"
                  aria-hidden="true"
                >
                  <rect
                    x="28"
                    y="18"
                    width="64"
                    height="84"
                    rx="8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                  />

                  <path
                    d="M45 43h30M45 60h30M45 77h18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />

                  <path
                    d="M80 74l8 8 15-19"
                    fill="none"
                    stroke="#CFAC65"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

              </div>

              <div className="inicio__areaPie">
                <h3>Nueva inspección</h3>

                <p>
                  Registro de una inspección sanitaria
                </p>
              </div>

            </article>


            {/* HISTORIAL */}
            <article
              className="inicio__area"
              role="button"
              tabIndex={0}
              onClick={onHistorial}
              onKeyDown={(event) =>
                manejarTecla(event, onHistorial)
              }
            >

              <div className="inicio__areaVisual">

                <div className="inicio__nube inicio__nube--izquierda" />

                <svg
                  viewBox="0 0 120 120"
                  className="inicio__areaIcono"
                  aria-hidden="true"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="38"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                  />

                  <path
                    d="M60 38v25l18 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />

                  <path
                    d="M31 27l-10 4 5 10"
                    fill="none"
                    stroke="#CFAC65"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                </svg>

              </div>

              <div className="inicio__areaPie">
                <h3>
                  Historial de inspecciones
                </h3>

                <p>
                  Consulta y seguimiento de registros
                </p>
              </div>

            </article>


            {/* REPORTES */}
            <article
              className="inicio__area"
              role="button"
              tabIndex={0}
              onClick={onReportes}
              onKeyDown={(event) =>
                manejarTecla(event, onReportes)
              }
            >

              <div className="inicio__areaVisual">

                <div className="inicio__nube inicio__nube--derechaBaja" />

                <svg
                  viewBox="0 0 120 120"
                  className="inicio__areaIcono"
                  aria-hidden="true"
                >

                  <path
                    d="M25 92V28M25 92h72"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />

                  <rect
                    x="39"
                    y="61"
                    width="12"
                    height="25"
                    rx="3"
                    fill="currentColor"
                  />

                  <rect
                    x="58"
                    y="47"
                    width="12"
                    height="39"
                    rx="3"
                    fill="#164687"
                  />

                  <rect
                    x="77"
                    y="34"
                    width="12"
                    height="52"
                    rx="3"
                    fill="#CFAC65"
                  />

                </svg>

              </div>

              <div className="inicio__areaPie">
                <h3>
                  Reportes y seguimiento
                </h3>

                <p>
                  Consulta de información consolidada
                </p>
              </div>

            </article>

          </div>

        </section>

      </main>

      <footer className="inicio__pie">

        <strong>
          Ministerio de Salud de Costa Rica
        </strong>

        <span>
          Sistema de Gestión de Guías Digitales de Inspecciones Sanitarias
        </span>

        <small>
          SGGDIS · v1.0
        </small>

      </footer>

    </div>
  );
}