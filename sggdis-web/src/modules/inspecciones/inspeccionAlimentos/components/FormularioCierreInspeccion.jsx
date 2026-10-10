import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MARCA_ALIMENTOS } from '../config/inspeccionAlimentos';
import { TEXTO_ORDEN_SANITARIA } from '../../config/inspeccion';
import { useCierreInspeccion } from '../../hooks/useCierreInspeccion';
import { obtenerSeccion } from '../../services/guiasInspeccionService';
import { useSincronizacionCierre } from '../../hooks/useSincronizacionCierre';
import { construirVistaPrevia } from '../../domain/vistaPreviaInspeccion';
import { validarInspeccionCompleta } from '../../domain/validacionEnvioInspeccion';
import AlertaError from '../../components/AlertaError';
import mapaDorado from '../../../../assets/mapa-dorado.png';
import {
  IDENTIFICACION_REGEX,
  LONGITUD_MAXIMA_IDENTIFICACION_REPRESENTANTE,
  LONGITUD_MAXIMA_OBSERVACIONES_FINALES,
  limpiarSoloNumeros,
} from '../../domain/cierreInspeccion';
import VistaPreviaInspeccion from './VistaPreviaInspeccion';
import ErroresValidacionEnvio from './ErroresValidacionEnvio';
import './formulario.css';

// Geometría del anillo de cumplimiento del panel de resultado (viewBox 120x120).
const RadioAnillo = 52;
const CircunferenciaAnillo = 2 * Math.PI * RadioAnillo;

// Tiempo que la burbuja de aviso permanece visible (igual que en las secciones).
const DuracionAvisoMs = 3500;

// Limita un valor porcentual al rango 0–100 para dibujar barras y anillos.
function limitarPorcentaje(valor) {
  const numero = Number(valor) || 0;
  return Math.min(Math.max(numero, 0), 100);
}

// Formatea la fecha localizada (d/m/aaaa) como dd/mm/aaaa para mostrarla
// en el bloque de datos registrados automáticamente.
function formatearFechaVisual(fechaLocalizada) {
  if (!fechaLocalizada) return '—';
  const partes = String(fechaLocalizada).split('/');
  if (partes.length !== 3) return String(fechaLocalizada);
  const dia = partes[0].padStart(2, '0');
  const mes = partes[1].padStart(2, '0');
  const ano = partes[2];
  return `${dia}/${mes}/${ano}`;
}

// Mensaje de error del campo de identificación del representante. Usa la misma
// regla que obtenerCamposCierrePendientes; devuelve '' si el valor es válido.
function obtenerErrorRepresentante(identificacion) {
  const valor = identificacion?.trim() ?? '';
  if (!valor) return 'Ingrese la identificación del representante.';
  if (!IDENTIFICACION_REGEX.test(valor)) return 'Solo se permiten números.';
  if (valor.length > LONGITUD_MAXIMA_IDENTIFICACION_REPRESENTANTE) {
    return `Máximo ${LONGITUD_MAXIMA_IDENTIFICACION_REPRESENTANTE} dígitos.`;
  }
  return '';
}

// Último paso del wizard: observaciones, identificación de las partes,
// puntaje con clasificación automática y la opción de orden sanitaria.
// El porcentaje se calcula sobre el máximo real no sobre el máximo fijo del catálogo.
export default function FormularioCierreInspeccion({
  identidadInspector,
  datos,
  vistas = [],
  seccionesCache = {},
  respuestas = {},
  datosCierre: datosCierreControlado,
  onDatosCierreChange,
  onAnterior,
  mostrarVistaPrevia,
  onMostrarVistaPreviaChange,
  onSeccionCargada,
  onIrASeccion,
  onGuardarDelta,
  onFinalizado,
  onVolverInicio,
  onCrearOrdenSanitaria,
  paso,
  totalPasos,
}) {
  const {
    datosCierre,
    actualizarCampo,
    resumen,
    puntosExcluidosPorNoAplica,
    puntajeMaximoAjustado,
    porcentaje,
    clasificacion,
    camposPendientes,
  } = useCierreInspeccion({
    vistas,
    seccionesCache,
    respuestas,
    puntajeMaximoTipo: datos.puntajeMaximo,
    datosCierre: datosCierreControlado,
    onDatosCierreChange,
  });

  const [mostrarErroresCampos, setMostrarErroresCampos] = useState(false);
  const [mensajeAviso, setMensajeAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [cierreConfirmado, setCierreConfirmado] = useState(null);
  const [erroresValidacion, setErroresValidacion] = useState([]);
  const [validando, setValidando] = useState(false);
  const campoRepresentanteRef = useRef(null);
  const temporizadorAvisoRef = useRef(null);

  // Limpia el temporizador de la burbuja si el componente se desmonta.
  useEffect(() => () => clearTimeout(temporizadorAvisoRef.current), []);

  // Muestra la burbuja flotante de aviso y la oculta después de DuracionAvisoMs.
  const mostrarAviso = (mensaje) => {
    clearTimeout(temporizadorAvisoRef.current);
    setMensajeAviso(mensaje);
    temporizadorAvisoRef.current = setTimeout(() => setMensajeAviso(''), DuracionAvisoMs);
  };

  // Lleva la vista al campo con error y lo enfoca, como en las secciones del formulario.
  const enfocarCampoConError = () => {
    requestAnimationFrame(() => {
      const campo = campoRepresentanteRef.current;
      if (!campo) return;
      campo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => campo.focus(), 450);
    });
  };

  const cerrarConExito = useCallback((confirmacion) => {
    setCierreConfirmado(confirmacion);
    onMostrarVistaPreviaChange(false);
  }, [onMostrarVistaPreviaChange]);

  const sincronizacionCierre = useSincronizacionCierre({
    idInspeccion: datos.idInspeccion,
    onFinalizado: cerrarConExito,
  });

  const documento = useMemo(
    () => construirVistaPrevia(datos, seccionesCache, respuestas, vistas),
    [datos, seccionesCache, respuestas, vistas],
  );

  // Valores visuales del panel de resultado: avance del anillo y de las barras.
  const longitudProgresoAnillo = (limitarPorcentaje(porcentaje) / 100) * CircunferenciaAnillo;
  const porcentajeAplicables = datos.puntajeMaximo
    ? limitarPorcentaje((puntajeMaximoAjustado / datos.puntajeMaximo) * 100)
    : 0;

  // El error del campo solo se muestra después del primer intento de continuar
  // y desaparece en cuanto el valor es válido.
  const errorRepresentante = mostrarErroresCampos
    ? obtenerErrorRepresentante(datosCierre.identificacionRepresentante)
    : '';

  const abrirVistaPrevia = async () => {
    setMostrarErroresCampos(true);
    if (camposPendientes.length > 0) {
      mostrarAviso('Complete los campos marcados en rojo antes de continuar.');
      enfocarCampoConError();
    }

    setValidando(true);
    setErroresValidacion([]);
    setErrorEnvio(null);

    const cacheValidacion = { ...seccionesCache };
    const codigosIncluidos = new Set(vistas.flatMap((vista) => vista.secciones.map((seccion) => seccion.codigo)));
    const vistasValidacion = [...vistas];
    [...(datos.secciones ?? []), ...Object.values(seccionesCache)].forEach((seccion) => {
      if (!codigosIncluidos.has(seccion.codigo)) {
        vistasValidacion.push({ codigo: seccion.codigo, secciones: [seccion] });
        codigosIncluidos.add(seccion.codigo);
      }
    });

    try {
      for (const vista of vistasValidacion) {
        for (const seccionRaw of vista.secciones) {
          if (cacheValidacion[seccionRaw.codigo]) continue;
          try {
            const seccion = await obtenerSeccion(
              datos.idGuia ?? 1,
              seccionRaw.codigo,
              datos.idTipoEstablecimiento,
            );
            cacheValidacion[seccionRaw.codigo] = seccion;
            onSeccionCargada?.(seccionRaw.codigo, seccion);
          } catch {
            // La validación comunica qué sección no pudo cargarse.
          }
        }
      }

      const errores = validarInspeccionCompleta(vistasValidacion, cacheValidacion, respuestas);
      setErroresValidacion(errores);
      if (errores.length > 0 && camposPendientes.length === 0) {
        mostrarAviso('Hay secciones con ítems pendientes. Revíselas antes de continuar.');
      }
      if (errores.length === 0 && camposPendientes.length === 0) {
        onMostrarVistaPreviaChange(true);
      }
    } finally {
      setValidando(false);
    }
  };

  // Envío real del cierre, se dispara solo desde la vista previa.
  const manejarFinalizar = async () => {
    setErrorEnvio(null);
    setEnviando(true);
    try {
      await sincronizacionCierre.finalizar({
        datosCierre: {
          identificacionRepresentante: datosCierre.identificacionRepresentante.trim(),
          observacionesFinales: datosCierre.observacionesFinales.trim() || null,
          registrarOrdenSanitaria: datosCierre.ordenSanitaria,
        },
        respuestas,
        guardarDelta: onGuardarDelta,
      });
    } catch (error) {
      setErrorEnvio(error.message);
    } finally {
      setEnviando(false);
    }
  };

  // Pantalla de éxito, se muestra en vez del formulario una vez que el cierre se envió bien.
  if (cierreConfirmado) {
    return (
      <div className="pagina">
        <div className="cierre__confirmacion-fondo">
          <section className={`cierre__confirmacion cierre__confirmacion--${clasificacion.clase}`}>
            <span className="cierre__confirmacion-check" aria-hidden="true">✓</span>
            <span className="cierre__confirmacion-etiqueta">INSPECCIÓN FINALIZADA</span>
            <h2>Inspección cerrada correctamente</h2>
            <p className="cierre__confirmacion-descripcion">
              La inspección fue registrada y finalizada correctamente.
            </p>

            <div className="cierre__confirmacion-resultado">
              <span className="cierre__confirmacion-resultado-label">PUNTAJE FINAL</span>
              <strong className="cierre__confirmacion-resultado-numero">
                {cierreConfirmado.puntajeObtenido} / {cierreConfirmado.puntajeMaximoReferencia}
              </strong>
              <span className="cierre__confirmacion-resultado-estado">
                {clasificacion.icono} {cierreConfirmado.porcentaje}% · {cierreConfirmado.clasificacion}
              </span>
              {/* El porcentaje/clasificación de arriba ya excluye los ítems "No
                  aplica" del máximo (no penalizan). Acá se muestra el puntaje
                  sobre el total nominal de la guía, y aparte se aclara cuántos
                  puntos no se tomaron en cuenta por no aplicar, para que no
                  parezca que el establecimiento "perdió" esos puntos. */}
              {cierreConfirmado.puntajeMaximoReferencia > cierreConfirmado.puntajeMaximo && (
                <p className="cierre__confirmacion-nota">
                  {cierreConfirmado.puntajeMaximoReferencia - cierreConfirmado.puntajeMaximo} pts no
                  aplicaron ("N/A") y no se tomaron en cuenta para la nota final.
                </p>
              )}
            </div>

            {datosCierre.ordenSanitaria && (
              <>
                <p className="cierre__confirmacion-orden">
                  Se indicó que se requiere emitir una Orden Sanitaria (Art. 65).
                </p>
                <button
                  type="button"
                  className="boton boton--secundario boton--ancho"
                  onClick={onCrearOrdenSanitaria}
                >
                  Continuar con la Orden Sanitaria
                </button>
              </>
            )}

            <button type="button" className="boton boton--primario boton--ancho" onClick={onFinalizado}>
              Registrar nueva inspección
            </button>
          </section>
        </div>
      </div>
    );
  }

  if (mostrarVistaPrevia) {
    return (
      <VistaPreviaInspeccion
        documento={documento}
        datosCierre={datosCierre}
        identidadInspector={identidadInspector}
        onRegresarEditar={() => {
          onMostrarVistaPreviaChange(false);
          onAnterior();
        }}
        onConfirmar={manejarFinalizar}
        onVolverMenu={onVolverInicio}
        confirmando={enviando}
        pendienteSincronizacion={sincronizacionCierre.pendienteSincronizacion}
        error={errorEnvio || sincronizacionCierre.errorSincronizacion}
      />
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
            <h1>{MARCA_ALIMENTOS.tituloGuia}</h1>
            <p>{datos.nombre} · Consecutivo: {datos.consecutivo}</p>
          </div>
        </div>
        <div className="cabecera__estado">
          <span className="chip chip--info">{datos.tipoLabel}</span>
        </div>
      </header>

      {/* Burbuja flotante de aviso (mismo patrón que las secciones del formulario) */}
      {mensajeAviso && (
        <div className="aviso-navegacion" role="alert">
          <span className="aviso-navegacion__icono">!</span>
          <span>{mensajeAviso}</span>
        </div>
      )}

      <main className="tarjeta">
        <div className="tarjeta__encabezado">
          <span className="tarjeta__etiqueta">CIERRE DE INSPECCIÓN</span>
          <div className="tarjeta__titulo-fila">
            <h2>Resultado sanitario</h2>
          </div>
        </div>

        <div className="cierre__contenedor-grid">
          {/* Panel izquierdo: resultado de la inspección */}
          <aside className="cierre__panel-izquierdo">
            <div className="cierre__panel-encabezado">
              <span className="cierre__panel-etiqueta">RESULTADO DE LA INSPECCIÓN</span>
              <h3 className="cierre__panel-titulo">Condición sanitaria</h3>
            </div>

            {/* Tarjeta blanca con el anillo de cumplimiento y la clasificación */}
            <div className={`cierre__resultado cierre__resultado--${clasificacion.clase}`}>
              <div className="cierre__anillo">
                <svg className="cierre__anillo-svg" viewBox="0 0 120 120" aria-hidden="true">
                  <circle className="cierre__anillo-fondo" cx="60" cy="60" r={RadioAnillo} />
                  <circle
                    className="cierre__anillo-progreso"
                    cx="60"
                    cy="60"
                    r={RadioAnillo}
                    strokeDasharray={`${longitudProgresoAnillo} ${CircunferenciaAnillo}`}
                  />
                </svg>
                <div className="cierre__anillo-texto">
                  <strong className="cierre__anillo-valor">{porcentaje}%</strong>
                  <span className="cierre__anillo-label">cumplimiento</span>
                </div>
              </div>

              <span className="cierre__resultado-label">CLASIFICACIÓN</span>
              <span className="cierre__clasificacion">
                <span aria-hidden="true">{clasificacion.icono}</span>
                {clasificacion.etiqueta}
              </span>
            </div>

            {/* Puntos obtenidos y aplicables */}
            <div className="cierre__puntos-grid">
              <div className="cierre__puntos-caja">
                <span className="cierre__puntos-label">OBTENIDOS</span>
                <strong className="cierre__puntos-valor cierre__puntos-valor--destacado">
                  {resumen.obtenidos} <span className="cierre__puntos-total">/ {puntajeMaximoAjustado}</span>
                </strong>
                <div className="cierre__barra">
                  <div
                    className="cierre__barra-relleno cierre__barra-relleno--dorado"
                    style={{ width: `${limitarPorcentaje(porcentaje)}%` }}
                  />
                </div>
              </div>

              <div className="cierre__puntos-caja">
                <span className="cierre__puntos-label">APLICABLES</span>
                <strong className="cierre__puntos-valor">
                  {puntajeMaximoAjustado} <span className="cierre__puntos-total">/ {datos.puntajeMaximo}</span>
                </strong>
                <div className="cierre__barra">
                  <div
                    className="cierre__barra-relleno cierre__barra-relleno--blanco"
                    style={{ width: `${porcentajeAplicables}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Información del establecimiento */}
            <div className="cierre__info-establecimiento">
              <div className="cierre__info-item">
                <span className="cierre__info-icono" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18" />
                    <path d="M5 21V9l7-5 7 5v12" />
                    <path d="M10 21v-6h4v6" />
                  </svg>
                </span>
                <div>
                  <span className="cierre__info-label">Establecimiento</span>
                  <span className="cierre__info-valor">{datos.nombre}</span>
                </div>
              </div>
              <div className="cierre__info-item">
                <span className="cierre__info-icono" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                </span>
                <div>
                  <span className="cierre__info-label">Tipo</span>
                  <span className="cierre__info-valor">{datos.tipoLabel}</span>
                </div>
              </div>
            </div>

            {/* Aviso de puntos excluidos por "No aplica" */}
            {puntosExcluidosPorNoAplica > 0 && (
              <p className="cierre__pie-nota">
                <svg className="cierre__pie-nota-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
                <span>
                  Se excluyeron <strong>{puntosExcluidosPorNoAplica} {puntosExcluidosPorNoAplica === 1 ? 'pt' : 'pts'}</strong> de ítems «No aplica». No penalizan el resultado.
                </span>
              </p>
            )}
          </aside>

          {/* Panel derecho: Formulario de datos de cierre */}
          <div className="cierre__panel-derecho">
            <span className="cierre__panel-etiqueta">INFORMACIÓN DE CIERRE</span>
            <h3 className="cierre__panel-titulo">Datos finales</h3>

            <ErroresValidacionEnvio errores={erroresValidacion} onIrASeccion={onIrASeccion} />

            {/* Error de envío */}
            {errorEnvio && <AlertaError titulo="No se pudo registrar el cierre" mensaje={errorEnvio} />}

            {/* Datos de solo lectura que el sistema registra automáticamente */}
            <section className="cierre__datos-auto" aria-labelledby="titulo-datos-auto">
              <h4 id="titulo-datos-auto" className="cierre__datos-auto-titulo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                REGISTRADO AUTOMÁTICAMENTE
              </h4>

              <dl className="cierre__datos-auto-grid">
                <div className="cierre__dato">
                  <dt className="cierre__dato-label">Inspector responsable</dt>
                  <dd className="cierre__dato-valor">{identidadInspector?.nombreCompleto || '—'}</dd>
                </div>

                <div className="cierre__dato">
                  <dt className="cierre__dato-label">Identificación del inspector</dt>
                  <dd className="cierre__dato-valor">{identidadInspector?.identificacion || '—'}</dd>
                </div>

                <div className="cierre__dato">
                  <dt className="cierre__dato-label">Fecha</dt>
                  <dd className="cierre__dato-valor">
                    <svg className="cierre__dato-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="16" rx="2" />
                      <path d="M3 10h18M8 3v4M16 3v4" />
                    </svg>
                    {formatearFechaVisual(datos.fecha)}
                  </dd>
                </div>

                <div className="cierre__dato">
                  <dt className="cierre__dato-label">Hora de cierre</dt>
                  <dd className="cierre__dato-valor">
                    <svg className="cierre__dato-icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                    {datos.hora || '—'}
                  </dd>
                </div>
              </dl>
            </section>

            <div className={`campo${errorRepresentante ? ' campo--error' : ''}`}>
              <label htmlFor="id-representante">Identificación del representante *</label>
              <input
                ref={campoRepresentanteRef}
                id="id-representante"
                type="text"
                inputMode="numeric"
                placeholder="Ej. 102340567"
                maxLength={LONGITUD_MAXIMA_IDENTIFICACION_REPRESENTANTE}
                aria-invalid={Boolean(errorRepresentante)}
                aria-describedby={errorRepresentante ? 'error-representante' : undefined}
                value={datosCierre.identificacionRepresentante}
                onChange={(e) => actualizarCampo('identificacionRepresentante', limpiarSoloNumeros(e.target.value))}
              />
              {errorRepresentante && (
                <span id="error-representante" className="campo__error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v5M12 16h.01" />
                  </svg>
                  {errorRepresentante}
                </span>
              )}
            </div>

            <div className="campo">
              <label htmlFor="observaciones-finales">Observaciones finales (opcional)</label>
              <textarea
                id="observaciones-finales"
                rows={4}
                maxLength={LONGITUD_MAXIMA_OBSERVACIONES_FINALES}
                placeholder="Anotar observaciones finales de la inspección..."
                value={datosCierre.observacionesFinales}
                onChange={(e) => actualizarCampo('observacionesFinales', e.target.value)}
              />
            </div>

            {/* Orden sanitaria (Art. 65): tarjeta completa con interruptor accesible */}
            <label
              htmlFor="orden-sanitaria"
              className={`cierre__orden-sanitaria${datosCierre.ordenSanitaria ? ' cierre__orden-sanitaria--activa' : ''}`}
            >
              <span className="cierre__orden-sanitaria-icono" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  <path d="M14 3v5h5" />
                  <path d="M12 11v4M12 18h.01" />
                </svg>
              </span>

              <span className="cierre__orden-sanitaria-contenido">
                <span className="cierre__orden-sanitaria-titulo">Se requiere emitir Orden Sanitaria</span>
                <span className="cierre__orden-sanitaria-texto">{TEXTO_ORDEN_SANITARIA}</span>
                {datosCierre.ordenSanitaria && (
                  <span className="cierre__orden-sanitaria-aviso">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    Al finalizar podrá continuar con el registro de la orden
                  </span>
                )}
              </span>

              <input
                id="orden-sanitaria"
                className="cierre__orden-sanitaria-input"
                type="checkbox"
                role="switch"
                checked={datosCierre.ordenSanitaria}
                onChange={(e) => actualizarCampo('ordenSanitaria', e.target.checked)}
              />
              <span className="cierre__orden-sanitaria-switch" aria-hidden="true">
                <span className="cierre__orden-sanitaria-perilla" />
              </span>
            </label>
          </div>
        </div>
      </main>

      <footer className="pie">
        <button type="button" className="boton boton--secundario" onClick={onAnterior} disabled={enviando}>
          ← Anterior
        </button>
        <span>Paso {paso}{totalPasos ? ` de ${totalPasos}` : ''}</span>
        <button type="button" className="boton boton--secundario" onClick={abrirVistaPrevia} disabled={enviando || validando}>
          {validando ? 'Validando secciones…' : 'Vista previa →'}
        </button>
      </footer>
    </div>
  );
}