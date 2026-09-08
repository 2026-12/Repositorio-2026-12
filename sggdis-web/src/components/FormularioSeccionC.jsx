import { useState, useEffect, useMemo } from 'react';
import { obtenerSeccion } from '../services/guiasInspeccionService';
import { agruparPorArticulo } from '../domain/agrupacionItems';
import './formulario.css';
import { nombresVistas } from '../config/inspeccion';

const OPCIONES = [
    { valor: 'Cumple', icono: '✓' },
    { valor: 'No cumple', icono: '✗' },
    { valor: 'N/A', icono: '—' },
];

// En el backend la Sección C viene dividida en dos subsecciones con código propio.
const SUBSECCIONES = [
    { codigo: 'C1', titulo: 'Bodega de Insumos — Condiciones Físicas y Sanitarias' },
    { codigo: 'C2', titulo: 'Bodega de Insumos — Condiciones de Almacenamiento' },
];

function FormularioSeccionC({ datos, onAnterior, onSiguiente, puedeRetroceder, respuestas = {}, onRespuestasChange, seccionesCache = {}, onSeccionCargada, onIrAVista, maxAlcanzado = 0, indiceActual = 0, vistas = [] }) {
    const subsecciones = useMemo(
        () => SUBSECCIONES.filter((sub) => datos.secciones?.some((seccion) => seccion.codigo === sub.codigo)),
        [datos.secciones],
    );
    const [subSeccionActiva, setSubSeccionActiva] = useState(subsecciones[0]?.codigo ?? SUBSECCIONES[0].codigo);
    const [gruposPorSubseccion, setGruposPorSubseccion] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // Cada subsección (C1, C2) guarda su propio mapa de respuestas, para no
    // perder el progreso al cambiar de pestaña. Cada respuesta es
    // { estado: 'Cumple'|'No cumple'|'N/A', puntos: number }

    // Al cambiar de subsección llevar la vista al inicio de la página.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [subSeccionActiva]);

    useEffect(() => {
        async function cargarSeccionC() {
            try {
                setCargando(true);
                setError(null);

                // OJO: en la base de datos la Sección C está dividida en dos filas
                // (C1 = Condiciones Físicas y Sanitarias, C2 = Condiciones de
                // Almacenamiento), así que hay que traer ambas por separado.
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
                setError('No se pudo cargar la Sección C. Verificá que el backend esté corriendo.');
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

    // Marcar una opción; si ya estaba marcada, se desmarca (toggle).
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
                    // Al marcar "Cumple" se asignan los puntos completos por defecto;
                    // el inspector puede bajarlos con el selector de puntos.
                    puntos: opcion === 'Cumple' ? valorMaximo : 0,
                },
            };
        });
    };

    // Ajustar el puntaje parcial de un ítem ya marcado como "Cumple" (0..valor máximo).
    const manejarPuntos = (itemId, puntos) => {
        onRespuestasChange?.((prev) => ({
            ...prev,
            [itemId]: { ...prev[itemId], puntos },
        }));
    };

    // Los ítems marcados N/A no cuentan ni en el puntaje obtenido ni en el
    // máximo posible (regla 4 de la guía oficial). "Cumple" suma los puntos
    // parciales elegidos por el inspector, no siempre el valor completo.
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

    const [mostrarAlerta, setMostrarAlerta] = useState(false);

    // Contar los ítems totales y los pendientes en la subsección activa
    const { totalItemsEnSubseccion, itemsSinResponder } = useMemo(() => {
        let total = 0;
        let sinResponder = 0;
        grupos.forEach((grupo) => {
            grupo.items.forEach((item) => {
                total++;
                if (!respuestas[item.id]) {
                    sinResponder++;
                }
            });
        });
        return { totalItemsEnSubseccion: total, itemsSinResponder: sinResponder };
    }, [respuestas, grupos]);

    // Lista de ítems pendientes en la subsección activa, con su artículo, para
    // mostrarlos en el mensaje de validación (igual que en las demás secciones).
    const itemsPendientesDetalle = useMemo(() => {
        const pendientes = [];
        grupos.forEach((grupo) => {
            grupo.items.forEach((item) => {
                if (!respuestas[item.id]) {
                    pendientes.push({ id: item.id, articulo: grupo.articulo, texto: item.texto });
                }
            });
        });
        return pendientes;
    }, [respuestas, grupos]);

    // Navegación en el footer
    const manejarAnterior = () => {
        setMostrarAlerta(false);
        const index = subsecciones.findIndex((sub) => sub.codigo === subSeccionActiva);
        if (index > 0) {
            setSubSeccionActiva(subsecciones[index - 1].codigo);
        }
    };

    const manejarSiguiente = () => {
        if (itemsSinResponder > 0) {
            setMostrarAlerta(true);
            // Hacer scroll suave hacia arriba de la tarjeta para mostrar la alerta
            const tarjeta = document.querySelector('.tarjeta');
            if (tarjeta) {
                tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }
        setMostrarAlerta(false);

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
                <div className="tarjeta-estado">
                    <div className="estado-mensaje">
                        <span className="estado-mensaje__icono">⏳</span>
                        <p>Cargando Sección C…</p>
                    </div>
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
                    <div className="cabecera__logo">MS</div>
                    <div>
                        <h1>Guía de Inspección — Servicios de Alimentación al Público</h1>
                        <p>{datos.nombre} · Consecutivo: {datos.consecutivo}</p>
                    </div>
                </div>
                <div className="cabecera__estado">
                    {criticosIncumplidos > 0 && (
                        <span className="chip chip--alerta">⚠ {criticosIncumplidos} punto{criticosIncumplidos > 1 ? 's' : ''} crítico{criticosIncumplidos > 1 ? 's' : ''} detectado{criticosIncumplidos > 1 ? 's' : ''}</span>
                    )}
                    <span className="chip chip--info">{datos.tipoLabel}</span>
                </div>
            </header>

            <nav className="tabs">
                {vistas.map((vista, i) => {
                    const bloqueada = i > maxAlcanzado;

                    return (
                        <button
                            key={vista.codigo}
                            type="button"
                            disabled={bloqueada}
                            onClick={() => onIrAVista?.(i)}
                            className={`tabs__item ${i === indiceActual ? 'tabs__item--activo' : ''
                                } ${bloqueada ? 'tabs__item--bloqueado' : ''
                                }`}
                        >
                            {nombresVistas[vista.codigo] ?? vista.codigo}
                        </button>
                    );
                })}
            </nav>

            {/* Pestañas de subsección: solo el nombre (C1, C2...), sin check ni contador */}
            <nav className="subtabs">
                {subsecciones.map((sub) => (
                    <button
                        key={sub.codigo}
                        type="button"
                        className={`subtabs__item ${sub.codigo === subSeccionActiva ? 'subtabs__item--activo' : ''}`}
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

                {/* --- Mensajes de validación / progreso en tiempo real --- */}
                {mostrarAlerta && itemsSinResponder > 0 && (
                    <div className="alerta-validacion-error">
                        <span className="alerta-validacion-error__titulo">Validación de Formulario</span>
                        <span>No se puede avanzar. Faltan responder {itemsSinResponder} de los {totalItemsEnSubseccion} ítems:</span>
                        <ul className="alerta-validacion-error__lista">
                            {itemsPendientesDetalle.map((pendiente) => (
                                <li key={pendiente.id}>
                                    {pendiente.articulo} — {pendiente.texto}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {grupos.map((grupo) => (
                    <div className="grupo" key={grupo.articulo}>
                        <span className="grupo__etiqueta">{grupo.articulo}</span>
                        {grupo.items.map((item) => {
                            const respuesta = respuestas[item.id];
                            const esCritico = item.critico;
                            const incumplido = esCritico && respuesta?.estado === 'No cumple';
                            const esPendiente = mostrarAlerta && !respuesta;
                            return (
                                <div className={`item ${incumplido ? 'item--critico' : ''} ${esPendiente ? 'item--pendiente' : ''}`} key={item.id}>
                                    {esCritico && <span className="item__tag">⚠ PUNTO CRÍTICO</span>}
                                    <div className="item__fila">
                                        <div className="item__texto">
                                            <p>{item.texto}</p>
                                            <span className="item__valor">Valor: {item.valor} pts</span>
                                        </div>
                                        <div className="item__opciones">
                                            {OPCIONES.map((op) => (
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

            <footer className="pie">
                <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={() => {
                        if (subSeccionActiva === subsecciones[0]?.codigo) onAnterior?.();
                        else manejarAnterior();
                    }}
                    disabled={subSeccionActiva === subsecciones[0]?.codigo && !puedeRetroceder}
                >
                    ← Anterior
                </button>
                <span>Paso 3 de 9 (Subsección {subSeccionActiva})</span>
                <button
                    type="button"
                    className="boton boton--primario"
                    onClick={manejarSiguiente}
                >
                    Siguiente →
                </button>
            </footer>
        </div>
    );
}

export default FormularioSeccionC;
