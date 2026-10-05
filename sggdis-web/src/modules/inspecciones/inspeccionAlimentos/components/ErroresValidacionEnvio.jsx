export default function ErroresValidacionEnvio({ errores, onIrASeccion }) {
  if (errores.length === 0) return null;

  return (
    <section className="vista-previa__errores" role="alert">
      <h3>Corrige estos puntos antes de generar la vista previa</h3>
      {errores.map((vista) => (
        <div className="vista-previa__error-vista" key={vista.codigo}>
          <h4>{vista.nombre}</h4>
          {vista.secciones.map((seccion) => (
            <div className="vista-previa__error-seccion" key={seccion.codigo}>
              <strong>{seccion.nombre}</strong>
              {seccion.incompleta
                ? <p>No se pudo cargar el contenido de esta sección; vuelve a intentarlo con conexión.</p>
                : (
                  <ul>
                    {seccion.pendientes.map((item) => (
                      <li key={item.id}>
                        <span>{item.articulo || 'Artículo —'}</span> — {item.texto}
                      </li>
                    ))}
                  </ul>
                )}
              <button type="button" className="boton boton--secundario" onClick={() => onIrASeccion(seccion.codigo)}>
                Ir a esta sección
              </button>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
