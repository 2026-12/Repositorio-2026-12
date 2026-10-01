const PASOS = [
  'Información General',
  'Ubicación',
  'Notificación',
  'Ordenanzas',
  'Responsable',
];

export default function NavegacionOrdenSanitaria({
  pasoActual,
  pasosCompletos = [],
  pasosConError = [],
  onCambiarPaso,
}) {
  return (
    <nav className="orden-tabs">

      {PASOS.map(
        (
          nombre,
          index
        ) => {
          const activo =
            pasoActual ===
            index;

          const completo =
            pasosCompletos.includes(
              index
            );

          const conError =
            pasosConError.includes(
              index
            );

          return (
            <button
              key={
                nombre
              }
              type="button"
              className={[
                'orden-tab',

                completo &&
                !conError
                  ? 'orden-tab--completo'
                  : '',

                conError
                  ? 'orden-tab--error'
                  : '',

                activo
                  ? 'orden-tab--activo'
                  : '',
              ]
                .filter(
                  Boolean
                )
                .join(' ')}
              onClick={() =>
                onCambiarPaso(
                  index
                )
              }
            >
              <span className="orden-tab__texto">
                {nombre}
              </span>
            </button>
          );
        }
      )}

    </nav>
  );
}