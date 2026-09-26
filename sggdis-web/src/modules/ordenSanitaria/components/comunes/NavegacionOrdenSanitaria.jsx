import { PASOS_ORDEN_SANITARIA }
  from '../../config/ordenSanitaria';

export default function NavegacionOrdenSanitaria({
  indicePaso,
  onIrAPaso,
}) {
  return (
    <nav
      className="orden-sanitaria__navegacion"
      aria-label="Secciones de la Orden Sanitaria"
    >
      {PASOS_ORDEN_SANITARIA.map((paso, indice) => {
        const activo = indice === indicePaso;
        const completado = indice < indicePaso;

        return (
          <button
            key={paso.id}
            type="button"
            className={[
              'orden-sanitaria__paso',
              activo
                ? 'orden-sanitaria__paso--activo'
                : '',
              completado
                ? 'orden-sanitaria__paso--completado'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onIrAPaso(paso.id)}
            aria-current={activo ? 'step' : undefined}
          >
            <span className="orden-sanitaria__paso-numero">
              {paso.numero}
            </span>

            <span className="orden-sanitaria__paso-etiqueta">
              {paso.etiqueta}
            </span>
          </button>
        );
      })}
    </nav>
  );
}