import { useState, useEffect, useMemo } from 'react';
import { obtenerSeccion } from '../services/guiasInspeccionService';
import { agruparPorArticulo } from '../domain/agrupacionItems';
import { obtenerPendientes } from '../domain/validacionSeccion';
import { OPCIONES_ESTANDAR } from '../domain/opcionesRespuesta';
import { esVistaCompleta } from '../domain/progresoVistas';
import mapaDorado from '../assets/mapa-dorado.png';
import {
  TOTAL_PASOS_ALIMENTOS,
} from '../config/inspeccionAlimentos';
import './formulario.css';
import { nombresVistas } from '../config/inspeccion';

// En el backend la Sección C viene dividida en dos subsecciones con código propio.
const SUBSECCIONES = [
  {
    codigo: 'C1',
    titulo: 'Bodega de Insumos — Condiciones Físicas y Sanitarias',
  },
  {
    codigo: 'C2',
    titulo: 'Bodega de Insumos — Condiciones de Almacenamiento',
  },
];

// Componente dedicado para la Sección C: igual que FormularioSeccionB, pero
// para las subsecciones C1 y C2 (en vez de B1/B2/B3). Repite la misma
// estructura de sub-pestañas y renderizado por las mismas razones.
function FormularioSeccionC({
  datos,
  onAnterior,
  onSiguiente,
  onVolverInicio,
  puedeRetroceder,
  respuestas = {},
  onRespuestasChange,
  seccionesCache = {},
  onSeccionCargada,
  onIrAVista,
  maxAlcanzado = 0,
  indiceActual = 0,
  vistas = [],
  paso,
  totalPasos,
  guardando = false,
  marcarVistaCompleta,
}) {
  // Solo se muestran las subsecciones (C1/C2) que en verdad le aplican al tipo de establecimiento.
  const subsecciones = useMemo(
    () =>
      SUBSECCIONES.filter(
        (sub) =>
          datos.secciones?.some(
            (seccion) =>
              seccion.codigo ===
              sub.codigo
          )
      ),
    [datos.secciones],
  );

  const [
    subSeccionActiva,
    setSubSeccionActiva,
  ] = useState(
    subsecciones[0]?.codigo ??
      SUBSECCIONES[0].codigo
  );

  const [
    gruposPorSubseccion,
    setGruposPorSubseccion,
  ] = useState({});

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    mostrarPendientes,
    setMostrarPendientes,
  ] = useState(false);

  const [
    mensajeNavegacion,
    setMensajeNavegacion,
  ] = useState('');

  // Al cambiar de subsección llevar la vista al inicio de la página.
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [subSeccionActiva]);

  // Carga las subsecciones C1 y C2 en paralelo, reusando la caché si ya existía.
  useEffect(() => {
    async function cargarSeccionC() {
      try {
        setCargando(true);
        setError(null);

        const resultados =
          await Promise.all(
            subsecciones.map(
              (sub) => (
                seccionesCache[
                  sub.codigo
                ] ??
                obtenerSeccion(
                  datos.idGuia ?? 1,
                  sub.codigo,
                  datos.idTipoEstablecimiento
                )
              )
            )
          );

        const nuevosGrupos = {};

        resultados.forEach(
          (datosApi, i) => {
            nuevosGrupos[
              subsecciones[
                i
              ].codigo
            ] =
              agruparPorArticulo(
                datosApi.items
              );

            onSeccionCargada?.(
              subsecciones[
                i
              ].codigo,
              datosApi
            );
          }
        );

        setGruposPorSubseccion(
          nuevosGrupos
        );
      } catch (err) {
        console.error(
          'Error al cargar la Sección C:',
          err
        );

        setError(
          'No se pudo cargar la Sección C. Verifique que el backend esté disponible.'
        );
      } finally {
        setCargando(false);
      }
    }

    cargarSeccionC();
  }, [
    datos.idGuia,
    datos.idTipoEstablecimiento,
    onSeccionCargada,
    seccionesCache,
    subsecciones,
  ]);

  const grupos = useMemo(
    () =>
      gruposPorSubseccion[
        subSeccionActiva
      ] ?? [],
    [
      gruposPorSubseccion,
      subSeccionActiva,
    ],
  );

  // NOTA: a diferencia de FormularioSeccionGenerico y FormularioSeccionB,
  // aquí NO se usa el hook useRespuestasInspeccion ni calcularResumen de
  // domain/calculoPuntaje: se reescribió la misma lógica de marcar/desmarcar
  // un ítem y de sumar el puntaje directamente en este archivo. Funciona
  // igual, pero si el comportamiento se corrige en un solo lugar (el hook o
  // el dominio), esta copia no se actualiza automáticamente y puede
  // desalinearse. Convendría migrar esta sección para reusar el hook, igual
  // que hacen las demás.
  const manejarSeleccion = (
    itemId,
    opcion,
    valorMaximo
  ) => {
    onRespuestasChange?.(
      (prev) => {
        const actual =
          prev[itemId];

        if (
          actual &&
          actual.estado === opcion
        ) {
          const copia = {
            ...prev,
          };

          delete copia[
            itemId
          ];

          return copia;
        }

        return {
          ...prev,
          [itemId]: {
            estado:
              opcion,
            puntos:
              opcion ===
              'Cumple'
                ? valorMaximo
                : 0,
          },
        };
      }
    );
  };

  const manejarPuntos = (
    itemId,
    puntos
  ) => {
    const item =
      grupos
        .flatMap(
          (grupo) =>
            grupo.items
        )
        .find(
          (itemActual) =>
            itemActual.id ===
            itemId
        );

    if (!item) {
      return;
    }

    const valorMaximo =
      Number(
        item.valor
      ) || 1;

    const valorSeleccionado =
      Number(
        puntos
      ) || 1;

    const puntosAjustados =
      Math.min(
        Math.max(
          1,
          valorSeleccionado
        ),
        valorMaximo
      );

    onRespuestasChange?.(
      (prev) => ({
        ...prev,
        [itemId]: {
          ...prev[
            itemId
          ],
          puntos:
            puntosAjustados,
        },
      })
    );
  };

  // Mismo cálculo que calcularResumen (domain/calculoPuntaje.js), pero copiado a mano.
  const {
    obtenidos,
    maximo,
    criticosIncumplidos,
  } = useMemo(() => {
    let obtenidos = 0;
    let maximo = 0;
    let criticosIncumplidos = 0;

    grupos.forEach(
      (grupo) => {
        grupo.items.forEach(
          (item) => {
            const respuesta =
              respuestas[
                item.id
              ];

            if (
              respuesta?.estado ===
              'N/A'
            ) {
              return;
            }

            maximo +=
              item.valor;

            if (
              respuesta?.estado ===
              'Cumple'
            ) {
              obtenidos +=
                respuesta.puntos ??
                0;
            }

            if (
              item.critico &&
              respuesta?.estado ===
                'No cumple'
            ) {
              criticosIncumplidos += 1;
            }
          }
        );
      }
    );

    return {
      obtenidos,
      maximo,
      criticosIncumplidos,
    };
  }, [
    respuestas,
    grupos,
  ]);

  const itemsPendientesDetalle =
    useMemo(
      () =>
        obtenerPendientes(
          grupos,
          respuestas
        ),
      [
        grupos,
        respuestas,
      ]
    );

  const itemsSinResponder =
    itemsPendientesDetalle.length;

  const tieneRespuestasSubseccion =
    grupos.some(
      (grupo) =>
        grupo.items.some(
          (item) =>
            Boolean(
              respuestas[
                item.id
              ]?.estado
            )
        )
    );

  const subseccionIncompletaIniciada =
    tieneRespuestasSubseccion &&
    itemsSinResponder > 0;

  const subseccionesCompletas =
    useMemo(() => {
      const completas = {};

      subsecciones.forEach(
        (sub) => {
          const gruposSubseccion =
            gruposPorSubseccion[
              sub.codigo
            ] ?? [];

          const totalItems =
            gruposSubseccion.reduce(
              (
                total,
                grupo
              ) =>
                total +
                grupo.items.length,
              0
            );

          completas[
            sub.codigo
          ] =
            totalItems > 0 &&
            obtenerPendientes(
              gruposSubseccion,
              respuestas
            ).length === 0;
        }
      );

      return completas;
    }, [
      gruposPorSubseccion,
      respuestas,
      subsecciones,
    ]);

  // Avisa al asistente si la vista C (ambas subsecciones juntas) ya está
  // completa: sin esto, el botón "Siguiente" de C2 nunca puede avanzar de
  // vista de verdad y termina saltando directo a la pantalla de cierre.
  useEffect(() => {
    if (
      !marcarVistaCompleta ||
      subsecciones.length === 0
    ) {
      return;
    }

    const todasCargadas =
      subsecciones.every(
        (sub) =>
          (
            gruposPorSubseccion[
              sub.codigo
            ]?.length ?? 0
          ) > 0
      );

    if (!todasCargadas) {
      return;
    }

    const tieneRespuestas =
      subsecciones.some(
        (sub) =>
          (
            gruposPorSubseccion[
              sub.codigo
            ] ?? []
          ).some(
            (grupo) =>
              grupo.items.some(
                (item) =>
                  respuestas[
                    item.id
                  ]?.estado
              )
          )
      );

    const todasCompletas =
      subsecciones.every(
        (sub) =>
          subseccionesCompletas[
            sub.codigo
          ]
      );

    marcarVistaCompleta(
      todasCompletas,
      !tieneRespuestas
    );
  }, [
    subsecciones,
    gruposPorSubseccion,
    respuestas,
    subseccionesCompletas,
    marcarVistaCompleta,
  ]);

  const mostrarAvisoPendientes = () => {
    setMostrarPendientes(true);

    setMensajeNavegacion(
      'Complete la subsección actual antes de continuar.'
    );

    requestAnimationFrame(() => {
      const primerPendiente =
        document.querySelector(
          '.item--pendiente'
        );

      if (primerPendiente) {
        primerPendiente.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        setTimeout(() => {
          primerPendiente.focus();
        }, 450);
      }
    });

    setTimeout(() => {
      setMensajeNavegacion('');
    }, 3500);
  };

  const manejarCambioSubseccion = (
    codigoDestino
  ) => {
    if (
      codigoDestino ===
      subSeccionActiva
    ) {
      return;
    }

    if (
      subseccionIncompletaIniciada
    ) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');

    setSubSeccionActiva(
      codigoDestino
    );
  };

  const manejarIrAVista = (
    indiceDestino
  ) => {
    if (
      indiceDestino ===
      indiceActual
    ) {
      return;
    }

    if (
      subseccionIncompletaIniciada
    ) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');

    onIrAVista?.(
      indiceDestino
    );
  };

  // "Anterior" dentro de la Sección C: retrocede a la subsección previa (C2 → C1).
  const manejarAnterior = () => {
    if (
      subseccionIncompletaIniciada
    ) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');

    const index =
      subsecciones.findIndex(
        (sub) =>
          sub.codigo ===
          subSeccionActiva
      );

    if (index > 0) {
      setSubSeccionActiva(
        subsecciones[
          index - 1
        ].codigo
      );
    } else {
      onAnterior?.();
    }
  };

  // "Siguiente": avanza entre subsecciones (C1 → C2) y solo llama a
  // onSiguiente cuando ya se completó la última.
  const manejarSiguiente = () => {
    if (
      itemsSinResponder > 0
    ) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');

    const index =
      subsecciones.findIndex(
        (sub) =>
          sub.codigo ===
          subSeccionActiva
      );

    if (
      index <
      subsecciones.length - 1
    ) {
      setSubSeccionActiva(
        subsecciones[
          index + 1
        ].codigo
      );
    } else {
      onSiguiente?.();
    }
  };

  if (cargando) {
    return (
      <div className="pagina">
        <div className="skeleton-contenedor">
          <div className="skeleton skeleton--titulo"></div>
          <div className="skeleton skeleton--linea"></div>
          <div className="skeleton skeleton--linea"></div>
          <div className="skeleton skeleton--linea"></div>
          <div className="skeleton skeleton--linea"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagina">
        <div className="tarjeta-estado">
          <div className="estado-mensaje estado-mensaje--error">
            <span className="estado-mensaje__icono">
              ⚠
            </span>

            <p>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const subSeccionInfo =
    subsecciones.find(
      (sub) =>
        sub.codigo ===
        subSeccionActiva
    ) ??
    SUBSECCIONES[0];

  return (
    <div className="pagina">
      <header className="cabecera">
        <div className="cabecera__marca">
          <div className="cabecera__logo cabecera__logo--imagen">
            <img
              src={mapaDorado}
              alt="Ministerio de Salud de Costa Rica"
            />
          </div>

          <div>
            <h1>
              Guía de Inspección — Servicios de Alimentación al Público
            </h1>

            <p>
              {datos.nombre} · Consecutivo: {datos.consecutivo}
            </p>
          </div>
        </div>

        <div className="cabecera__acciones">
          <div className="cabecera__estado">
            {criticosIncumplidos > 0 && (
              <span className="chip chip--alerta">
                ⚠ {criticosIncumplidos} punto
                {criticosIncumplidos > 1
                  ? 's'
                  : ''}{' '}
                crítico
                {criticosIncumplidos > 1
                  ? 's'
                  : ''}{' '}
                detectado
                {criticosIncumplidos > 1
                  ? 's'
                  : ''}
              </span>
            )}

            <span className="chip chip--info">
              {datos.tipoLabel}
            </span>
          </div>

          <button
            type="button"
            className="boton-volver-menu-inspeccion"
            onClick={onVolverInicio}
          >
            ← Volver al menú
          </button>
        </div>
      </header>

      <nav className="tabs">
        {vistas.map(
          (vista, i) => {
            const completa =
              esVistaCompleta(
                vista,
                seccionesCache,
                respuestas
              );

            return (
              <button
                key={vista.codigo}
                type="button"
                onClick={() =>
                  manejarIrAVista(i)
                }
                className={`tabs__item ${
                  i === indiceActual
                    ? 'tabs__item--activo'
                    : ''
                } ${
                  completa
                    ? 'tabs__item--completo'
                    : ''
                }`}
              >
                {nombresVistas[
                  vista.codigo
                ] ??
                  vista.codigo}
              </button>
            );
          }
        )}
      </nav>

      <nav className="subtabs">
        {subsecciones.map(
          (sub) => (
            <button
              key={sub.codigo}
              type="button"
              className={`subtabs__item ${
                sub.codigo ===
                subSeccionActiva
                  ? 'subtabs__item--activo'
                  : ''
              } ${
                subseccionesCompletas[
                  sub.codigo
                ]
                  ? 'subtabs__item--completo'
                  : ''
              }`}
              onClick={() =>
                manejarCambioSubseccion(
                  sub.codigo
                )
              }
            >
              {sub.codigo}
            </button>
          )
        )}
      </nav>

      {mensajeNavegacion && (
        <div
          className="aviso-navegacion"
          role="alert"
        >
          <span className="aviso-navegacion__icono">
            !
          </span>

          <span>
            {mensajeNavegacion}
          </span>
        </div>
      )}

      <main className="tarjeta">
        <div className="tarjeta__encabezado">
          <span className="tarjeta__etiqueta">
            SECCIÓN {subSeccionInfo.codigo}
          </span>

          <div className="tarjeta__titulo-fila">
            <h2>
              {subSeccionInfo.titulo}
            </h2>

            <span className="chip chip--puntos">
              {obtenidos}/{maximo} Puntos
            </span>
          </div>
        </div>

        {grupos.map(
          (grupo) => (
            <div
              className="grupo"
              key={grupo.articulo}
            >
              <span className="grupo__etiqueta">
                {grupo.articulo}
              </span>

              {grupo.items.map(
                (item) => {
                  const respuesta =
                    respuestas[
                      item.id
                    ];

                  const esCritico =
                    item.critico;

                  const incumplido =
                    esCritico &&
                    respuesta?.estado ===
                      'No cumple';

                  const esPendiente =
                    mostrarPendientes &&
                    !respuesta;

                  return (
                    <div
                      className={`item ${
                        incumplido
                          ? 'item--critico'
                          : ''
                      } ${
                        esPendiente
                          ? 'item--pendiente'
                          : ''
                      }`}
                      key={item.id}
                      tabIndex={
                        esPendiente
                          ? -1
                          : undefined
                      }
                    >
                      {esCritico && (
                        <div className="item__critico-encabezado">
                          <span className="item__tag">
                            ⚠ PUNTO CRÍTICO
                          </span>

                          <span className="item__ayuda-critico">
                            El incumplimiento de este criterio puede requerir la emisión de una Orden Sanitaria.
                          </span>
                        </div>
                      )}

                      <div className="item__fila">
                        <div className="item__texto">
                          <p>
                            {item.texto}
                          </p>

                          <span className="item__valor">
                            Valor: {item.valor} pts
                          </span>
                        </div>

                        <div className="item__opciones">
                          {OPCIONES_ESTANDAR.map(
                            (op) => (
                              <button
                                key={op.valor}
                                type="button"
                                className={`opcion opcion--${
                                  op.valor ===
                                  'Cumple'
                                    ? 'cumple'
                                    : op.valor ===
                                      'No cumple'
                                      ? 'no-cumple'
                                      : 'na'
                                } ${
                                  respuesta?.estado ===
                                  op.valor
                                    ? 'opcion--activa'
                                    : ''
                                }`}
                                onClick={() =>
                                  manejarSeleccion(
                                    item.id,
                                    op.valor,
                                    item.valor
                                  )
                                }
                              >
                                {op.icono}{' '}
                                {op.valor}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {respuesta?.estado ===
                        'Cumple' && (
                        <div className="item__puntos">
                          <span className="item__puntos-label">
                            Puntos otorgados:
                          </span>

                          <div className="item__puntos-opciones">
                            {Array.from(
                              {
                                length:
                                  item.valor,
                              },
                              (_, n) =>
                                n + 1
                            ).map(
                              (n) => (
                                <button
                                  key={n}
                                  type="button"
                                  className={`punto-opcion ${
                                    respuesta.puntos ===
                                    n
                                      ? 'punto-opcion--activa'
                                      : ''
                                  }`}
                                  onClick={() =>
                                    manejarPuntos(
                                      item.id,
                                      n
                                    )
                                  }
                                >
                                  {n} pt
                                  {n !== 1
                                    ? 's'
                                    : ''}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {incumplido && (
                        <p className="item__advertencia">
                          🛡 Al incumplir un punto crítico, se procederá inmediatamente a notificar mediante Orden Sanitaria según Art. 142 del Reglamento General de Alimentos.
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )
        )}
      </main>

      <footer className="pie pie--fijo">
        <button
          type="button"
          className="boton boton--secundario"
          onClick={manejarAnterior}
        >
          ← Anterior
        </button>

        <span>
          Paso {paso}
          {totalPasos
            ? ` de ${totalPasos}`
            : ` de ${TOTAL_PASOS_ALIMENTOS}`}
          {' '}
          (Subsección {subSeccionActiva})
        </span>

        <button
          type="button"
          className="boton boton--secundario"
          onClick={manejarSiguiente}
          disabled={guardando}
        >
          {guardando
            ? 'Guardando…'
            : 'Siguiente →'}
        </button>
      </footer>
    </div>
  );
}

export default FormularioSeccionC;