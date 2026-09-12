import { useState, useEffect, useMemo } from 'react';
import { obtenerSeccion } from '../services/guiasInspeccionService';
import { agruparPorArticulo } from '../domain/agrupacionItems';
import { calcularResumen } from '../domain/calculoPuntaje';
import { obtenerPendientes } from '../domain/validacionSeccion';
import { OPCIONES_ESTANDAR } from '../domain/opcionesRespuesta';
import { useRespuestasInspeccion } from '../hooks/useRespuestasInspeccion';
import { esVistaCompleta } from '../domain/progresoVistas';
import {
  MARCA_ALIMENTOS,
  TOTAL_PASOS_ALIMENTOS,
  TEXTO_ADVERTENCIA_CRITICO_ALIMENTOS,
} from '../config/inspeccionAlimentos';
import './formulario.css';
import { nombresVistas } from '../config/inspeccion';

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

function FormularioSeccionB({ datos, onAnterior, onSiguiente, puedeRetroceder, respuestas = {}, onRespuestasChange, seccionesCache = {}, onSeccionCargada, onIrAVista, maxAlcanzado = 0, indiceActual = 0, vistas = [] }) {
  const subsecciones = useMemo(
    () => SUBSECCIONES.filter((sub) => datos.secciones?.some((seccion) => seccion.codigo === sub.codigo)),
    [datos.secciones],
  );
  const [subSeccionActiva, setSubSeccionActiva] = useState(subsecciones[0]?.codigo ?? SUBSECCIONES[0].codigo);
  const [gruposPorSubseccion, setGruposPorSubseccion] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Al cambiar de subsección llevar la vista al inicio de la página.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [subSeccionActiva]);

  useEffect(() => {
    async function cargarSeccionB() {
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
        console.error('Error al cargar la Sección B:', err);
        setError('No se pudo cargar la Sección B. Verificá que el backend esté corriendo.');
      } finally {
        setCargando(false);
      }
    }

    cargarSeccionB();
  }, [datos.idGuia, datos.idTipoEstablecimiento, onSeccionCargada, seccionesCache, subsecciones]);

  // Los grupos de la subsección activa se usan para renderizar y validar;
  // el puntaje y la validación reutilizan el mismo dominio que las demás secciones.
  const grupos = useMemo(
    () => gruposPorSubseccion[subSeccionActiva] ?? [],
    [gruposPorSubseccion, subSeccionActiva],
  );
  const { alternarRespuesta, actualizarPuntos, resumen } = useRespuestasInspeccion(grupos, respuestas, onRespuestasChange);
  const { obtenidos, maximo, criticosIncumplidos } = resumen;

  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  // Misma validación que usa FormularioSeccionGenerico: cuenta y detalle de
  // pendientes de la subsección activa, vía el dominio compartido.
  const itemsPendientesDetalle = useMemo(() => obtenerPendientes(grupos, respuestas), [grupos, respuestas]);
  const itemsSinResponder = itemsPendientesDetalle.length;
  const totalItemsEnSubseccion = grupos.reduce((total, grupo) => total + grupo.items.length, 0);

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

  const subSeccionInfo = subsecciones.find((sub) => sub.codigo === subSeccionActiva) ?? SUBSECCIONES[0];

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
        {vistas.map((vista, i) => {
          const bloqueada = i > maxAlcanzado;
          const completa = esVistaCompleta(vista, seccionesCache, respuestas);

          return (
            <button
              key={vista.codigo}
              type="button"
              disabled={bloqueada}
              onClick={() => onIrAVista?.(i)}
              className={`tabs__item ${i === indiceActual ? 'tabs__item--activo' : ''} ${bloqueada ? 'tabs__item--bloqueado' : ''} ${completa ? 'tabs__item--completo' : ''}`}
            >
              {nombresVistas[vista.codigo] ?? vista.codigo} {completa ? '✓' : ''}
            </button>
          );
        })}
      </nav>

      <nav className="subtabs">
        {subsecciones.map((sub) => {
          const subGrupos = gruposPorSubseccion[sub.codigo] ?? [];
          let total = 0;
          let contestados = 0;
          subGrupos.forEach((grupo) => {
            grupo.items.forEach((item) => {
              total++;
              if (respuestas[item.id]) {
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

        {/* --- Mensaje de validación, igual al de FormularioSeccionGenerico/C --- */}
        {mostrarAlerta && itemsSinResponder > 0 && (
          <div className="alerta-validacion-error">
            <span className="alerta-validacion-error__titulo">Validación de Formulario</span>
            <span>No se puede avanzar. Faltan responder {itemsSinResponder} de los {totalItemsEnSubseccion} ítems. Complete los campos marcados en rojo.</span>
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
        <span>Paso 2 de {TOTAL_PASOS_ALIMENTOS} (Subsección {subSeccionActiva})</span>
        <button 
          type="button" 
          className="boton boton--primario"
          onClick={manejarSiguiente}
        >
          {subSeccionActiva === subsecciones[subsecciones.length - 1]?.codigo ? 'Finalizar Sección B ✓' : 'Siguiente →'}
        </button>
      </footer>
    </div>
  );
}

export default FormularioSeccionB;