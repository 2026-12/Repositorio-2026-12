import { OPCIONES_ESTANDAR, ESTADO_CUMPLE, ESTADO_NO_CUMPLE, obtenerClaseOpcion } from '../../domain/opcionesRespuesta';
import { esVistaCompleta } from '../../domain/progresoVistas';
import { useSeccionCompuesta } from '../../hooks/useSeccionCompuesta';
import EsqueletoCarga from './EsqueletoCarga';
import mapaDorado from '../../../../assets/mapa-dorado.png';
import { TOTAL_PASOS_ALIMENTOS, nombresVistas } from '../config/inspeccionAlimentos';
import './formulario.css';

// Componente compartido para secciones que el backend divide en subsecciones
// (B: B1/B2/B3, C: C1/C2). Necesita sub-pestañas dentro del mismo paso, así que
// no puede reusar FormularioSeccionGenerico directo (asume una sola sección por paso).
export default function FormularioSubseccionado({
  subseccionesDisponibles,
  datos,
  onAnterior,
  onSiguiente,
  onVolverInicio,
  respuestas = {},
  onRespuestasChange,
  seccionesCache = {},
  onSeccionCargada,
  onIrAVista,
  indiceActual = 0,
  vistas = [],
  paso,
  totalPasos,
  guardando = false,
  marcarVistaCompleta,
  marca,
  textoAdvertenciaCritico,
}) {
  const {
    subsecciones,
    subSeccionActiva,
    subSeccionInfo,
    grupos,
    cargando,
    error,
    mostrarPendientes,
    mensajeNavegacion,
    alternarRespuesta,
    actualizarPuntos,
    obtenidos,
    maximo,
    criticosIncumplidos,
    subseccionesCompletas,
    manejarCambioSubseccion,
    manejarIrAVista,
    manejarAnterior,
    manejarSiguiente,
  } = useSeccionCompuesta({
    subseccionesDisponibles,
    datos,
    seccionesCache,
    onSeccionCargada,
    respuestas,
    onRespuestasChange,
    marcarVistaCompleta,
    indiceActual,
    onIrAVista,
    onAnterior,
    onSiguiente,
  });

  if (cargando) {
    return <EsqueletoCarga />;
  }

  if (error) {
    return (
      <div className="pagina">
        <div className="tarjeta-estado">
          <div className="estado-mensaje estado-mensaje--error">
            <span className="estado-mensaje__icono">⚠</span>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina">
      <header className="cabecera">
        <div className="cabecera__marca">
          <div className="cabecera__logo cabecera__logo--imagen">
            <img src={mapaDorado} alt="Ministerio de Salud de Costa Rica" />
          </div>

          <div>
            <h1>{marca.tituloGuia}</h1>
            <p>{datos.nombre} · Consecutivo: {datos.consecutivo}</p>
          </div>
        </div>

        <div className="cabecera__acciones">
          <div className="cabecera__estado">
            {criticosIncumplidos > 0 && (
              <span className="chip chip--alerta">
                ⚠ {criticosIncumplidos} punto{criticosIncumplidos > 1 ? 's' : ''}{' '}
                crítico{criticosIncumplidos > 1 ? 's' : ''}{' '}
                detectado{criticosIncumplidos > 1 ? 's' : ''}
              </span>
            )}

            <span className="chip chip--info">{datos.tipoLabel}</span>
          </div>

          <button type="button" className="boton-volver-menu-inspeccion" onClick={onVolverInicio}>
            ← Volver al menú
          </button>
        </div>
      </header>

      <nav className="tabs">
        {vistas.map((vista, i) => {
          const completa = esVistaCompleta(vista, seccionesCache, respuestas);

          return (
            <button
              key={vista.codigo}
              type="button"
              onClick={() => manejarIrAVista(i)}
              className={`tabs__item ${i === indiceActual ? 'tabs__item--activo' : ''} ${completa ? 'tabs__item--completo' : ''}`}
            >
              {nombresVistas[vista.codigo] ?? vista.codigo}
            </button>
          );
        })}
      </nav>

      <nav className="subtabs">
        {subsecciones.map((sub) => (
          <button
            key={sub.codigo}
            type="button"
            className={`subtabs__item ${sub.codigo === subSeccionActiva ? 'subtabs__item--activo' : ''} ${
              subseccionesCompletas[sub.codigo] ? 'subtabs__item--completo' : ''
            }`}
            onClick={() => manejarCambioSubseccion(sub.codigo)}
          >
            {sub.codigo}
          </button>
        ))}
      </nav>

      {mensajeNavegacion && (
        <div className="aviso-navegacion" role="alert">
          <span className="aviso-navegacion__icono">!</span>
          <span>{mensajeNavegacion}</span>
        </div>
      )}

      <main className="tarjeta">
        <div className="tarjeta__encabezado">
          <span className="tarjeta__etiqueta">SECCIÓN {subSeccionInfo.codigo}</span>

          <div className="tarjeta__titulo-fila">
            <h2>{subSeccionInfo.titulo}</h2>
            <span className="chip chip--puntos">{obtenidos}/{maximo} Puntos</span>
          </div>
        </div>

        {grupos.map((grupo) => (
          <div className="grupo" key={grupo.articulo}>
            <span className="grupo__etiqueta">{grupo.articulo}</span>

            {grupo.items.map((item) => {
              const respuesta = respuestas[item.id];
              const incumplido = item.critico && respuesta?.estado === ESTADO_NO_CUMPLE;
              const esPendiente = mostrarPendientes && !respuesta;

              return (
                <div
                  className={`item ${incumplido ? 'item--critico' : ''} ${esPendiente ? 'item--pendiente' : ''}`}
                  key={item.id}
                  tabIndex={esPendiente ? -1 : undefined}
                >
                  {item.critico && (
                    <div className="item__critico-encabezado">
                      <span className="item__tag">⚠ PUNTO CRÍTICO</span>
                      <span className="item__ayuda-critico">
                        El incumplimiento de este criterio puede requerir la emisión de una Orden Sanitaria.
                      </span>
                    </div>
                  )}

                  <div className="item__fila">
                    <div className="item__texto">
                      <p>{item.texto}</p>
                      <span className="item__valor">Valor: {item.valor} pts</span>
                    </div>

                    <div className="item__opciones">
                      {OPCIONES_ESTANDAR.map((opcion) => (
                        <button
                          key={opcion.valor}
                          type="button"
                          className={`opcion opcion--${obtenerClaseOpcion(opcion.valor)} ${respuesta?.estado === opcion.valor ? 'opcion--activa' : ''}`}
                          onClick={() => alternarRespuesta(item.id, opcion.valor, item.valor)}
                        >
                          {opcion.icono} {opcion.valor}
                        </button>
                      ))}
                    </div>
                  </div>

                  {respuesta?.estado === ESTADO_CUMPLE && (
                    <div className="item__puntos">
                      <span className="item__puntos-label">Puntos otorgados:</span>

                      <div className="item__puntos-opciones">
                        {Array.from({ length: item.valor }, (_, n) => n + 1).map((n) => (
                          <button
                            key={n}
                            type="button"
                            className={`punto-opcion ${respuesta.puntos === n ? 'punto-opcion--activa' : ''}`}
                            onClick={() => actualizarPuntos(item.id, n)}
                          >
                            {n} pt{n !== 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {incumplido && <p className="item__advertencia">{textoAdvertenciaCritico}</p>}
                </div>
              );
            })}
          </div>
        ))}
      </main>

      <footer className="pie pie--fijo">
        <button type="button" className="boton boton--secundario" onClick={manejarAnterior}>
          ← Anterior
        </button>

        <span>
          Paso {paso}{totalPasos ? ` de ${totalPasos}` : ` de ${TOTAL_PASOS_ALIMENTOS}`} (Subsección {subSeccionActiva})
        </span>

        <button type="button" className="boton boton--secundario" onClick={manejarSiguiente} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Siguiente →'}
        </button>
      </footer>
    </div>
  );
}
