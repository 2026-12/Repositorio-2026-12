import { useEffect, useState } from 'react';
import { agruparPorArticulo } from '../../domain/agrupacionItems';
import { obtenerSeccion } from '../../services/guiasInspeccionService';
import { useRespuestasInspeccion } from '../../hooks/useRespuestasInspeccion';
import { OPCIONES_ESTANDAR, ESTADO_CUMPLE, ESTADO_NO_CUMPLE, obtenerClaseOpcion } from '../../domain/opcionesRespuesta';
import EsqueletoCarga from './EsqueletoCarga';
import './formulario.css';
import { obtenerPendientes } from '../../domain/validacionSeccion';
import { esVistaCompleta, evaluarCompletitudSeccion } from '../../domain/progresoVistas';
import { nombresVistas } from '../config/inspeccionAlimentos';
import mapaDorado from '../../../../assets/mapa-dorado.png';

const MARCA_POR_DEFECTO = {
  logo: 'IN',
  tituloGuia: 'Guía de Inspección',
};


// Componente genérico para renderizar cualquier sección de guía. No sabe
// nada de una guía en particular — recibe todo por props (o por un
// adaptador que lo envuelva).
export default function FormularioSeccionGenerico({
  datos,
  codigo,
  titulo,
  paso,
  totalPasos,
  onAnterior,
  onSiguiente,
  onVolverInicio,
  puedeRetroceder,
  respuestas,
  onRespuestasChange,
  seccionInicial,
  onSeccionCargada,
  onIrAVista,
  maxAlcanzado = 0,
  indiceActual = 0,
  vistas = [],
  seccionesCache = {},
  marca = MARCA_POR_DEFECTO,
  textoAdvertenciaCritico,
  opciones = OPCIONES_ESTANDAR,
  obtenerOpcionesItem = (
    item,
    opcionesBase
  ) => opcionesBase,
  obtenerPuntosItem = (item) =>
    Array.from(
      { length: item.valor },
      (_, n) => n + 1
    ),
  renderizarContenidoItem,
  guardando = false,
  marcarVistaCompleta,
}) {
  const [
    grupos,
    setGrupos,
  ] = useState(
    seccionInicial
      ? agruparPorArticulo(
          seccionInicial.items
        )
      : []
  );

  const [
    cargando,
    setCargando,
  ] = useState(
    !seccionInicial
  );

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

  // Detecta si el formulario está completo o vacío
  useEffect(() => {
    if (
      !marcarVistaCompleta
    ) {
      return;
    }

    const gruposActuales =
      seccionInicial
        ? agruparPorArticulo(
            seccionInicial.items
          )
        : grupos;

    const { completa, vacia } = evaluarCompletitudSeccion(gruposActuales, respuestas);
    marcarVistaCompleta(completa, vacia);
  }, [
    respuestas,
    grupos,
    seccionInicial,
    marcarVistaCompleta,
  ]);

  // Si ya está en caché (seccionInicial) la usa directo. Si no, la pide al
  // backend y avisa al padre (onSeccionCargada) para que quede cacheada.
  useEffect(() => {
    let activo = true;

    if (seccionInicial) {
      setGrupos(
        agruparPorArticulo(
          seccionInicial.items
        )
      );

      setError(null);
      setCargando(false);

      return () => {
        activo = false;
      };
    }

    setCargando(true);

    obtenerSeccion(
      datos.idGuia ?? 1,
      codigo,
      datos.idTipoEstablecimiento
    )
      .then((seccion) => {
        if (activo) {
          setGrupos(
            agruparPorArticulo(
              seccion.items
            )
          );

          onSeccionCargada?.(
            codigo,
            seccion
          );

          setError(null);
        }
      })
      .catch(() => {
        if (activo) {
          setError(
            `No se pudo cargar la Sección ${codigo}. Verifique que el backend esté disponible.`
          );
        }
      })
      .finally(() => {
        if (activo) {
          setCargando(false);
        }
      });

    return () => {
      activo = false;
    };
  }, [
    codigo,
    datos.idGuia,
    datos.idTipoEstablecimiento,
    onSeccionCargada,
    seccionInicial,
  ]);

  const gruposActuales =
    seccionInicial
      ? agruparPorArticulo(
          seccionInicial.items
        )
      : grupos;

  const {
    respuestas:
      respuestasActuales,
    alternarRespuesta,
    actualizarPuntos,
    resumen,
  } = useRespuestasInspeccion(
    gruposActuales,
    respuestas,
    onRespuestasChange
  );

  const itemsPendientes =
    obtenerPendientes(
      gruposActuales,
      respuestasActuales
    );

  const pendientes =
    itemsPendientes.length;

  const tieneRespuestasActuales =
    gruposActuales
      .flatMap(
        (grupo) =>
          grupo.items
      )
      .some(
        (item) =>
          Boolean(
            respuestasActuales[
              item.id
            ]?.estado
          )
      );

  const seccionIncompletaIniciada =
    tieneRespuestasActuales &&
    pendientes > 0;

  const mostrarAvisoPendientes = () => {
    setMostrarPendientes(true);

    setMensajeNavegacion(
      'Complete la sección actual antes de continuar.'
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

  const manejarIrAVista = (
    indiceDestino
  ) => {
    if (
      indiceDestino ===
      indiceActual
    ) {
      return;
    }

    // Solo bloquea si esta sección ya se empezó
    // y todavía tiene criterios pendientes.
    if (
      seccionIncompletaIniciada
    ) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');

    onIrAVista?.(
      indiceDestino,
      !tieneRespuestasActuales
    );
  };

  const manejarAnterior = () => {
    if (
      seccionIncompletaIniciada
    ) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');

    onAnterior?.();
  };

  // Si quedan ítems sin responder, no avanza: resalta el primer pendiente y
  // hace scroll hasta ahí. Si ya está todo respondido, llama a onSiguiente
  // (guarda y pasa a la siguiente vista).
  const manejarSiguiente = () => {
    if (
      pendientes > 0
    ) {
      mostrarAvisoPendientes();
      return;
    }

    setMostrarPendientes(false);
    setMensajeNavegacion('');

    onSiguiente?.();
  };

  if (cargando) {
    return <EsqueletoCarga />;
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
              {marca.tituloGuia}
            </h1>

            <p>
              {datos.nombre} · Consecutivo: {datos.consecutivo}
            </p>
          </div>
        </div>

        <div className="cabecera__acciones">
          <div className="cabecera__estado">
            {resumen.criticosIncumplidos > 0 && (
              <span className="chip chip--alerta">
                ⚠ {resumen.criticosIncumplidos} punto crítico detectado
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

      {/* Barra de pestañas: una por cada vista del asistente. */}
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
                ] ?? vista.codigo}
              </button>
            );
          }
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
            SECCIÓN {codigo}
          </span>

          <div className="tarjeta__titulo-fila">
            <h2>
              {titulo}
            </h2>

            <span className="chip chip--puntos">
              {resumen.obtenidos}/{resumen.maximo} Puntos
            </span>
          </div>
        </div>

        {/* Cada grupo es un artículo del reglamento, con sus ítems debajo. */}
        {gruposActuales.map(
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
                    respuestasActuales[
                      item.id
                    ];

                  const incumplido =
                    item.critico &&
                    respuesta?.estado ===
                      ESTADO_NO_CUMPLE;

                  const esPendiente =
                    mostrarPendientes &&
                    !respuesta;

                  const opcionesItem =
                    obtenerOpcionesItem(
                      item,
                      opciones
                    );

                  const puntosItem =
                    obtenerPuntosItem(
                      item
                    );

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
                      {item.critico && (
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
                          {opcionesItem.map(
                            (opcion) => (
                              <button
                                key={opcion.valor}
                                type="button"
                                className={`opcion opcion--${obtenerClaseOpcion(opcion.valor)} ${
                                  respuesta?.estado ===
                                  opcion.valor
                                    ? 'opcion--activa'
                                    : ''
                                }`}
                                onClick={() =>
                                  alternarRespuesta(
                                    item.id,
                                    opcion.valor,
                                    item.valor
                                  )
                                }
                              >
                                {opcion.icono}{' '}
                                {opcion.valor}
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {respuesta?.estado ===
                        ESTADO_CUMPLE && (
                        <div className="item__puntos">
                          <span className="item__puntos-label">
                            Puntos otorgados:
                          </span>

                          <div className="item__puntos-opciones">
                            {puntosItem.map(
                              (puntos) => (
                                <button
                                  key={puntos}
                                  type="button"
                                  className={`punto-opcion ${
                                    respuesta.puntos ===
                                    puntos
                                      ? 'punto-opcion--activa'
                                      : ''
                                  }`}
                                  onClick={() =>
                                    actualizarPuntos(
                                      item.id,
                                      puntos
                                    )
                                  }
                                >
                                  {puntos} pt
                                  {puntos !== 1
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
                          {textoAdvertenciaCritico}
                        </p>
                      )}

                      {renderizarContenidoItem?.({
                        item,
                        respuesta,
                      })}
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
            : ''}
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