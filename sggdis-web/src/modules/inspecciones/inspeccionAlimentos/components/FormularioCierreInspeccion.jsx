import { useState } from 'react';
import { MARCA_ALIMENTOS } from '../config/inspeccionAlimentos';
import { TEXTO_ORDEN_SANITARIA } from '../../config/inspeccion';
import { useCierreInspeccion } from '../../hooks/useCierreInspeccion';
import { cerrarInspeccion } from '../../services/inspeccionesService';
import AlertaError from '../../components/AlertaError';
import mapaDorado from '../../../../assets/mapa-dorado.png';
import { limpiarSoloLetras, limpiarSoloNumeros } from '../../domain/cierreInspeccion';
import './formulario.css';

// Convierte fecha localizada a formato ISO
// para que funcione con inputs type="date"
function convertirFechaAISO(fechaLocalizada) {
  if (!fechaLocalizada) return '';
  try {
    const partes = fechaLocalizada.split('/');
    if (partes.length !== 3) return '';
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const ano = partes[2];
    return `${ano}-${mes}-${dia}`;
  } catch {
    return '';
  }
}

// Último paso del wizard: observaciones, identificación de las partes,
// puntaje con clasificación automática y la opción de orden sanitaria.
// El porcentaje se calcula sobre el máximo real no sobre el máximo fijo del catálogo.
export default function FormularioCierreInspeccion({
  datos,
  vistas = [],
  seccionesCache = {},
  respuestas = {},
  datosCierre: datosCierreControlado,
  onDatosCierreChange,
  onAnterior,
  onFinalizado,
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
    seccionesCompletas,
    vistasIncompletas,
    camposPendientes,
    puedeEnviar,
  } = useCierreInspeccion({
    vistas,
    seccionesCache,
    respuestas,
    puntajeMaximoTipo: datos.puntajeMaximo,
    datosCierre: datosCierreControlado,
    onDatosCierreChange,
  });

  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [cierreConfirmado, setCierreConfirmado] = useState(null);

  // Si falta algo (sección incompleta o campo obligatorio), muestra la
  // alerta en vez de enviar. Si todo está bien, envía el cierre y guarda
  // la confirmación (activa la pantalla de éxito de abajo).
  const manejarFinalizar = async () => {
    if (!puedeEnviar) {
      setMostrarAlerta(true);
      return;
    }
    setMostrarAlerta(false);
    setErrorEnvio(null);
    setEnviando(true);
    try {
      const confirmacion = await cerrarInspeccion(datos.idInspeccion, {
        nombreInspector: datosCierre.nombreInspector.trim(),
        identificacionInspector: datosCierre.identificacionInspector.trim(),
        identificacionRepresentante: datosCierre.identificacionRepresentante.trim(),
        observacionesFinales: datosCierre.observacionesFinales.trim() || null,
        registrarOrdenSanitaria: datosCierre.ordenSanitaria,
      });
      setCierreConfirmado(confirmacion);
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
                {cierreConfirmado.puntajeObtenido} / {cierreConfirmado.puntajeMaximo}
              </strong>
              <span className="cierre__confirmacion-resultado-estado">
                {clasificacion.icono} {cierreConfirmado.porcentaje}% · {cierreConfirmado.clasificacion}
              </span>
            </div>

            {datosCierre.ordenSanitaria && (
              <p className="cierre__confirmacion-orden">
                ⚠ Se registró la notificación por Orden Sanitaria (Art. 65).
              </p>
            )}

            <button type="button" className="boton boton--primario boton--ancho" onClick={onFinalizado}>
              Registrar nueva inspección
            </button>
          </section>
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
            <h1>{MARCA_ALIMENTOS.tituloGuia}</h1>
            <p>{datos.nombre} · Consecutivo: {datos.consecutivo}</p>
          </div>
        </div>
        <div className="cabecera__estado">
          <span className="chip chip--info">{datos.tipoLabel}</span>
        </div>
      </header>

      <main className="tarjeta">
        <div className="tarjeta__encabezado">
          <span className="tarjeta__etiqueta">CIERRE DE INSPECCIÓN</span>
          <div className="tarjeta__titulo-fila">
            <h2>Resultado sanitario</h2>
          </div>
        </div>

        <div className="cierre__contenedor-grid">
          {/* Panel izquierdo: Información de la inspección y resultado */}
          <aside className="cierre__panel-izquierdo">
            <div>
              <span className="cierre__panel-etiqueta">RESULTADO DE LA INSPECCIÓN</span>
              
              <h3 className="cierre__panel-titulo">Condición sanitaria</h3>
              
              <p className="cierre__panel-descripcion">
                La inspección está lista para ser finalizada. Revise el resultado y complete los datos requeridos.
              </p>

              <div className="cierre__puntaje-box">
                <span className="cierre__puntaje-label">Resultado obtenido</span>
                <strong className="cierre__puntaje-valor">{porcentaje}%</strong>
                <span className="cierre__puntaje-clasificacion">{clasificacion.etiqueta}</span>
              </div>

              {/* Información del establecimiento*/}
              <div className="cierre__info-establecimiento">
                <div className="cierre__info-item">
                  <span className="cierre__info-label">Establecimiento</span>
                  <span className="cierre__info-valor">{datos.nombre}</span>
                </div>
                <div className="cierre__info-item">
                  <span className="cierre__info-label">Tipo</span>
                  <span className="cierre__info-valor">{datos.tipoLabel}</span>
                </div>
              </div>
            </div>

            <div className="cierre__pie-panel">
              <p className="cierre__pie-texto">
                {resumen.obtenidos} / {puntajeMaximoAjustado} puntos aplicables
              </p>
              {puntosExcluidosPorNoAplica > 0 && (
                <p className="cierre__pie-nota">
                  Se excluyeron {puntosExcluidosPorNoAplica} pts de ítems "No aplica"
                </p>
              )}
            </div>
          </aside>

          {/* Panel derecho: Formulario de datos de cierre */}
          <div className="cierre__panel-derecho">
            <span className="cierre__panel-etiqueta">INFORMACIÓN DE CIERRE</span>
            <h3 className="cierre__panel-titulo">Datos finales</h3>

            {/* Secciones incompletas */}
            {!seccionesCompletas && (
              <div className="alerta-validacion-error" style={{ marginBottom: '24px' }}>
                <span className="alerta-validacion-error__titulo">Hay secciones sin completar</span>
                <span>
                  No se puede cerrar la inspección hasta completar:{' '}
                  {vistasIncompletas.map((vista) => vista.codigo).join(', ')}.
                </span>
              </div>
            )}

            {/* Alerta de campos incompletos */}
            {mostrarAlerta && camposPendientes.length > 0 && (
              <div className="alerta-campos-incompletos">
¿                <div className="alerta-campos-contenido">
                  <h4 className="alerta-campos-titulo">Campos requeridos incompletos</h4>
                  <p className="alerta-campos-texto">
                    Antes de finalizar la inspección, completa los siguientes campos:
                  </p>
                  <ul className="alerta-campos-lista">
                    {camposPendientes.map((campo) => (
                      <li key={campo}>{campo}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Error de envío */}
            {errorEnvio && <AlertaError titulo="No se pudo registrar el cierre" mensaje={errorEnvio} />}

            {/* CAMPOS DEL FORMULARIO EN GRID 2 COLUMNAS */}
            <div className="cierre__campos-grid">
              <div className="campo">
                <label htmlFor="nombre-inspector">Inspector responsable *</label>
                <input
                  id="nombre-inspector"
                  type="text"
                  value={datosCierre.nombreInspector}
                  onChange={(e) => actualizarCampo('nombreInspector', limpiarSoloLetras(e.target.value))}
                />
              </div>
              <div className="campo">
                <label htmlFor="id-inspector">Identificación del inspector *</label>
                <input
                  id="id-inspector"
                  type="text"
                  inputMode="numeric"
                  value={datosCierre.identificacionInspector}
                  onChange={(e) => actualizarCampo('identificacionInspector', limpiarSoloNumeros(e.target.value))}
                />
              </div>
            </div>

            <div className="cierre__campos-grid">
              <div className="campo">
                <label htmlFor="fecha-inspeccion">Fecha *</label>
                <input
                  id="fecha-inspeccion"
                  type="date"
                  value={convertirFechaAISO(datos.fecha) || ''}
                  readOnly
                />
              </div>
              <div className="campo">
                <label htmlFor="hora-cierre">Hora</label>
                <input
                  id="hora-cierre"
                  type="time"
                  value={datos.hora || ''}
                  readOnly
                />
              </div>
            </div>

            <div className="campo">
              <label htmlFor="id-representante">Identificación del representante *</label>
              <input
                id="id-representante"
                type="text"
                inputMode="numeric"
                value={datosCierre.identificacionRepresentante}
                onChange={(e) => actualizarCampo('identificacionRepresentante', limpiarSoloNumeros(e.target.value))}
              />
            </div>

            <div className="campo">
              <label htmlFor="observaciones-finales">Observaciones finales (opcional)</label>
              <textarea
                id="observaciones-finales"
                rows={4}
                placeholder="Anotar observaciones finales de la inspección..."
                value={datosCierre.observacionesFinales}
                onChange={(e) => actualizarCampo('observacionesFinales', e.target.value)}
              />
            </div>

            {/* Checkbox de orden sanitaria */}
            <div className="cierre__orden-sanitaria">
              <label className="cierre__orden-sanitaria-check">
                <input
                  type="checkbox"
                  checked={datosCierre.ordenSanitaria}
                  onChange={(e) => actualizarCampo('ordenSanitaria', e.target.checked)}
                />
                Se requiere emitir Orden Sanitaria
              </label>
              <p className="cierre__orden-sanitaria-texto">{TEXTO_ORDEN_SANITARIA}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="pie">
        <button type="button" className="boton boton--secundario" onClick={onAnterior} disabled={enviando}>
          ← Anterior
        </button>
        <span>Paso {paso}{totalPasos ? ` de ${totalPasos}` : ''}</span>
        <button type="button" className="boton boton--secundario" onClick={manejarFinalizar} disabled={enviando}>
          {enviando ? 'Registrando…' : 'Finalizar inspección ✓'}
        </button>
      </footer>
    </div>
  );
}