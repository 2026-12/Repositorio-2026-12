import mapaDorado from '../../../assets/mapa-dorado.png';

export default function EncabezadoOrdenSanitaria({
  onVolverInicio,
}) {
  return (
    <header className="orden-sanitaria__cabecera">
      <div className="orden-sanitaria__marca">
        <div className="orden-sanitaria__logo">
          <img
            src={mapaDorado}
            alt="Ministerio de Salud de Costa Rica"
          />
        </div>

        <div>
          <h1>Orden Sanitaria</h1>

          <p>
            Ministerio de Salud de Costa Rica — SGGDIS
          </p>
        </div>
      </div>

      <button
        type="button"
        className="orden-sanitaria__volver"
        onClick={onVolverInicio}
      >
        ← Volver al menú
      </button>
    </header>
  );
}