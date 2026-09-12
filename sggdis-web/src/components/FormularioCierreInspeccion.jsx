import { useState } from 'react';
import { MARCA_ALIMENTOS } from '../config/inspeccionAlimentos';
import { TEXTO_ORDEN_SANITARIA } from '../config/inspeccion';
import { useCierreInspeccion } from '../hooks/useCierreInspeccion';
import { cerrarInspeccion } from '../services/inspeccionesService';
import './formulario.css';

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

  const manejarFinalizar = async () => {
    if (!puedeEnviar) {
      setMostrarAlerta(true);
      return;
    }
    setMostrarAlerta(false);
    setErrorEnvio(null);
    setEnviando(true);
    try {
      const confirmacion = await cerrarInspeccion(datos.idInspeccion);
      setCierreConfirmado(confirmacion);
    } catch (error) {
      setErrorEnvio(error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (cierreConfirmado) {
    return (
      <div className="pagina">
        <div className="tarjeta-estado">
          <div className="estado-mensaje">
            <span className="estado-mensaje__icono">✓</span>
            <div>
              <p><strong>Inspección cerrada correctamente.</strong></p>
              <p>
                Puntaje final: {cierreConfirmado.puntajeObtenido} / {cierreConfirmado.puntajeMaximo} pts
                {' '}({cierreConfirmado.porcentaje}% — {cierreConfirmado.clasificacion})
              </p>
              {datosCierre.ordenSanitaria && (
                <p>Se registró la notificación por Orden Sanitaria (Art. 65).</p>
              )}
            </div>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            <button type="button" className="boton boton--primario" onClick={onFinalizado}>
              Registrar nueva inspección
            </button>
          </div>
        </div>
      </div>
    );
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
            <span className="cierre__resumen-total">/ {datos.puntajeMaximo ?? '—'} pts</span>
          </div>
          <div className="cierre__resumen-clasificacion">
            <span className="cierre__resumen-icono" aria-hidden="true">{clasificacion.icono}</span>
            <div>
              <p className="cierre__resumen-porcentaje">{porcentaje}% de cumplimiento</p>
              <p className="cierre__resumen-etiqueta">{clasificacion.etiqueta}</p>
            </div>
          </div>
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
              onChange={(e) => actualizarCampo('nombreInspector', e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="id-inspector">Identificación del inspector *</label>
            <input
              id="id-inspector"
              type="text"
              value={datosCierre.identificacionInspector}
              onChange={(e) => actualizarCampo('identificacionInspector', e.target.value)}
            />
          </div>
        </div>

        <div className="campo-fila">
          <div className="campo">
            <label htmlFor="nombre-representante">Nombre del representante del establecimiento *</label>
            <input
              id="nombre-representante"
              type="text"
              value={datosCierre.nombreRepresentante}
              onChange={(e) => actualizarCampo('nombreRepresentante', e.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="id-representante">Identificación del representante *</label>
            <input
              id="id-representante"
              type="text"
              value={datosCierre.identificacionRepresentante}
              onChange={(e) => actualizarCampo('identificacionRepresentante', e.target.value)}
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
        <button type="button" className="boton boton--primario" onClick={manejarFinalizar} disabled={enviando}>
          {enviando ? 'Registrando…' : 'Finalizar inspección ✓'}
        </button>
      </footer>
    </div>
  );
}