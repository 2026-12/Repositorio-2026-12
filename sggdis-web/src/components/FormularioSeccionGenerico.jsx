import { useEffect, useState } from 'react';
import { agruparPorArticulo } from '../domain/agrupacionItems';
import { obtenerSeccion } from '../services/guiasInspeccionService';
import { useRespuestasInspeccion } from '../hooks/useRespuestasInspeccion';
import { OPCIONES_ESTANDAR } from '../domain/opcionesRespuesta';
import './formulario.css';
import { obtenerPendientes } from '../domain/validacionSeccion';
import { esVistaCompleta } from '../domain/progresoVistas';
import { nombresVistas } from '../config/inspeccion';
import mapaDorado from '../assets/mapa-dorado.png';

const MARCA_POR_DEFECTO = { logo: 'IN', tituloGuia: 'Guía de Inspección' };


// Núcleo visual reutilizable para cualquier guía de inspección por
// secciones. No conoce textos ni reglas de una guía en particular: cada
// guía (p. ej. alimentos) los provee vía props o mediante un componente
// adaptador que envuelva a este.
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
  obtenerOpcionesItem = (item, opcionesBase) => opcionesBase,
  obtenerPuntosItem = (item) => Array.from({ length: item.valor + 1 }, (_, n) => n),
  renderizarContenidoItem,
  guardando = false,
}) {
  const [grupos, setGrupos] = useState(seccionInicial ? agruparPorArticulo(seccionInicial.items) : []);
  const [cargando, setCargando] = useState(!seccionInicial);
  const [error, setError] = useState(null);
  const [mostrarPendientes, setMostrarPendientes] = useState(false);

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
        if (activo) setError(`No se pudo cargar la Sección ${codigo}. Verifique que el backend esté disponible.`);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => { activo = false; };
  }, [codigo, datos.idGuia, datos.idTipoEstablecimiento, onSeccionCargada, seccionInicial]);

  const gruposActuales = seccionInicial ? agruparPorArticulo(seccionInicial.items) : grupos;
  const { respuestas: respuestasActuales, alternarRespuesta, actualizarPuntos, resumen } = useRespuestasInspeccion(gruposActuales, respuestas, onRespuestasChange);
  const itemsPendientes = obtenerPendientes(gruposActuales, respuestasActuales);
  const pendientes = itemsPendientes.length;
  const porcentajeProgreso = vistas.length > 0 ? ((indiceActual + 1) / vistas.length) * 100 : 0;

  const manejarSiguiente = () => {
    if (pendientes > 0) {
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
    onSiguiente?.();
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

  return (
    <div className="pagina">
      <header className="cabecera">
        <div className="cabecera__marca">
          <div className="cabecera__logo cabecera__logo--imagen">
            <img src={mapaDorado} alt="Ministerio de Salud de Costa Rica" />
          </div>
          <div>
            <h1>{marca.tituloGuia}</h1>
            <p>{datos.nombre} · Consecutivo: {datos.consecutivo}</p>
          </div>
        </div>

        <div className="cabecera__acciones">
          <div className="cabecera__estado">
            {resumen.criticosIncumplidos > 0 && <span className="chip chip--alerta">⚠ {resumen.criticosIncumplidos} punto crítico detectado</span>}
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
              className={`tabs__item ${
                i === indiceActual ? 'tabs__item--activo' : ''
              } ${
                bloqueada ? 'tabs__item--bloqueado' : ''
              } ${
                completa ? 'tabs__item--completo' : ''
              }`}
            >
              {nombresVistas[vista.codigo] ?? vista.codigo}
            </button>
          );
        })}
      </nav>

      <main className="tarjeta">
        <div className="tarjeta__encabezado">
          <span className="tarjeta__etiqueta">SECCIÓN {codigo}</span>
          <div className="tarjeta__titulo-fila">
            <h2>{titulo}</h2>
            <span className="chip chip--puntos">{resumen.obtenidos}/{resumen.maximo} Puntos</span>
          </div>
        </div>

        {gruposActuales.map((grupo) => (
          <div className="grupo" key={grupo.articulo}>
            <span className="grupo__etiqueta">{grupo.articulo}</span>
            {grupo.items.map((item) => {
              const respuesta = respuestasActuales[item.id];
              const incumplido = item.critico && respuesta?.estado === 'No cumple';
              const esPendiente = mostrarPendientes && !respuesta;
              const opcionesItem = obtenerOpcionesItem(item, opciones);
              const puntosItem = obtenerPuntosItem(item);
              return (
                <div className={`item ${incumplido ? 'item--critico' : ''} ${esPendiente ? 'item--pendiente' : ''}`} key={item.id} tabIndex={esPendiente ? -1 : undefined}>
                  {item.critico && <div className="item__critico-encabezado"><span className="item__tag">⚠ PUNTO CRÍTICO</span><span className="item__ayuda-critico">El incumplimiento de este criterio puede requerir la emisión de una Orden Sanitaria.</span></div>}
                  <div className="item__fila">
                    <div className="item__texto"><p>{item.texto}</p><span className="item__valor">Valor: {item.valor} pts</span></div>
                    <div className="item__opciones">
                      {opcionesItem.map((opcion) => <button key={opcion.valor} type="button" className={`opcion opcion--${opcion.valor === 'Cumple' ? 'cumple' : opcion.valor === 'No cumple' ? 'no-cumple' : 'na'} ${respuesta?.estado === opcion.valor ? 'opcion--activa' : ''}`} onClick={() => alternarRespuesta(item.id, opcion.valor, item.valor)}>{opcion.icono} {opcion.valor}</button>)}
                    </div>
                  </div>
                  {respuesta?.estado === 'Cumple' && <div className="item__puntos"><span className="item__puntos-label">Puntos otorgados:</span><div className="item__puntos-opciones">{puntosItem.map((puntos) => <button key={puntos} type="button" className={`punto-opcion ${respuesta.puntos === puntos ? 'punto-opcion--activa' : ''}`} onClick={() => actualizarPuntos(item.id, puntos)}>{puntos} pt{puntos !== 1 ? 's' : ''}</button>)}</div></div>}
                  {incumplido && <p className="item__advertencia">{textoAdvertenciaCritico}</p>}
                  {renderizarContenidoItem?.({ item, respuesta })}
                </div>
              );
            })}
          </div>
        ))}
      </main>

      <footer className="pie pie--fijo">
        <button type="button" className="boton boton--secundario" onClick={onAnterior}>← Anterior</button>
        <span>Paso {paso}{totalPasos ? ` de ${totalPasos}` : ''}</span>
        <button type="button" className="boton boton--secundario" onClick={manejarSiguiente} disabled={guardando}>{guardando ? 'Guardando…' : 'Siguiente →'}</button>
      </footer>
    </div>
  );
}