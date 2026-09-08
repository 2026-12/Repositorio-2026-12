import { useEffect, useMemo, useState } from 'react';
import { obtenerSeccion } from '../services/guiasInspeccionService';
import { agruparPorArticulo } from '../domain/agrupacionItems';
import { calcularResumen } from '../domain/calculoPuntaje';
import { obtenerPendientes } from '../domain/validacionSeccion';
import './formulario.css';

const TABS = [
  'Aspectos Generales', 'Cocina y Preparación', 'Bodega de Insumos', 'Servicios Sanitarios',
  'Manejo de Desechos', 'Control de Plagas', 'Salud del Personal', 'Cierre y Dictamen',
];

// Sección H solo tiene 2 opciones válidas (no "N/A" a nivel general).
const OPCIONES = [
  { valor: 'Cumple', icono: '✓' },
  { valor: 'No cumple', icono: '✗' },
];

function puedeMostrarNoAplica(item) {
  return item?.noAplica === true || item?.noAplica === 'S' || item?.noAplica === 's';
}

export default function FormularioSeccionH({
  datos,
  onAnterior,
  onSiguiente,
  puedeRetroceder,
  respuestas = {},
  onRespuestasChange,
  observaciones = {},
  onObservacionesChange,
  paso,
  totalPasos,
  seccionInicial,
  onSeccionCargada,
}) {
  const [grupos, setGrupos] = useState(seccionInicial ? agruparPorArticulo(seccionInicial.items) : []);
  const [cargando, setCargando] = useState(!seccionInicial);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    if (seccionInicial) {
      setGrupos(agruparPorArticulo(seccionInicial.items));
      setError(null);
      setCargando(false);
      return () => { activo = false; };
    }
    setCargando(true);
    obtenerSeccion(datos.idGuia ?? 1, 'H', datos.idTipoEstablecimiento)
      .then((seccion) => {
        if (activo) {
          setGrupos(agruparPorArticulo(seccion.items));
          onSeccionCargada?.('H', seccion);
          setError(null);
        }
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar la Sección H. Verificá que el backend esté corriendo.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, [datos.idGuia, datos.idTipoEstablecimiento, onSeccionCargada, seccionInicial]);

  const gruposActuales = seccionInicial ? agruparPorArticulo(seccionInicial.items) : grupos;

  // Puntaje parcial de la sección, recalculado en cada cambio de respuestas.
  // criticosIncumplidos se ignora acá porque ningún ítem de la Sección H es crítico
  // (ES_CRITICO = 'N' en los 6 ítems, según el script de base de datos).
  const resumen = useMemo(
    () => calcularResumen(gruposActuales, respuestas),
    [gruposActuales, respuestas],
  );
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const totalItems = gruposActuales.reduce((total, grupo) => total + grupo.items.length, 0);
  const itemsPendientes = obtenerPendientes(gruposActuales, respuestas);
  const pendientes = itemsPendientes.length;

  const manejarSiguiente = () => {
    if (pendientes > 0) {
      setMostrarAlerta(true);
      const tarjeta = document.querySelector('.tarjeta');
      if (tarjeta) {
        tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }
    setMostrarAlerta(false);
    onSiguiente?.();
  };

  // --- Paso 1: solo maneja selección de estado y observación, sin puntaje/validación todavía ---
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
        [itemId]: { estado: opcion, puntos: opcion === 'Cumple' ? valorMaximo : 0 },
      };
    });
  };

  // 1. Agregar esta función junto a manejarSeleccion / manejarObservacion
const manejarPuntos = (itemId, puntos) => {
  onRespuestasChange?.((prev) => ({
    ...prev,
    [itemId]: { ...prev[itemId], puntos },
  }));
};
  
  const manejarObservacion = (itemId, texto) => {
    onObservacionesChange?.((prev) => ({ ...prev, [itemId]: texto }));
  };

  if (cargando || error) {
    return (
      <div className="pagina">
        <div className="tarjeta-estado">
          <div className={`estado-mensaje ${error ? 'estado-mensaje--error' : ''}`}>
            <span className="estado-mensaje__icono">{error ? '⚠' : '⏳'}</span>
            <p>{error ?? 'Cargando Sección H…'}</p>
          </div>
        </div>
      </div>
    );
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
          <span className="chip chip--info">{datos.tipoLabel}</span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((tab, indice) => (
          <span key={tab} className={`tabs__item ${indice === 8 ? 'tabs__item--activo' : ''}`}>{tab}</span>
        ))}
      </nav>

      <main className="tarjeta">
        <div className="tarjeta__encabezado">
          <span className="tarjeta__etiqueta">SECCIÓN H</span>
            <div className="tarjeta__titulo-fila">
                <h2>Servicio de Catering</h2>
                <span className="chip chip--puntos">{resumen.obtenidos}/{resumen.maximo} Puntos</span>
            </div>
        </div>

        {mostrarAlerta && pendientes > 0 && (
          <div className="alerta-validacion-error">
            <span className="alerta-validacion-error__titulo">Validación de Formulario</span>
            <span>No se puede avanzar. Faltan responder {pendientes} de los {totalItems} ítems:</span>
            <ul className="alerta-validacion-error__lista">
              {itemsPendientes.slice(0, 6).map((item) => (
                <li key={item.id}>{item.articulo} — {item.texto}</li>
              ))}
              {pendientes > 6 && <li>y {pendientes - 6} ítem{pendientes - 6 !== 1 ? 's' : ''} más…</li>}
            </ul>
          </div>
        )}

        {gruposActuales.map((grupo) => (
          <div className="grupo" key={grupo.articulo}>
            <span className="grupo__etiqueta">{grupo.articulo}</span>
            {grupo.items.map((item) => {
              const respuesta = respuestas[item.id];
              const permiteNoAplica = puedeMostrarNoAplica(item);
              const esPendiente = mostrarAlerta && !respuesta;
              return (
                <div className={`item ${esPendiente ? 'item--pendiente' : ''}`} key={item.id}>
                  <div className="item__fila">
                    <div className="item__texto">
                      <p>{item.texto}</p>
                      <span className="item__valor">Valor: {item.valor} pts</span>
                    </div>
                    <div className="item__opciones">
                      {OPCIONES.map((opcion) => (
                        <button
                          key={opcion.valor}
                          type="button"
                          className={`opcion opcion--${opcion.valor === 'Cumple' ? 'cumple' : 'no-cumple'} ${respuesta?.estado === opcion.valor ? 'opcion--activa' : ''}`}
                          onClick={() => manejarSeleccion(item.id, opcion.valor, item.valor)}
                        >
                          {opcion.icono} {opcion.valor}
                        </button>
                      ))}
                      {permiteNoAplica && (
                        <button
                          type="button"
                          className={`opcion opcion--na ${respuesta?.estado === 'N/A' ? 'opcion--activa' : ''}`}
                          onClick={() => manejarSeleccion(item.id, 'N/A', item.valor)}
                        >
                          — No aplica
                        </button>
                      )}
                    </div>
                  </div>

                    {respuesta?.estado === 'Cumple' && (
                    <div className="item__puntos">
                        <span className="item__puntos-label">Puntos otorgados:</span>
                        <div className="item__puntos-opciones">
                        {Array.from({ length: item.valor }, (_, indice) => indice + 1).map((puntos) => (
                            <button
                            key={puntos}
                            type="button"
                            className={`punto-opcion ${respuesta.puntos === puntos ? 'punto-opcion--activa' : ''}`}
                            onClick={() => manejarPuntos(item.id, puntos)}
                            >
                            {puntos} pt{puntos !== 1 ? 's' : ''}
                            </button>
                        ))}
                        </div>
                    </div>
                    )}

                  <div className="item__observacion">
                    <label htmlFor={`obs-${item.id}`}>Observación (opcional)</label>
                    <textarea
                      id={`obs-${item.id}`}
                      rows={2}
                      placeholder="Anotar observación..."
                      value={observaciones[item.id] ?? ''}
                      onChange={(e) => manejarObservacion(item.id, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </main>

      <footer className="pie">
        <button type="button" className="boton boton--secundario" onClick={onAnterior} disabled={!puedeRetroceder}>← Anterior</button>
        <span>Paso {paso ?? 8} de {totalPasos ?? 9}</span>
        <button type="button" className="boton boton--primario" onClick={manejarSiguiente}>Siguiente →</button>
      </footer>
    </div>
  );
}