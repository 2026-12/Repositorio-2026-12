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
    { codigo: 'C1', titulo: 'Bodega de Insumos — Condiciones Físicas y Sanitarias' },
    { codigo: 'C2', titulo: 'Bodega de Insumos — Condiciones de Almacenamiento' },
];

function FormularioSeccionC({ datos, onAnterior, onSiguiente, onVolverInicio, puedeRetroceder, respuestas = {}, onRespuestasChange, seccionesCache = {}, onSeccionCargada, onIrAVista, maxAlcanzado = 0, indiceActual = 0, vistas = [], paso, totalPasos, guardando = false }) {
    const subsecciones = useMemo(
        () => SUBSECCIONES.filter((sub) => datos.secciones?.some((seccion) => seccion.codigo === sub.codigo)),
        [datos.secciones],
    );
    const [subSeccionActiva, setSubSeccionActiva] = useState(subsecciones[0]?.codigo ?? SUBSECCIONES[0].codigo);
    const [gruposPorSubseccion, setGruposPorSubseccion] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [mostrarPendientes, setMostrarPendientes] = useState(false);

    // Al cambiar de subsección llevar la vista al inicio de la página.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [subSeccionActiva]);

    useEffect(() => {
        async function cargarSeccionC() {
            try {
                setCargando(true);
                setError(null);

                const resultados = await Promise.all(subsecciones.map((sub) => (
                    seccionesCache[sub.codigo]
                    ?? obtenerSeccion(datos.idGuia ?? 1, sub.codigo, datos.idTipoEstablecimiento)
                )));
                const nuevosGrupos = {};
                resultados.forEach((datosApi, i) => {
                    nuevosGrupos[subsecciones[i].codigo] = agruparPorArticulo(datosApi.items);
                    onSeccionCargada?.(subsecciones[i].codigo, datosApi);
                });
                setGruposPorSubseccion(nuevosGrupos);
            } catch (err) {
                console.error('Error al cargar la Sección C:', err);
                setError('No se pudo cargar la Sección C. Verifique que el backend esté disponible.');
            } finally {
                setCargando(false);
            }
        }

        cargarSeccionC();
    }, [datos.idGuia, datos.idTipoEstablecimiento, onSeccionCargada, seccionesCache, subsecciones]);

    const grupos = useMemo(
        () => gruposPorSubseccion[subSeccionActiva] ?? [],
        [gruposPorSubseccion, subSeccionActiva],
    );

    const manejarSeleccion = (itemId, opcion, valorMaximo) => {
        onRespuestasChange?.((prev) => {
            const actual = prev[itemId];
            if (actual && actual.estado === opcion) {
                const copia = { ...prev };
                delete copia[itemId];
                return copia;
            }
            return {
                ...prev,
                [itemId]: {
                    estado: opcion,
                    puntos: opcion === 'Cumple' ? valorMaximo : 0,
                },
            };
        });
    };

    const manejarPuntos = (itemId, puntos) => {
        onRespuestasChange?.((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], puntos },
        }));
    };

    const { obtenidos, maximo, criticosIncumplidos } = useMemo(() => {
        let obtenidos = 0;
        let maximo = 0;
        let criticosIncumplidos = 0;
        grupos.forEach((grupo) => {
            grupo.items.forEach((item) => {
                const respuesta = respuestas[item.id];
                if (respuesta?.estado === 'N/A') return;
                maximo += item.valor;
                if (respuesta?.estado === 'Cumple') obtenidos += respuesta.puntos ?? 0;
                if (item.critico && respuesta?.estado === 'No cumple') criticosIncumplidos += 1;
            });
        });
        return { obtenidos, maximo, criticosIncumplidos };
    }, [respuestas, grupos]);

    const itemsPendientesDetalle = useMemo(() => obtenerPendientes(grupos, respuestas), [grupos, respuestas]);
    const itemsSinResponder = itemsPendientesDetalle.length;
    const porcentajeProgreso = vistas.length > 0 ? ((indiceActual + 1) / vistas.length) * 100 : 0;

    const subseccionesCompletas = useMemo(() => {
        const completas = {};
        subsecciones.forEach((sub) => {
            const gruposSubseccion = gruposPorSubseccion[sub.codigo] ?? [];
            const totalItems = gruposSubseccion.reduce((total, grupo) => total + grupo.items.length, 0);
            completas[sub.codigo] = totalItems > 0 && obtenerPendientes(gruposSubseccion, respuestas).length === 0;
        });
        return completas;
    }, [gruposPorSubseccion, respuestas, subsecciones]);

    // Navegación en el footer
    const manejarAnterior = () => {
        setMostrarPendientes(false);
        const index = subsecciones.findIndex((sub) => sub.codigo === subSeccionActiva);
        if (index > 0) {
            setSubSeccionActiva(subsecciones[index - 1].codigo);
        }
    };

    const manejarSiguiente = () => {
        if (itemsSinResponder > 0) {
            setMostrarPendientes(true);

            requestAnimationFrame(() => {
                const primerPendiente = document.querySelector('.item--pendiente');

                if (primerPendiente) {
                    primerPendiente.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    setTimeout(() => {
                        primerPendiente.focus();
                    }, 450);
                }
            });

            return;
        }

        setMostrarPendientes(false);

        const index = subsecciones.findIndex((sub) => sub.codigo === subSeccionActiva);
        if (index < subsecciones.length - 1) {
            setSubSeccionActiva(subsecciones[index + 1].codigo);
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
                        <span className="estado-mensaje__icono">⚠</span>
                        <p>{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    const subSeccionInfo = subsecciones.find((sub) => sub.codigo === subSeccionActiva) ?? SUBSECCIONES[0];

    return (
        <div className="pagina">
            <header className="cabecera">
                <div className="cabecera__marca">
                    <div className="cabecera__logo cabecera__logo--imagen">
                        <img src={mapaDorado} alt="Ministerio de Salud de Costa Rica" />
                    </div>
                    <div>
                        <h1>Guía de Inspección — Servicios de Alimentación al Público</h1>
                        <p>{datos.nombre} · Consecutivo: {datos.consecutivo}</p>
                    </div>
                </div>

                <div className="cabecera__acciones">
                    <div className="cabecera__estado">
                        {criticosIncumplidos > 0 && (
                            <span className="chip chip--alerta">⚠ {criticosIncumplidos} punto{criticosIncumplidos > 1 ? 's' : ''} crítico{criticosIncumplidos > 1 ? 's' : ''} detectado{criticosIncumplidos > 1 ? 's' : ''}</span>
                        )}
                        <span className="chip chip--info">{datos.tipoLabel}</span>
                    </div>

                    <button type="button" className="boton-volver-menu-inspeccion" onClick={onVolverInicio}>← Volver al menú</button>
                </div>
            </header>

            <div className="progreso-inspeccion">
                <div className="progreso-inspeccion__barra">
                    <div className="progreso-inspeccion__avance" style={{ width: `${porcentajeProgreso}%` }}></div>
                </div>
            </div>

            <nav className="tabs tabs--con-progreso">
                {vistas.map((vista, i) => {
                    const bloqueada = i > maxAlcanzado;
                    const completa = esVistaCompleta(vista, seccionesCache, respuestas);

                    return (
                        <button
                            key={vista.codigo}
                            type="button"
                            disabled={bloqueada}
                            onClick={() => onIrAVista?.(i)}
                            className={`tabs__item ${i === indiceActual ? 'tabs__item--activo' : ''
                                } ${bloqueada ? 'tabs__item--bloqueado' : ''
                                } ${completa ? 'tabs__item--completo' : ''
                                }`}
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
                        className={`subtabs__item ${sub.codigo === subSeccionActiva ? 'subtabs__item--activo' : ''} ${subseccionesCompletas[sub.codigo] ? 'subtabs__item--completo' : ''}`}
                        onClick={() => setSubSeccionActiva(sub.codigo)}
                    >
                        {sub.codigo}
                    </button>
                ))}
            </nav>

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
                            const esCritico = item.critico;
                            const incumplido = esCritico && respuesta?.estado === 'No cumple';
                            const esPendiente = mostrarPendientes && !respuesta;
                            return (
                                <div className={`item ${incumplido ? 'item--critico' : ''} ${esPendiente ? 'item--pendiente' : ''}`} key={item.id} tabIndex={esPendiente ? -1 : undefined}>
                                    {esCritico && <div className="item__critico-encabezado"><span className="item__tag">⚠ PUNTO CRÍTICO</span><span className="item__ayuda-critico">El incumplimiento de este criterio puede requerir la emisión de una Orden Sanitaria.</span></div>}
                                    <div className="item__fila">
                                        <div className="item__texto">
                                            <p>{item.texto}</p>
                                            <span className="item__valor">Valor: {item.valor} pts</span>
                                        </div>
                                        <div className="item__opciones">
                                            {OPCIONES_ESTANDAR.map((op) => (
                                                <button
                                                    key={op.valor}
                                                    type="button"
                                                    className={`opcion opcion--${op.valor === 'Cumple' ? 'cumple' : op.valor === 'No cumple' ? 'no-cumple' : 'na'} ${respuesta?.estado === op.valor ? 'opcion--activa' : ''}`}
                                                    onClick={() => manejarSeleccion(item.id, op.valor, item.valor)}
                                                >
                                                    {op.icono} {op.valor}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {respuesta?.estado === 'Cumple' && (
                                        <div className="item__puntos">
                                            <span className="item__puntos-label">Puntos otorgados:</span>
                                            <div className="item__puntos-opciones">
                                                {Array.from({ length: item.valor + 1 }, (_, n) => n).map((n) => (
                                                    <button
                                                        key={n}
                                                        type="button"
                                                        className={`punto-opcion ${respuesta.puntos === n ? 'punto-opcion--activa' : ''}`}
                                                        onClick={() => manejarPuntos(item.id, n)}
                                                    >
                                                        {n} pt{n !== 1 ? 's' : ''}
                                                    </button>
                                                ))}
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
                        })}
                    </div>
                ))}
            </main>

            <footer className="pie pie--fijo">
                <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={() => {
                        if (subSeccionActiva === subsecciones[0]?.codigo) onAnterior?.();
                        else manejarAnterior();
                    }}
                >
                    ← Anterior
                </button>
                <span>Paso {paso}{totalPasos ? ` de ${totalPasos}` : ` de ${TOTAL_PASOS_ALIMENTOS}`} (Subsección {subSeccionActiva})</span>
                <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={manejarSiguiente}
                    disabled={guardando}
                >
                    {guardando ? 'Guardando…' : 'Siguiente →'}
                </button>
            </footer>
        </div>
    );
}

export default FormularioSeccionC;