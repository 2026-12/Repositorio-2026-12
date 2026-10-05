import { useEffect, useRef, useState } from 'react';
import {
  ACCIONES_A_SEGUIR,
  LONGITUD_MAXIMA_MOTIVO_REPROGRAMACION,
  LONGITUD_MAXIMA_ACCION_OTRO,
} from '../config/actaGeneral';

// Apartado V del wizard del Acta General (HU-010): acciones a seguir.
// Igual que ApartadoMotivo, es un componente "tonto": el estado y el
// guardado viven en useActaGeneral. Lo único local es si la lista
// desplegable está abierta o cerrada.
function ApartadoAcciones({ datos, errores, onCambiarCampo }) {
  const [listaAbierta, setListaAbierta] = useState(false);
  const contenedorListaRef = useRef(null);

  // Cierra la lista al tocar fuera de ella o al presionar Escape, como un
  // <select> nativo.
  useEffect(() => {
    if (!listaAbierta) return undefined;

    const cerrarSiEsFuera = (evento) => {
      if (!contenedorListaRef.current?.contains(evento.target)) {
        setListaAbierta(false);
      }
    };
    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') setListaAbierta(false);
    };

    document.addEventListener('pointerdown', cerrarSiEsFuera);
    document.addEventListener('keydown', cerrarConEscape);

    return () => {
      document.removeEventListener('pointerdown', cerrarSiEsFuera);
      document.removeEventListener('keydown', cerrarConEscape);
    };
  }, [listaAbierta]);

  // Selección múltiple: marcar o desmarcar una acción. Se mantiene el orden
  // del catálogo para que el resumen siempre se lea igual.
  const alternarAccion = (valor) => {
    const seleccionadas = datos.acciones.includes(valor)
      ? datos.acciones.filter((accion) => accion !== valor)
      : ACCIONES_A_SEGUIR.map((accion) => accion.valor).filter(
        (codigo) => codigo === valor || datos.acciones.includes(codigo),
      );

    onCambiarCampo('acciones', seleccionadas);
  };

  const resumenSeleccion = ACCIONES_A_SEGUIR
    .filter((accion) => datos.acciones.includes(accion.valor))
    .map((accion) => accion.etiqueta)
    .join(', ');

  return (
    <section className="acta-apartado">
      <p className="acta-apartado__etiqueta">Apartado V</p>

      <h2 className="acta-apartado__titulo">Acciones a Seguir</h2>

      <p className="acta-apartado__descripcion">
        Seleccione una o varias acciones a seguir relacionadas con la inspección realizada.
      </p>

      <div className="acta-campo">
        <span className="acta-campo__etiquetaGrupo" id="acciones-etiqueta">Acciones a seguir *</span>

        <div className="acta-multiselect" ref={contenedorListaRef}>
          <button
            type="button"
            className={`acta-multiselect__boton ${resumenSeleccion ? '' : 'acta-multiselect__boton--vacio'}`}
            data-campo="acciones"
            aria-haspopup="true"
            aria-expanded={listaAbierta}
            aria-labelledby="acciones-etiqueta"
            title={resumenSeleccion || undefined}
            onClick={() => setListaAbierta((abierta) => !abierta)}
          >
            {resumenSeleccion || 'Seleccione una o varias acciones'}
          </button>

          {listaAbierta && (
            <div className="acta-multiselect__lista" role="group" aria-labelledby="acciones-etiqueta">
              {ACCIONES_A_SEGUIR.map((accion) => (
                <label key={accion.valor} className="acta-multiselect__opcion">
                  <input
                    type="checkbox"
                    checked={datos.acciones.includes(accion.valor)}
                    onChange={() => alternarAccion(accion.valor)}
                  />
                  <span>{accion.etiqueta}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {errores.acciones && (
          <span className="acta-campo__error">{errores.acciones}</span>
        )}
      </div>

      {datos.acciones.includes('REPROGRAMACION') && (
        <div className="acta-campo">
          <label htmlFor="motivoReprogramacion">Motivo de la reprogramación *</label>
          <textarea
            id="motivoReprogramacion"
            maxLength={LONGITUD_MAXIMA_MOTIVO_REPROGRAMACION}
            placeholder="Explique el motivo por el que se reprograma la inspección..."
            value={datos.motivoReprogramacion}
            onChange={(evento) => onCambiarCampo('motivoReprogramacion', evento.target.value)}
          />
          {errores.motivoReprogramacion && (
            <span className="acta-campo__error">{errores.motivoReprogramacion}</span>
          )}
        </div>
      )}

      {datos.acciones.includes('OTRO') && (
        <div className="acta-campo">
          <label htmlFor="accionOtro">Especifique la acción *</label>
          <input
            id="accionOtro"
            type="text"
            maxLength={LONGITUD_MAXIMA_ACCION_OTRO}
            placeholder="Ej: Coordinación con la municipalidad"
            value={datos.accionOtro}
            onChange={(evento) => onCambiarCampo('accionOtro', evento.target.value)}
          />
          {errores.accionOtro && (
            <span className="acta-campo__error">{errores.accionOtro}</span>
          )}
        </div>
      )}
    </section>
  );
}

export default ApartadoAcciones;
