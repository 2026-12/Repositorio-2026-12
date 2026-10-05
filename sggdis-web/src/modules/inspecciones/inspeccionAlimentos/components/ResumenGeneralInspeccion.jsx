export default function ResumenGeneralInspeccion({ documento, datosCierre, identidadInspector }) {
  const { resumen } = documento;

  return (
    <section className="vista-previa__resumen" id="vista-previa-resumen">
      <span className="vista-previa__codigo">Resumen general</span>
      <h2>Resumen General del Documento de Inspección</h2>
      <div className="vista-previa__resumen-datos">
        <article><span>Puntaje total</span><strong>{resumen.obtenidos} / {resumen.maximo}</strong></article>
        <article><span>Cumplimiento</span><strong>{resumen.porcentaje}%</strong></article>
        <article><span>Resultado</span><strong>{resumen.clasificacion.etiqueta}</strong></article>
        <article><span>Ítems críticos fallidos</span><strong>{resumen.criticosIncumplidos}</strong></article>
      </div>
      <p className={`vista-previa__orden ${resumen.ordenSanitariaProcede ? 'vista-previa__orden--alerta' : ''}`}>
        {resumen.ordenSanitariaProcede
          ? 'Procede revisar la emisión de una Orden Sanitaria por incumplimiento crítico (Art. 142).'
          : 'No se identificaron ítems críticos incumplidos.'}
      </p>
      <div className="vista-previa__puntajes-seccion">
        {documento.secciones.map((seccion) => {
          const porcentaje = seccion.resumen.maximo > 0
            ? Math.round((seccion.resumen.obtenidos / seccion.resumen.maximo) * 100)
            : 0;
          return (
            <article className="vista-previa__puntaje-circular" key={seccion.codigo}>
              <span>{porcentaje}%</span>
              <strong>{seccion.codigo} · {seccion.nombre}</strong>
              <small>{seccion.resumen.obtenidos} / {seccion.resumen.maximo} pts</small>
            </article>
          );
        })}
      </div>
      <div className="vista-previa__observaciones">
        <h3>Observaciones generales</h3>
        <p>{datosCierre.observacionesFinales?.trim() || '—'}</p>
      </div>
      <div className="vista-previa__firma">
        <div><span>Inspector responsable</span><strong>{identidadInspector?.nombreCompleto || '—'}</strong></div>
        <div><span>Identificación</span><strong>{identidadInspector?.identificacion || '—'}</strong></div>
        <div><span>Fecha de generación</span><strong>{new Date().toLocaleDateString('es-CR')}</strong></div>
      </div>
    </section>
  );
}
