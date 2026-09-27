import mapaDorado from '../../../../assets/mapa-dorado.png';

export default function EncabezadoOrdenSanitaria({ inspeccionRelacionada, onVolverInicio }) {
  const nombreEstablecimiento = inspeccionRelacionada?.nombreEstablecimiento || 'Sin establecimiento relacionado';
  const consecutivo = inspeccionRelacionada?.consecutivo || 'Sin consecutivo';
  const tipoEstablecimiento = inspeccionRelacionada?.tipoEstablecimiento || 'Sin tipo de establecimiento';

  return (
    <header className="orden-cabecera">
      <div className="orden-cabecera__marca">
        <div className="orden-cabecera__logo">
          <img src={mapaDorado} alt="Ministerio de Salud de Costa Rica" />
        </div>

        <div className="orden-cabecera__textos">
          <h1>Orden Sanitaria</h1>
          <p>{nombreEstablecimiento} · Consecutivo: {consecutivo}</p>
        </div>
      </div>

      <div className="orden-cabecera__acciones">
        <span className="orden-cabecera__chip">{tipoEstablecimiento}</span>

        <button type="button" className="orden-volver" onClick={onVolverInicio}>
          ← Volver al menú
        </button>
      </div>
    </header>
  );
}