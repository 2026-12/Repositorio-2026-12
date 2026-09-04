import { useEffect, useState } from 'react';
import { agruparPorArticulo } from '../domain/agrupacionItems';
import { obtenerSeccion } from '../services/guiasInspeccionService';
import { useRespuestasInspeccion } from '../hooks/useRespuestasInspeccion';
import './formulario.css';
import { obtenerPendientes } from '../domain/validacionSeccion';

const OPCIONES = [
  { valor: 'Cumple', icono: '✓' },
  { valor: 'No cumple', icono: '✗' },
  { valor: 'N/A', icono: '—' },
];

const TABS = [
  'Aspectos Generales', 'Cocina y Preparación', 'Bodega de Insumos', 'Servicios Sanitarios',
  'Manejo de Desechos', 'Control de Plagas', 'Salud del Personal', 'Cierre y Dictamen',
];

export default function FormularioSeccionGenerico({
  datos,
  codigo,
  titulo,
  paso,
  tabActivo = 0,
  onAnterior,
  onSiguiente,
  puedeRetroceder,
  respuestas,
  onRespuestasChange,
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
    obtenerSeccion(datos.idGuia ?? 1, codigo, datos.idTipoEstablecimiento)
      .then((seccion) => {
        if (activo) {
          setGrupos(agruparPorArticulo(seccion.items));
          onSeccionCargada?.(codigo, seccion);
          setError(null);
        }
      })
      .catch(() => {
        if (activo) setError(`No se pudo cargar la Sección ${codigo}. Verificá que el backend esté corriendo.`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, [codigo, datos.idGuia, datos.idTipoEstablecimiento, onSeccionCargada, seccionInicial]);

  const gruposActuales = seccionInicial ? agruparPorArticulo(seccionInicial.items) : grupos;
  const { respuestas: respuestasActuales, alternarRespuesta, actualizarPuntos, resumen } = useRespuestasInspeccion(gruposActuales, respuestas, onRespuestasChange);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const totalItems = gruposActuales.reduce((total, grupo) => total + grupo.items.length, 0);
  const itemsPendientes = obtenerPendientes(gruposActuales, respuestasActuales);
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

  if (cargando || error) {
    return (
      <div className="pagina">
        <div className="tarjeta-estado">
          <div className={`estado-mensaje ${error ? 'estado-mensaje--error' : ''}`}>
            <span className="estado-mensaje__icono">{error ? '⚠' : '⏳'}</span>
            <p>{error ?? `Cargando Sección ${codigo}…`}</p>
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
          {resumen.criticosIncumplidos > 0 && <span className="chip chip--alerta">⚠ {resumen.criticosIncumplidos} punto crítico detectado</span>}
          <span className="chip chip--info">{datos.tipoLabel}</span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((tab, indice) => <span key={tab} className={`tabs__item ${indice === tabActivo ? 'tabs__item--activo' : ''}`}>{tab}</span>)}
      </nav>

      <main className="tarjeta">
        <div className="tarjeta__encabezado">
          <span className="tarjeta__etiqueta">SECCIÓN {codigo}</span>
          <div className="tarjeta__titulo-fila">
            <h2>{titulo}</h2>
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
              const respuesta = respuestasActuales[item.id];
              const incumplido = item.critico && respuesta?.estado === 'No cumple';
              const esPendiente = mostrarAlerta && !respuesta;
              return (
                <div className={`item ${incumplido ? 'item--critico' : ''} ${esPendiente ? 'item--pendiente' : ''}`} key={item.id}>
                  {item.critico && <span className="item__tag">⚠ PUNTO CRÍTICO</span>}
                  <div className="item__fila">
                    <div className="item__texto"><p>{item.texto}</p><span className="item__valor">Valor: {item.valor} pts</span></div>
                    <div className="item__opciones">
                      {OPCIONES.map((opcion) => <button key={opcion.valor} type="button" className={`opcion opcion--${opcion.valor === 'Cumple' ? 'cumple' : opcion.valor === 'No cumple' ? 'no-cumple' : 'na'} ${respuesta?.estado === opcion.valor ? 'opcion--activa' : ''}`} onClick={() => alternarRespuesta(item.id, opcion.valor, item.valor)}>{opcion.icono} {opcion.valor}</button>)}
                    </div>
                  </div>
                  {respuesta?.estado === 'Cumple' && <div className="item__puntos"><span className="item__puntos-label">Puntos otorgados:</span><div className="item__puntos-opciones">{Array.from({ length: item.valor + 1 }, (_, puntos) => <button key={puntos} type="button" className={`punto-opcion ${respuesta.puntos === puntos ? 'punto-opcion--activa' : ''}`} onClick={() => actualizarPuntos(item.id, puntos)}>{puntos} pt{puntos !== 1 ? 's' : ''}</button>)}</div></div>}
                  {incumplido && <p className="item__advertencia">🛡 Al incumplir un punto crítico, se procederá inmediatamente a notificar mediante Orden Sanitaria según Art. 142 del Reglamento General de Alimentos.</p>}
                </div>
              );
            })}
          </div>
        ))}
      </main>

      <footer className="pie">
        <button type="button" className="boton boton--secundario" onClick={onAnterior} disabled={!puedeRetroceder}>← Anterior</button>
        <span>Paso {paso} de 9</span>
        <button type="button" className="boton boton--primario" onClick={manejarSiguiente}>Siguiente →</button>
      </footer>
    </div>
  );
}
