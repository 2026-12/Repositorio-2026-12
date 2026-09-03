import { useState, useEffect, useMemo } from 'react';
import './FormularioSeccionC.css';

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

// Igual que en FormularioSeccionA: convierte la lista plana de ítems que
// devuelve la API en grupos por artículo.
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

function FormularioSeccionC({ datos }) {
  // C1 y C2 se guardan por separado para poder mostrar el título dorado de
  // cada subsección, pero se validan y puntúan como una sola Sección C.
  const [gruposC1, setGruposC1] = useState([]);
  const [gruposC2, setGruposC2] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cada respuesta guarda { estado: 'Cumple'|'No cumple'|'N/A', puntos: number }
  const [respuestas, setRespuestas] = useState({});

  // Controla si se debe mostrar la alerta roja de "faltan ítems" (solo
  // aparece después de un intento fallido de avanzar, no desde el inicio).
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  useEffect(() => {
    async function cargarSeccion() {
      try {
        setCargando(true);
        setError(null);

        // OJO: en la base de datos la Sección C está dividida en dos filas
        // (C1 = Condiciones Físicas y Sanitarias, C2 = Condiciones de
        // Almacenamiento), así que hay que traer ambas y juntarlas en una
        // sola vista para el usuario final.
        const [resC1, resC2] = await Promise.all([
          fetch(`${API_BASE_URL}/api/guias-inspeccion/1/secciones/C1`),
          fetch(`${API_BASE_URL}/api/guias-inspeccion/1/secciones/C2`),
        ]);
        if (!resC1.ok || !resC2.ok) {
          throw new Error('La API respondió con un error.');
        }
        const [datosC1, datosC2] = await Promise.all([resC1.json(), resC2.json()]);
        setGruposC1(agruparPorArticulo(datosC1.items));
        setGruposC2(agruparPorArticulo(datosC2.items));
      } catch (err) {
        console.error('Error al cargar la Sección C:', err);
        setError('No se pudo cargar la Sección C. Verificá que el backend esté corriendo.');
      } finally {
        setCargando(false);
      }
    }

    cargarSeccion();
  }, []);

  // Todos los grupos combinados (C1 + C2), usado para puntaje y validación.
  const todosLosGrupos = useMemo(() => [...gruposC1, ...gruposC2], [gruposC1, gruposC2]);

  // Marcar una opción; si ya estaba marcada, se desmarca (toggle).
  const manejarSeleccion = (itemId, opcion, valorMaximo) => {
    setRespuestas((prev) => {
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
    setRespuestas((prev) => ({
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
    todosLosGrupos.forEach((grupo) => {
      grupo.items.forEach((item) => {
        const respuesta = respuestas[item.id];
        if (respuesta?.estado === 'N/A') return;
        maximo += item.valor;
        if (respuesta?.estado === 'Cumple') obtenidos += respuesta.puntos ?? 0;
        if (item.critico && respuesta?.estado === 'No cumple') criticosIncumplidos += 1;
      });
    });
    return { obtenidos, maximo, criticosIncumplidos };
  }, [respuestas, todosLosGrupos]);

  // Cuenta los ítems totales y los pendientes de responder (entre C1 y C2
  // juntas), para la validación de obligatoriedad (issue #107).
  const { totalItems, itemsSinResponder } = useMemo(() => {
    let total = 0;
    let sinResponder = 0;
    todosLosGrupos.forEach((grupo) => {
      grupo.items.forEach((item) => {
        total++;
        if (!respuestas[item.id]) {
          sinResponder++;
        }
      });
    });
    return { totalItems: total, itemsSinResponder: sinResponder };
  }, [respuestas, todosLosGrupos]);

  // Al hacer clic en "Siguiente": si faltan ítems por responder, no avanza
  // y muestra la alerta con scroll hacia arriba. Si todo está respondido,
  // avanza (por ahora con un alert(); cuando el wizard general esté listo,
  // este es el lugar donde se llamaría a onCompletar()).
  const manejarSiguiente = () => {
    if (itemsSinResponder > 0) {
      setMostrarAlerta(true);
      const tarjeta = document.querySelector('.tarjeta');
      if (tarjeta) {
        tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    setMostrarAlerta(false);
    alert('¡Sección C completada con éxito! Todos los ítems fueron respondidos.');
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

  // Se repite igual para C1 y C2, así que se saca a una función en vez de
  // duplicar todo el JSX dos veces.
  function renderizarGrupos(grupos) {
    return grupos.map((grupo) => (
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
    ));
  }

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
          <span key={tab} className={`tabs__item ${i === 0 ? 'tabs__item--activo' : ''}`}>
            {tab}
          </span>
        ))}
      </nav>

      <main className="tarjeta">
        <div className="tarjeta__encabezado">
          <span className="tarjeta__etiqueta">SECCIÓN C</span>
          <div className="tarjeta__titulo-fila">
            <h2>Del Almacenamiento de Alimentos</h2>
            <span className="chip chip--puntos">{obtenidos}/{maximo} Puntos</span>
          </div>
        </div>

        {/* --- Mensajes de validación / progreso en tiempo real --- */}
        {mostrarAlerta && itemsSinResponder > 0 && (
          <div className="alerta-validacion-error">
            <span className="alerta-validacion-error__titulo">⚠️ Validación de Formulario</span>
            <span>No se puede avanzar. Faltan responder {itemsSinResponder} de los {totalItems} ítems. Por favor complete los campos marcados en rojo.</span>
          </div>
        )}

        {!mostrarAlerta && itemsSinResponder > 0 && (
          <div className="mensaje-progreso-validacion">
            <span>📝 En progreso: Has respondido {totalItems - itemsSinResponder} de {totalItems} ítems. Faltan {itemsSinResponder} por completar.</span>
          </div>
        )}

        {itemsSinResponder === 0 && totalItems > 0 && (
          <div className="mensaje-progreso-validacion mensaje-progreso-validacion--completo">
            <span>✅ ¡Excelente! Completaste los {totalItems} ítems de esta sección.</span>
          </div>
        )}

        {/* C1: Condiciones Físicas y Sanitarias */}
        <h3 className="subseccion-titulo">Condiciones Físicas y Sanitarias</h3>
        {renderizarGrupos(gruposC1)}

        {/* C2: Condiciones de Almacenamiento */}
        <h3 className="subseccion-titulo">Condiciones de Almacenamiento</h3>
        {renderizarGrupos(gruposC2)}
      </main>

      <footer className="pie">
        <button type="button" className="boton boton--secundario">← Anterior</button>
        <span>Paso 3 de 9</span>
        <button type="button" className="boton boton--primario" onClick={manejarSiguiente}>
          Siguiente →
        </button>
      </footer>
    </div>
  );
}

export default FormularioSeccionC;
