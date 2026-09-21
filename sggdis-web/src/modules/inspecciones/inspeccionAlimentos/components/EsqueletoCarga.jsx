// Estado de carga tipo "esqueleto" mientras se obtiene una sección del backend.
export default function EsqueletoCarga() {
  return (
    <div className="pagina">
      <div className="skeleton-contenedor">
        <div className="skeleton skeleton--titulo"></div>
        <div className="skeleton skeleton--linea"></div>
        <div className="skeleton skeleton--linea"></div>
        <div className="skeleton skeleton--linea"></div>
        <div className="skeleton skeleton--linea"></div>
      </div>
    </div>
  );
}
