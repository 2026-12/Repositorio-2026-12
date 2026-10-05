import { useMemo, useState } from 'react';
import VistaPreviaSeccion from './VistaPreviaSeccion';
import ResumenGeneralInspeccion from './ResumenGeneralInspeccion';
import PendienteSincronizacion from './PendienteSincronizacion';
import './vistaPreviaInspeccion.css';

export default function VistaPreviaInspeccion({
  documento,
  datosCierre,
  identidadInspector,
  onRegresarEditar,
  onConfirmar,
  onVolverMenu,
  confirmando,
  pendienteSincronizacion,
  error,
}) {
  const [indiceSeccion, setIndiceSeccion] = useState(0);
  const codigos = useMemo(
    () => documento.secciones.map((seccion) => seccion.secciones[0]?.codigo ?? seccion.codigo),
    [documento.secciones],
  );

  const navegarA = (indice) => {
    const siguiente = Math.max(0, Math.min(indice, codigos.length - 1));
    setIndiceSeccion(siguiente);
    document.getElementById(`vista-previa-seccion-${codigos[siguiente]}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="pagina vista-previa">
      <div className="vista-previa__barra-superior">
        <button type="button" className="boton-volver-menu-inspeccion" onClick={onVolverMenu} disabled={confirmando || pendienteSincronizacion}>
          ← Volver al menú
        </button>
      </div>
      <header className="vista-previa__cabecera">
        <div>
          <span>{documento.tipoEstablecimiento || 'Tipo no especificado'}</span>
          <strong>{documento.establecimiento}</strong>
        </div>
        <div><span>Estado</span><strong>{documento.estado}</strong></div>
        <div><span>Fecha de inspección</span><strong>{documento.fecha || '—'}</strong></div>
        <div><span>Inspector</span><strong>{identidadInspector?.nombreCompleto || '—'}</strong></div>
        <div><span>ID / Consecutivo</span><strong>{documento.idInspeccion} / {documento.consecutivo || '—'}</strong></div>
      </header>

      <div className="vista-previa__banner">
        <strong>VISTA PREVIA DEL DOCUMENTO FINAL</strong>
        <span>Este documento es solo lectura. Para modificar la inspección, regresa al modo de edición.</span>
      </div>

      <div className="vista-previa__layout">
        <aside className="vista-previa__sidebar">
          <h2>Secciones</h2>
          <nav aria-label="Secciones de la inspección">
            {documento.secciones.map((seccion, indice) => (
              <button
                type="button"
                key={seccion.codigo}
                className={indiceSeccion === indice ? 'vista-previa__nav-activa' : ''}
                onClick={() => navegarA(indice)}
              >
                {seccion.codigo} · {seccion.nombre}
              </button>
            ))}
          </nav>
          <h3>Resumen por sección</h3>
          {documento.secciones.map((seccion) => {
            const porcentaje = seccion.resumen.maximo > 0
              ? (seccion.resumen.obtenidos / seccion.resumen.maximo) * 100
              : 0;
            const nivel = porcentaje >= 85 ? 'alto' : porcentaje >= 60 ? 'medio' : 'bajo';
            return (
              <div className="vista-previa__progreso" key={seccion.codigo}>
                <div><span>{seccion.codigo}</span><strong>{seccion.resumen.obtenidos}/{seccion.resumen.maximo}</strong></div>
                <div className="vista-previa__barra"><span className={`vista-previa__barra--${nivel}`} style={{ width: `${porcentaje}%` }} /></div>
              </div>
            );
          })}
        </aside>

        <main className="vista-previa__documento">
          <div className="vista-previa__titulo">
            <div><span>DOCUMENTO DE INSPECCIÓN</span><h1>Vista Previa — Documento Final</h1></div>
            <span className="vista-previa__solo-lectura">Solo lectura</span>
          </div>
          {error && <div className="vista-previa__errores" role="alert">{error}</div>}
          {documento.secciones.map((vista) => (
            <div key={vista.codigo} className="vista-previa__grupo">
              <h2 className="vista-previa__grupo-titulo">{vista.codigo} · {vista.nombre}</h2>
              {vista.secciones.map((seccion) => (
                <VistaPreviaSeccion
                  key={seccion.codigo}
                  seccion={seccion}
                  textoAdvertenciaCritico={documento.textoAdvertenciaCritico}
                />
              ))}
            </div>
          ))}
          <ResumenGeneralInspeccion
            documento={documento}
            datosCierre={datosCierre}
            identidadInspector={identidadInspector}
          />
        </main>
      </div>

      {pendienteSincronizacion && <PendienteSincronizacion />}

      <footer className="vista-previa__pie">
        <button type="button" className="boton boton--secundario" onClick={() => navegarA(indiceSeccion - 1)} disabled={indiceSeccion === 0}>
          Anterior
        </button>
        <span>Sección {Math.min(indiceSeccion + 1, codigos.length)} de {codigos.length}</span>
        <button type="button" className="boton boton--secundario" onClick={() => navegarA(indiceSeccion + 1)} disabled={indiceSeccion >= codigos.length - 1}>
          Siguiente
        </button>
        <button type="button" className="boton boton--secundario" onClick={onRegresarEditar} disabled={confirmando || pendienteSincronizacion}>
          Regresar y editar
        </button>
        <button type="button" className="boton boton--primario" onClick={onConfirmar} disabled={confirmando || pendienteSincronizacion}>
          {confirmando ? 'Enviando…' : pendienteSincronizacion ? 'Pendiente de sincronización' : 'Confirmar y enviar'}
        </button>
      </footer>
    </div>
  );
}
