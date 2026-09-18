import { useState } from 'react';
import { MARCA_ALIMENTOS } from '../config/inspeccionAlimentos';
import { TEXTO_ORDEN_SANITARIA } from '../config/inspeccion';
import { useCierreInspeccion } from '../hooks/useCierreInspeccion';
import { cerrarInspeccion } from '../services/inspeccionesService';
import mapaDorado from '../assets/mapa-dorado.png';
import { limpiarSoloLetras, limpiarSoloNumeros } from '../domain/cierreInspeccion';
import './formulario.css';

// Último paso del wizard de inspección: observaciones finales,
// identificación de las partes, puntaje total con clasificación automática
// y la opción de registrar una orden sanitaria, independiente del puntaje.
// El porcentaje de cumplimiento se calcula sobre el máximo REALMENTE
// aplicable (excluye los puntos de ítems marcados N/A, corrige H5), no
// sobre el máximo fijo de catálogo.
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

  // Al presionar "Finalizar inspección": si falta algo (sección incompleta o
  // campo obligatorio), muestra la alerta correspondiente en vez de enviar.
  // Si todo está en orden, envía el cierre al backend y, si sale bien, guarda
  // la confirmación (lo que activa la pantalla de éxito abajo).
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

  // Pantalla de éxito: se muestra en vez del formulario una vez que el cierre ya se envió correctamente.
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
            <h2>Dictamen y cierre</h2>
          </div>
        </div>

        <section className={`cierre__resumen cierre__resumen--${clasificacion.clase}`}>
          <div className="cierre__resumen-puntaje">
            <span className="cierre__resumen-numero">{resumen.obtenidos}</span>
            <span className="cierre__resumen-total">/ {puntajeMaximoAjustado} pts</span>
          </div>
          <div className="cierre__resumen-clasificacion">
            <span className="cierre__resumen-icono" aria-hidden="true">{clasificacion.icono}</span>
            <div>
              <p className="cierre__resumen-porcentaje">{porcentaje}% de cumplimiento</p>
              <p className="cierre__resumen-etiqueta">{clasificacion.etiqueta}</p>
            </div>
          </div>
          {puntosExcluidosPorNoAplica > 0 && (
            <p className="cierre__resumen-nota">
              Máximo de referencia: {datos.puntajeMaximo} pts. Se excluyeron {puntosExcluidosPorNoAplica} pts
              de ítems marcados "No aplica" → máximo aplicable: {puntajeMaximoAjustado} pts.
            </p>
          )}
        </section>

        {!seccionesCompletas && (
          <div className="alerta-validacion-error">
            <span className="alerta-validacion-error__titulo">Hay secciones sin completar</span>
            <span>
              No se puede cerrar la inspección hasta completar:{' '}
              {vistasIncompletas.map((vista) => vista.codigo).join(', ')}.
            </span>
          </div>
        )}

        <div className="cierre__orden-sanitaria">
          <label className="cierre__orden-sanitaria-check">
            <input
              type="checkbox"
              checked={datosCierre.ordenSanitaria}
              onChange={(e) => actualizarCampo('ordenSanitaria', e.target.checked)}
            />
            Registrar notificación por Orden Sanitaria
          </label>
          <p className="cierre__orden-sanitaria-texto">{TEXTO_ORDEN_SANITARIA}</p>
        </div>

        {mostrarAlerta && camposPendientes.length > 0 && (
          <div className="alerta-validacion-error">
            <span className="alerta-validacion-error__titulo">Validación de Formulario</span>
            <span>Complete los siguientes campos obligatorios:</span>
            <ul className="alerta-validacion-error__lista">
              {camposPendientes.map((campo) => <li key={campo}>{campo}</li>)}
            </ul>
          </div>
        )}

        {errorEnvio && (
          <div className="alerta-validacion-error">
            <span className="alerta-validacion-error__titulo">No se pudo registrar el cierre</span>
            <span>{errorEnvio}</span>
          </div>
        )}

        <div className="campo-fila">
          <div className="campo">
            <label htmlFor="nombre-inspector">Nombre del inspector *</label>
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

        <div className="campo-fila">
          <div className="campo">
            <label htmlFor="nombre-representante">Nombre del establecimiento</label>
            <input id="nombre-representante" type="text" value={datos.nombre} readOnly />
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