import { useGuiasInspeccion } from '../hooks/useGuiasInspeccion';
import { LONGITUD_MAXIMA_HALLAZGOS } from '../config/actaGeneral';

// Apartado IV del wizard del Acta General (HU-009): guías aplicables y
// descripción de los hallazgos. Igual que ApartadoMotivo, el estado y el
// guardado viven en useActaGeneral; lo único que se carga acá es el
// catálogo de guías (INS_GUIA), que no se hardcodea en el frontend.
function ApartadoHallazgos({ datos, errores, onCambiarCampo }) {
  const { guias, cargando, error } = useGuiasInspeccion();

  // Selección múltiple: cada clic marca o desmarca la guía.
  const alternarGuia = (idGuia) => {
    const seleccionadas = datos.idsGuias.includes(idGuia)
      ? datos.idsGuias.filter((id) => id !== idGuia)
      : [...datos.idsGuias, idGuia];

    onCambiarCampo('idsGuias', seleccionadas);
  };

  return (
    <section className="acta-apartado">
      <p className="acta-apartado__etiqueta">Apartado IV</p>

      <h2 className="acta-apartado__titulo">Hallazgos de la Inspección</h2>

      <p className="acta-apartado__descripcion">
        Seleccione las guías aplicadas durante la inspección y describa los hallazgos encontrados.
      </p>

      <div className="acta-campo">
        <span className="acta-campo__etiquetaGrupo">Guías aplicables *</span>

        {cargando && (
          <span className="acta-campo__cargando" role="status">Cargando guías de inspección…</span>
        )}

        {!cargando && error && (
          <div className="acta-alerta" role="alert">
            <strong>No se pudieron cargar las guías</strong>
            <span>{error}</span>
          </div>
        )}

        {!cargando && !error && (
          <div className="acta-opciones acta-opciones--envolver" data-campo="idsGuias">
            {guias.map((guia) => {
              const seleccionada = datos.idsGuias.includes(guia.idGuia);

              return (
                <button
                  key={guia.idGuia}
                  type="button"
                  className={`acta-opcion ${seleccionada ? 'acta-opcion--activa' : ''}`}
                  aria-pressed={seleccionada}
                  onClick={() => alternarGuia(guia.idGuia)}
                >
                  {guia.nombre}
                </button>
              );
            })}
          </div>
        )}

        {errores.idsGuias && (
          <span className="acta-campo__error">{errores.idsGuias}</span>
        )}
      </div>

      <div className="acta-campo">
        <label htmlFor="hallazgos">Descripción de los hallazgos *</label>
        <textarea
          id="hallazgos"
          rows={6}
          maxLength={LONGITUD_MAXIMA_HALLAZGOS}
          placeholder="Describa los hallazgos encontrados durante la inspección..."
          value={datos.hallazgos}
          onChange={(evento) => onCambiarCampo('hallazgos', evento.target.value)}
        />
        {errores.hallazgos && (
          <span className="acta-campo__error">{errores.hallazgos}</span>
        )}
      </div>
    </section>
  );
}

export default ApartadoHallazgos;
