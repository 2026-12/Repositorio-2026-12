import { useState, useMemo } from 'react';
import './FormularioSeccionA.css';

// Contenido oficial: Reglamento de Servicio de Alimentación al Público N° 37308-S
// (Guía de Evaluación Sanitaria, Acuerdo 1803)
const GRUPOS = [
  {
    articulo: 'Ubicación · Art. 5',
    critico: false,
    items: [
      { id: 'a1', texto: 'Distancia mayor o igual a 3m de expendios y bodegas de agroquímicos que no realizan mezclas y mayor o igual a 10m de aquellas que realizan mezclas.', valor: 1 },
      { id: 'a2', texto: 'Limpios, libres de basura o equipo en desuso', valor: 1 },
    ],
  },
  {
    articulo: 'Alrededores · Art. 6',
    critico: false,
    items: [
      { id: 'a3', texto: 'Libres de aguas estancadas', valor: 1 },
      { id: 'a4', texto: 'Zonas verdes y ornamentales recortadas y libres de maleza', valor: 1 },
      { id: 'a5', texto: 'Se observan equipos o materiales en desuso que puedan constituirse en atracción y refugio para insectos y roedores', valor: 1 },
      { id: 'a6', texto: 'Mantenimiento adecuado de los conductos o canales exteriores que drenan las aguas, para evitar su estancamiento.', valor: 1 },
    ],
  },
  {
    articulo: 'Edificaciones · Art. 7',
    critico: false,
    items: [
      { id: 'a7', texto: 'La edificación se encuentra en buenas condiciones físicas e higiénicas.', valor: 1 },
      { id: 'a8', texto: 'Cumple con las condiciones de acceso reguladas por la Ley 7600', valor: 1 },
      { id: 'a9', texto: 'Está independiente de viviendas u otras actividades de naturaleza distinta', valor: 1 },
    ],
  },
  {
    articulo: 'Distribución de las Áreas · Art. 8 y 9',
    critico: false,
    items: [
      { id: 'a10', texto: 'Según corresponda, cuenta con las áreas claramente definidas de: almacenamiento y conservación, Preparación, Consumo, Servicios sanitarios', valor: 1 },
      { id: 'a11', texto: 'Las dimensiones permiten el desarrollo adecuado de cada actividad', valor: 1 },
    ],
  },
  {
    articulo: 'Instalaciones de Gas · Art. 11',
    critico: false,
    items: [
      { id: 'a12', texto: 'Las tuberías o mangueras de gas se encuentran en buenas condiciones de funcionamiento (sin fugas)', valor: 2 },
      { id: 'a13', texto: 'Los cilindros se encuentran en buenas condiciones físicas y sus llaves de salida operan correctamente', valor: 2 },
      { id: 'a14', texto: 'Los cilindros se encuentran en un área ventilada, segura y debidamente protegida, fuera del área preparación de alimentos.', valor: 2 },
      { id: 'a15', texto: 'Cuentan con una bitácora donde se anota el mantenimiento preventivo y correctivo de las instalaciones de gas.', valor: 2 },
    ],
  },
  {
    articulo: 'Abastecimiento de Agua Potable · Art. 10',
    critico: true,
    items: [
      { id: 'a16', texto: 'Disposición de agua potable siempre', valor: 3 },
      { id: 'a17', texto: 'Agua suficiente para ejecutar todas las operaciones en el establecimiento', valor: 3 },
      { id: 'a18', texto: 'Existe un procedimiento escrito para la higienización de tanques de almacenamiento cuando cuenten con éstos.', valor: 2 },
    ],
  },
  {
    articulo: 'Instalaciones Eléctricas · Art. 12',
    critico: false,
    items: [
      { id: 'a19', texto: 'El cableado eléctrico, tomacorrientes, interruptores y enchufes se mantiene en buenas condiciones de funcionamiento.', valor: 2 },
      { id: 'a20', texto: 'Cuenta con caja de Brecker en buen estado de funcionamiento', valor: 1 },
      { id: 'a21', texto: 'El cableado eléctrico se encuentra entubado', valor: 1 },
      { id: 'a22', texto: 'Tomacorrientes e interruptores se encuentran anclados.', valor: 1 },
    ],
  },
];

const TABS = [
  'Aspectos Generales', 'Cocina y Preparación', 'Bodega de Insumos', 'Servicios Sanitarios',
  'Manejo de Desechos', 'Control de Plagas', 'Salud del Personal', 'Cierre y Dictamen',
];

const OPCIONES = [
  { valor: 'Cumple', icono: '✓' },
  { valor: 'No cumple', icono: '✗' },
  { valor: 'N/A', icono: '—' },
];

function FormularioSeccionA({ datos }) {
  // Cada respuesta guarda { estado: 'Cumple'|'No cumple'|'N/A', puntos: number }
  const [respuestas, setRespuestas] = useState({});

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
    GRUPOS.forEach((grupo) => {
      grupo.items.forEach((item) => {
        const respuesta = respuestas[item.id];
        if (respuesta?.estado === 'N/A') return;
        maximo += item.valor;
        if (respuesta?.estado === 'Cumple') obtenidos += respuesta.puntos ?? 0;
        if (grupo.critico && respuesta?.estado === 'No cumple') criticosIncumplidos += 1;
      });
    });
    return { obtenidos, maximo, criticosIncumplidos };
  }, [respuestas]);

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
          <span className="tarjeta__etiqueta">SECCIÓN A</span>
          <div className="tarjeta__titulo-fila">
            <h2>Condiciones Físicas y Sanitarias Generales de las Instalaciones</h2>
            <span className="chip chip--puntos">{obtenidos}/{maximo} Puntos</span>
          </div>
        </div>

        {GRUPOS.map((grupo) => (
          <div className="grupo" key={grupo.articulo}>
            <span className="grupo__etiqueta">{grupo.articulo}</span>
            {grupo.items.map((item) => {
              const respuesta = respuestas[item.id];
              const esCritico = grupo.critico;
              const incumplido = esCritico && respuesta?.estado === 'No cumple';
              return (
                <div className={`item ${incumplido ? 'item--critico' : ''}`} key={item.id}>
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
        <button type="button" className="boton boton--secundario">← Anterior</button>
        <span>Paso 1 de 9</span>
        <button type="button" className="boton boton--primario">Siguiente →</button>
      </footer>
    </div>
  );
}

export default FormularioSeccionA;