import { useState, useEffect, useMemo } from 'react';
import { obtenerSeccion } from '../services/guiasInspeccionService';
import { agruparPorArticulo } from '../domain/agrupacionItems';
import { obtenerPendientes } from '../domain/validacionSeccion';
import { OPCIONES_ESTANDAR } from '../domain/opcionesRespuesta';
import { useRespuestasInspeccion } from '../hooks/useRespuestasInspeccion';
import {
  MARCA_ALIMENTOS,
  TABS_ALIMENTOS,
  TOTAL_PASOS_ALIMENTOS,
  TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS,
} from '../config/inspeccionAlimentos';
import './formulario.css';

function FormularioSeccionC({ datos, onAnterior, onSiguiente, puedeRetroceder, respuestas = {}, onRespuestasChange, seccionesCache = {}, onSeccionCargada }) {
  const codigos = useMemo(
    () => ['C1', 'C2'].filter((codigo) => datos.secciones?.some((seccion) => seccion.codigo === codigo)),
    [datos.secciones],
  );
  // C1 y C2 se guardan por separado para poder mostrar el título dorado de
  // cada subsección, pero se validan y puntúan como una sola Sección C.
  const [gruposC1, setGruposC1] = useState([]);
  const [gruposC2, setGruposC2] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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
        const resultados = await Promise.all(codigos.map((codigo) => (
          seccionesCache[codigo]
            ?? obtenerSeccion(datos.idGuia ?? 1, codigo, datos.idTipoEstablecimiento)
        )));
        const datosPorCodigo = Object.fromEntries(resultados.map((seccion) => [seccion.codigo, seccion]));
        const datosC1 = datosPorCodigo.C1;
        const datosC2 = datosPorCodigo.C2;
        setGruposC1(datosC1 ? agruparPorArticulo(datosC1.items) : []);
        setGruposC2(datosC2 ? agruparPorArticulo(datosC2.items) : []);
        resultados.forEach((seccion) => onSeccionCargada?.(seccion.codigo, seccion));
      } catch (err) {
        console.error('Error al cargar la Sección C:', err);
        setError('No se pudo cargar la Sección C. Verificá que el backend esté corriendo.');
      } finally {
        setCargando(false);
      }
    }

    cargarSeccion();
  }, [codigos, datos.idGuia, datos.idTipoEstablecimiento, onSeccionCargada, seccionesCache]);

  // Todos los grupos combinados (C1 + C2), usado para puntaje y validación.
  const todosLosGrupos = useMemo(() => [...gruposC1, ...gruposC2], [gruposC1, gruposC2]);
  const { alternarRespuesta, actualizarPuntos, resumen } = useRespuestasInspeccion(todosLosGrupos, respuestas, onRespuestasChange);
  const { obtenidos, maximo, criticosIncumplidos } = resumen;
  const totalItems = todosLosGrupos.reduce((total, grupo) => total + grupo.items.length, 0);
  const itemsSinResponder = obtenerPendientes(todosLosGrupos, respuestas).length;

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
    onSiguiente?.();
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
                  {OPCIONES_ESTANDAR.map((op) => (
                    <button
                      key={op.valor}
                      type="button"
                      className={`opcion opcion--${op.valor === 'Cumple' ? 'cumple' : op.valor === 'No cumple' ? 'no-cumple' : 'na'} ${respuesta?.estado === op.valor ? 'opcion--activa' : ''}`}
                      onClick={() => alternarRespuesta(item.id, op.valor, item.valor)}
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
                        onClick={() => actualizarPuntos(item.id, n)}
                      >
                        {n} pt{n !== 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {incumplido && (
                <p className="item__advertencia">{TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS}</p>
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
          <div className="cabecera__logo">{MARCA_ALIMENTOS.logo}</div>
          <div>
            <h1>{MARCA_ALIMENTOS.tituloGuia}</h1>
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
        {TABS_ALIMENTOS.map((tab, i) => (
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
        <button type="button" className="boton boton--secundario" onClick={onAnterior} disabled={!puedeRetroceder}>← Anterior</button>
        <span>Paso 3 de {TOTAL_PASOS_ALIMENTOS}</span>
        <button type="button" className="boton boton--primario" onClick={manejarSiguiente}>
          Siguiente →
        </button>
      </footer>
    </div>
  );
}

export default FormularioSeccionC;
