import { useState, useEffect, useMemo } from 'react';
import './FormularioSeccionB.css';

// Ajustar el puerto si el tuyo es distinto al que muestra Swagger
const API_BASE_URL = 'https://localhost:7119';

const TABS = [
  'Aspectos Generales', 'Cocina y Preparación', 'Bodega de Insumos', 'Servicios Sanitarios',
  'Manejo de Desechos', 'Control de Plagas', 'Salud del Personal', 'Cierre y Dictamen',
];

const OPCIONES = [
  { valor: 'Cumple', icono: '✓' },
  { valor: 'No cumple', icono: '✗' },
  { valor: 'N/A', icono: '—' },
];

// En el backend la Sección B viene dividida en tres subsecciones con código propio.
const SUBSECCIONES = [
  { codigo: 'B1', titulo: 'Área de Preparación de Alimentos (Cocina) — Condiciones Físicas y Sanitarias' },
  { codigo: 'B2', titulo: 'Área de Preparación de Alimentos (Cocina) — Equipo y Utensilios' },
  { codigo: 'B3', titulo: 'Área de Preparación de Alimentos (Cocina) — Operaciones de Preparación de los Alimentos' },
];

// Convierte la lista plana de ítems que devuelve la API en grupos por artículo,
// igual a como antes venía armado el array GRUPOS a mano.
function agruparPorArticulo(items) {
  const grupos = [];
  let grupoActual = null;

  items.forEach((item) => {
    if (!grupoActual || grupoActual.articulo !== item.articulo) {
      grupoActual = { articulo: item.articulo, items: [] };
      grupos.push(grupoActual);
    }
    grupoActual.items.push({
      id: item.idItem,
      texto: item.descripcion,
      valor: item.puntaje,
      critico: item.esCritico,
    });
  });

  return grupos;
}

function FormularioSeccionB({ datos }) {
  const [subSeccionActiva, setSubSeccionActiva] = useState(SUBSECCIONES[0].codigo);
  const [gruposPorSubseccion, setGruposPorSubseccion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cada subsección (B1, B2, B3) guarda su propio mapa de respuestas, para no
  // perder el progreso al cambiar de pestaña. Cada respuesta es
  // { estado: 'Cumple'|'No cumple'|'N/A', puntos: number }
  const [respuestasPorSubseccion, setRespuestasPorSubseccion] = useState({});

  useEffect(() => {
    async function cargarSeccionB() {
      try {
        setCargando(true);
        setError(null);
        const resultados = await Promise.all(
          SUBSECCIONES.map(async (sub) => {
            const respuesta = await fetch(`${API_BASE_URL}/api/guias-inspeccion/1/secciones/${sub.codigo}`);
            if (!respuesta.ok) {
              throw new Error(`La API respondió con un error en la subsección ${sub.codigo}.`);
            }
            return respuesta.json();
          })
        );
        const nuevosGrupos = {};
        resultados.forEach((datosApi, i) => {
          nuevosGrupos[SUBSECCIONES[i].codigo] = agruparPorArticulo(datosApi.items);
        });
        setGruposPorSubseccion(nuevosGrupos);
      } catch (err) {
        console.error('Error al cargar la Sección B:', err);
        setError('No se pudo cargar la Sección B. Verificá que el backend esté corriendo.');
      } finally {
        setCargando(false);
      }
    }

    cargarSeccionB();
  }, []);

  const grupos = gruposPorSubseccion[subSeccionActiva] ?? [];
  const respuestas = respuestasPorSubseccion[subSeccionActiva] ?? {};

  // Marcar una opción; si ya estaba marcada, se desmarca (toggle).
  const manejarSeleccion = (itemId, opcion, valorMaximo) => {
    setRespuestasPorSubseccion((prev) => {
      const respuestasSub = prev[subSeccionActiva] ?? {};
      const actual = respuestasSub[itemId];
      if (actual && actual.estado === opcion) {
        const copia = { ...respuestasSub };
        delete copia[itemId];
        return { ...prev, [subSeccionActiva]: copia };
      }
      return {
        ...prev,
        [subSeccionActiva]: {
          ...respuestasSub,
          [itemId]: {
            estado: opcion,
            // Al marcar "Cumple" se asignan los puntos completos por defecto;
            // el inspector puede bajarlos con el selector de puntos.
            puntos: opcion === 'Cumple' ? valorMaximo : 0,
          },
        },
      };
    });
  };

  // Ajustar el puntaje parcial de un ítem ya marcado como "Cumple" (0..valor máximo).
  const manejarPuntos = (itemId, puntos) => {
    setRespuestasPorSubseccion((prev) => ({
      ...prev,
      [subSeccionActiva]: {
        ...prev[subSeccionActiva],
        [itemId]: { ...prev[subSeccionActiva]?.[itemId], puntos },
      },
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

  // Cada vez que cambiamos de subsección activa, limpiamos la alerta de intento fallido
  useEffect(() => {
    setMostrarAlerta(false);
  }, [subSeccionActiva]);

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

  // Navegación en el footer
  const manejarAnterior = () => {
    setMostrarAlerta(false);
    const index = SUBSECCIONES.findIndex((sub) => sub.codigo === subSeccionActiva);
    if (index > 0) {
      setSubSeccionActiva(SUBSECCIONES[index - 1].codigo);
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
    
    const index = SUBSECCIONES.findIndex((sub) => sub.codigo === subSeccionActiva);
    if (index < SUBSECCIONES.length - 1) {
      setSubSeccionActiva(SUBSECCIONES[index + 1].codigo);
    } else {
      alert('¡Sección B completada con éxito! Todos los ítems fueron respondidos.');
    }
  };

  if (cargando) {
    return (
      <div className="pagina">
        <div className="tarjeta-estado">
          <div className="estado-mensaje">
            <span className="estado-mensaje__icono">⏳</span>
            <p>Cargando Sección B…</p>
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

  const subSeccionInfo = SUBSECCIONES.find((sub) => sub.codigo === subSeccionActiva);

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
        {TABS.map((tab, i) => (
          <span key={tab} className={`tabs__item ${i === 1 ? 'tabs__item--activo' : ''}`}>
            {tab}
          </span>
        ))}
      </nav>

      <nav className="subtabs">
        {SUBSECCIONES.map((sub) => {
          const subGrupos = gruposPorSubseccion[sub.codigo] ?? [];
          const subRespuestas = respuestasPorSubseccion[sub.codigo] ?? {};
          let total = 0;
          let contestados = 0;
          subGrupos.forEach((grupo) => {
            grupo.items.forEach((item) => {
              total++;
              if (subRespuestas[item.id]) {
                contestados++;
              }
            });
          });
          const esCompleto = total > 0 && contestados === total;
          const esIniciado = contestados > 0 && contestados < total;

          return (
            <button
              key={sub.codigo}
              type="button"
              className={`subtabs__item ${sub.codigo === subSeccionActiva ? 'subtabs__item--activo' : ''}`}
              onClick={() => setSubSeccionActiva(sub.codigo)}
            >
              {sub.codigo} {esCompleto ? '✓' : esIniciado ? `(${contestados}/${total})` : ''}
            </button>
          );
        })}
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
            <span className="alerta-validacion-error__titulo">⚠️ Validación de Formulario</span>
            <span>No se puede avanzar. Faltan responder {itemsSinResponder} de los {totalItemsEnSubseccion} ítems en esta subsección. Por favor complete los campos marcados en rojo.</span>
          </div>
        )}

        {!mostrarAlerta && itemsSinResponder > 0 && (
          <div className="mensaje-progreso-validacion">
            <span>📝 Subsección en progreso: Has respondido {totalItemsEnSubseccion - itemsSinResponder} de {totalItemsEnSubseccion} ítems. Faltan {itemsSinResponder} por completar.</span>
          </div>
        )}

        {itemsSinResponder === 0 && totalItemsEnSubseccion > 0 && (
          <div className="mensaje-progreso-validacion mensaje-progreso-validacion--completo">
            <span>✅ ¡Excelente! Completaste los {totalItemsEnSubseccion} ítems de esta subsección.</span>
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
          onClick={manejarAnterior}
          disabled={subSeccionActiva === SUBSECCIONES[0].codigo}
          style={{ opacity: subSeccionActiva === SUBSECCIONES[0].codigo ? 0.5 : 1, cursor: subSeccionActiva === SUBSECCIONES[0].codigo ? 'not-allowed' : 'pointer' }}
        >
          ← Anterior
        </button>
        <span>Paso 2 de 9 (Subsección {subSeccionActiva})</span>
        <button 
          type="button" 
          className="boton boton--primario"
          onClick={manejarSiguiente}
        >
          {subSeccionActiva === SUBSECCIONES[SUBSECCIONES.length - 1].codigo ? 'Finalizar Sección B ✓' : 'Siguiente →'}
        </button>
      </footer>
    </div>
  );
}

export default FormularioSeccionB;