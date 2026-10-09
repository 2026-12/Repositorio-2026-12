// La caja del documento reutiliza las mismas clases .orden-vista-previa que
// la vista previa de Orden Sanitaria (mismo CSS, importado abajo).
import '../../../ordenSanitaria/styles/ordenSanitaria.css';
import './vistaPreviaInspeccion.css';

// Igual que CampoVistaPrevia en la vista previa de Orden Sanitaria.
function Campo({ etiqueta, valor, anchoCompleto = false }) {
  return (
    <div
      className={[
        'orden-vista-previa__dato',
        anchoCompleto ? 'orden-vista-previa__dato--completo' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className="orden-vista-previa__etiqueta">{etiqueta}</span>
      <span className="orden-vista-previa__valor">{valor || 'No indicado'}</span>
    </div>
  );
}

function claseResultado(estado) {
  if (estado === 'Cumple') return 'cumple';
  if (estado === 'No cumple') return 'no-cumple';
  if (estado === 'N/A') return 'na';
  return 'pendiente';
}

// Vista previa del documento final de la inspección de alimentos, con el
// mismo formato que la vista previa de Orden Sanitaria: intro, caja con
// encabezado azul y una sección de solo lectura por cada parte del documento
// (las subsecciones de la guía van como sub-tarjetas, igual que las
// ordenanzas).
export default function VistaPreviaInspeccion({
  documento,
  datosCierre,
  identidadInspector,
  onRegresarEditar,
  onConfirmar,
  onVolverMenu,
  confirmando,
  pendienteSincronizacion,
  error,
}) {
  const { resumen } = documento;
  const accionesDeshabilitadas = confirmando || pendienteSincronizacion;

  return (
    <div className="pagina vista-previa-pagina">
      <div className="vista-previa-pagina__barra-superior">
        <button
          type="button"
          className="boton-volver-menu-inspeccion"
          onClick={onVolverMenu}
          disabled={accionesDeshabilitadas}
        >
          ← Volver al menú
        </button>
      </div>

      <main className="vista-previa-pagina__tarjeta">
        <section className="orden-apartado">
          <h2>Vista previa</h2>
          <p>
            Revise cuidadosamente la información de la inspección antes de confirmarla. Si algo no
            es correcto, use "Regresar y editar" para corregirlo.
          </p>
        </section>

        {error && <div className="vista-previa__errores" role="alert">{error}</div>}

        <section className="orden-vista-previa">

          {/* ENCABEZADO */}

          <div className="orden-vista-previa__encabezado">
            <div>
              <h3>Documento de Inspección</h3>
              <span>{documento.establecimiento}</span>
            </div>
            <strong>{documento.consecutivo || `ID ${documento.idInspeccion}`}</strong>
          </div>

          {/* INFORMACIÓN GENERAL */}

          <section className="orden-vista-previa__seccion">
            <div className="orden-vista-previa__titulo">Información General</div>
            <div className="orden-vista-previa__grid">
              <Campo etiqueta="Establecimiento" valor={documento.establecimiento} anchoCompleto />
              <Campo etiqueta="Tipo de establecimiento" valor={documento.tipoEstablecimiento} />
              <Campo etiqueta="Fecha de inspección" valor={documento.fecha} />
              <Campo etiqueta="Estado" valor={documento.estado} />
              <Campo etiqueta="Inspector" valor={identidadInspector?.nombreCompleto} />
            </div>
          </section>

          {/* SECCIONES DE LA GUÍA */}

          {documento.secciones.map((vista) => (
            <section key={vista.codigo} className="orden-vista-previa__seccion">
              <div className="orden-vista-previa__titulo">{vista.nombre}</div>

              <div className="orden-vista-previa__ordenanzas">
                {vista.secciones.map((seccion) => (
                  <div key={seccion.codigo} className="orden-vista-previa__ordenanza">
                    <div className="orden-vista-previa__ordenanza-titulo">
                      Sección {seccion.codigo} · {seccion.resumen.obtenidos}/{seccion.resumen.maximo} pts
                      ({seccion.resumen.porcentaje}%)
                    </div>

                    <div className="vista-previa__tabla-contenedor">
                      <table className="vista-previa__tabla">
                        <thead>
                          <tr>
                            <th>Ítem</th>
                            <th>Artículo / Requisito</th>
                            <th>Resultado</th>
                            <th>Puntaje</th>
                          </tr>
                        </thead>
                        <tbody>
                          {seccion.items.map((item, indice) => (
                            <tr
                              key={item.id}
                              className={item.criticoIncumplido ? 'vista-previa__fila-critica' : undefined}
                            >
                              <td>
                                {item.critico && <span className="vista-previa__critico">CRÍTICO</span>}
                                {indice + 1}
                                {item.criticoIncumplido && (
                                  <p className="vista-previa__alerta-critica">
                                    {documento.textoAdvertenciaCritico}
                                  </p>
                                )}
                              </td>
                              <td>
                                <span className="vista-previa__articulo">{item.articulo || '—'}</span>
                                <p>{item.texto}</p>
                              </td>
                              <td>
                                <span
                                  className={`vista-previa__resultado vista-previa__resultado--${claseResultado(item.estado)}`}
                                >
                                  {item.resultado}
                                </span>
                              </td>
                              <td>{item.puntosObtenidos} / {item.estado === 'N/A' ? 0 : item.puntosMaximos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* RESUMEN GENERAL */}

          <section className="orden-vista-previa__seccion">
            <div className="orden-vista-previa__titulo">Resumen General</div>
            <div className="orden-vista-previa__grid">
              <Campo etiqueta="Puntaje total" valor={`${resumen.obtenidos} / ${resumen.maximo}`} />
              <Campo etiqueta="Cumplimiento" valor={`${resumen.porcentaje}%`} />
              <Campo etiqueta="Resultado" valor={resumen.clasificacion?.etiqueta} />
              <Campo etiqueta="Ítems críticos incumplidos" valor={String(resumen.criticosIncumplidos)} />
              <Campo
                etiqueta="Orden Sanitaria"
                valor={
                  resumen.ordenSanitariaProcede
                    ? 'Procede revisar la emisión de una Orden Sanitaria por incumplimiento crítico (Art. 142).'
                    : 'No se identificaron ítems críticos incumplidos.'
                }
                anchoCompleto
              />
              <Campo
                etiqueta="Observaciones generales"
                valor={datosCierre.observacionesFinales}
                anchoCompleto
              />
              <Campo etiqueta="Inspector responsable" valor={identidadInspector?.nombreCompleto} />
              <Campo etiqueta="Identificación" valor={identidadInspector?.identificacion} />
            </div>
          </section>
        </section>

        {pendienteSincronizacion && (
          <div className="vista-previa__pendiente" role="status" aria-live="polite">
            <strong>Inspección pendiente de sincronización</strong>
            <p>
              El documento quedó guardado en este dispositivo. Se enviará automáticamente cuando se
              recupere la conexión.
            </p>
          </div>
        )}

        <div className="vista-previa-pagina__acciones">
          <button
            type="button"
            className="boton boton--secundario"
            onClick={onRegresarEditar}
            disabled={accionesDeshabilitadas}
          >
            Regresar y editar
          </button>
          <button
            type="button"
            className="boton boton--primario"
            onClick={onConfirmar}
            disabled={accionesDeshabilitadas}
          >
            {confirmando
              ? 'Enviando…'
              : pendienteSincronizacion
                ? 'Pendiente de sincronización'
                : 'Confirmar y enviar'}
          </button>
        </div>
      </main>
    </div>
  );
}
