export default function VistaPreviaSeccion({ seccion, textoAdvertenciaCritico }) {
  return (
    <section className="vista-previa__seccion" id={`vista-previa-seccion-${seccion.codigo}`}>
      <header className="vista-previa__seccion-cabecera">
        <div>
          <span className="vista-previa__codigo">Sección {seccion.codigo}</span>
          <h2>{seccion.nombre}</h2>
        </div>
        <strong>{seccion.resumen.obtenidos} / {seccion.resumen.maximo} pts</strong>
      </header>
      <div className="vista-previa__tabla-contenedor">
        <table className="vista-previa__tabla">
          <thead>
            <tr>
              <th>Ítem</th>
              <th>Artículo / Requisito</th>
              <th>Resultado</th>
              <th>Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {seccion.items.map((item, indice) => (
              <tr key={item.id} className={item.criticoIncumplido ? 'vista-previa__fila-critica' : undefined}>
                <td>
                  {item.critico && <span className="vista-previa__critico">CRÍTICO</span>}
                  {indice + 1}
                  {item.criticoIncumplido && (
                    <p className="vista-previa__alerta-critica">{textoAdvertenciaCritico}</p>
                  )}
                </td>
                <td>
                  <span className="vista-previa__articulo">{item.articulo || '—'}</span>
                  <p>{item.texto}</p>
                </td>
                <td>
                  <span className={`vista-previa__resultado vista-previa__resultado--${item.estado === 'Cumple' ? 'cumple' : item.estado === 'No cumple' ? 'no-cumple' : item.estado === 'N/A' ? 'na' : 'pendiente'}`}>
                    {item.resultado}
                  </span>
                </td>
                <td>{item.puntosObtenidos} / {item.estado === 'N/A' ? 0 : item.puntosMaximos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="vista-previa__seccion-pie">
        <span>{seccion.resumen.itemsCumplen} de {seccion.resumen.itemsAplicables} ítems aplicables cumplen</span>
        <strong>{seccion.resumen.obtenidos} / {seccion.resumen.maximo} puntos ({seccion.resumen.porcentaje}%)</strong>
      </footer>
    </section>
  );
}
