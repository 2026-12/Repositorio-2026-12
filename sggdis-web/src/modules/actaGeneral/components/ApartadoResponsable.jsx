import { useEffect, useRef, useState } from 'react';
import { CARGOS_RESPONSABLE } from '../config/actaGeneral';
import { limpiarSoloNumeros } from '../domain/validacionInfoGeneral';

// Apartado II del wizard del Acta General (HU-007): datos de la persona que
// atiende la inspección. El cargo es una lista desplegable de selección ÚNICA
// (combobox): el estado y el guardado viven en useActaGeneral, acá solo vive
// si la lista está abierta o cerrada.
function ApartadoResponsable({ datos, errores, onCambiarCampo }) {
  const [listaAbierta, setListaAbierta] = useState(false);
  const contenedorListaRef = useRef(null);

  const manejarCambio = (campo) => (evento) => {
    onCambiarCampo(campo, evento.target.value);
  };

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

  // Selección única: marcar un cargo reemplaza al que estuviera marcado, y
  // volver a marcar el mismo lo deja sin selección. La lista se cierra al
  // elegir, como un <select> nativo. El dato sigue siendo un arreglo (de 0 o
  // 1 elemento) para no cambiar la validación ni el guardado.
  const elegirCargo = (valor) => {
    const yaElegido = (datos.cargoResponsable ?? []).includes(valor);

    onCambiarCampo('cargoResponsable', yaElegido ? [] : [valor]);
    setListaAbierta(false);
  };

  const resumenSeleccion = CARGOS_RESPONSABLE
    .filter((cargo) => (datos.cargoResponsable ?? []).includes(cargo.valor))
    .map((cargo) => cargo.etiqueta)
    .join(', ');

  return (
    <section className="acta-apartado">
      <p className="acta-apartado__etiqueta">Apartado II</p>

      <h2 className="acta-apartado__titulo">Información del Responsable durante la Inspección</h2>

      <p className="acta-apartado__descripcion">
        Indique los datos personales de la persona que atiende durante la inspección.
      </p>

      <div className="acta-campo">
        <label htmlFor="nombreResponsable">
          Nombre de la persona responsable de la atención durante la inspección *
        </label>
        <input
          id="nombreResponsable"
          type="text"
          placeholder="Ej: María Fernández Solano"
          value={datos.nombreResponsable}
          onChange={manejarCambio('nombreResponsable')}
        />
        {errores.nombreResponsable && (
          <span className="acta-campo__error">{errores.nombreResponsable}</span>
        )}
      </div>

      <div className="acta-campo">
        <span className="acta-campo__etiquetaGrupo" id="cargoResponsable-etiqueta">
          Cargo de la persona que atendió la inspección *
        </span>

        <div className="acta-multiselect" ref={contenedorListaRef}>
          <button
            type="button"
            className={`acta-multiselect__boton ${resumenSeleccion ? '' : 'acta-multiselect__boton--vacio'}`}
            data-campo="cargoResponsable"
            aria-haspopup="true"
            aria-expanded={listaAbierta}
            aria-labelledby="cargoResponsable-etiqueta"
            title={resumenSeleccion || undefined}
            onClick={() => setListaAbierta((abierta) => !abierta)}
          >
            {resumenSeleccion || 'Seleccione un cargo'}
          </button>

          {listaAbierta && (
            <div className="acta-multiselect__lista" role="group" aria-labelledby="cargoResponsable-etiqueta">
              {CARGOS_RESPONSABLE.map((cargo) => (
                <label key={cargo.valor} className="acta-multiselect__opcion">
                  <input
                    type="checkbox"
                    checked={(datos.cargoResponsable ?? []).includes(cargo.valor)}
                    onChange={() => elegirCargo(cargo.valor)}
                  />
                  <span>{cargo.etiqueta}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {errores.cargoResponsable && (
          <span className="acta-campo__error">{errores.cargoResponsable}</span>
        )}
      </div>

      {(datos.cargoResponsable ?? []).includes('OTRO') && (
        <div className="acta-campo">
          <label htmlFor="cargoResponsableOtro">Especifique el cargo *</label>
          <input
            id="cargoResponsableOtro"
            type="text"
            placeholder="Ej: Encargado de mantenimiento"
            value={datos.cargoResponsableOtro}
            onChange={manejarCambio('cargoResponsableOtro')}
          />
          {errores.cargoResponsableOtro && (
            <span className="acta-campo__error">{errores.cargoResponsableOtro}</span>
          )}
        </div>
      )}

      <div className="acta-campo">
        <label htmlFor="numeroIdentificacionResponsable">
          Número de identificación de la persona que atendió la inspección *
        </label>
        <input
          id="numeroIdentificacionResponsable"
          type="text"
          inputMode="numeric"
          placeholder="Ej: 123456789"
          value={datos.numeroIdentificacionResponsable}
          onChange={(evento) =>
            onCambiarCampo('numeroIdentificacionResponsable', limpiarSoloNumeros(evento.target.value))
          }
        />
        {errores.numeroIdentificacionResponsable && (
          <span className="acta-campo__error">{errores.numeroIdentificacionResponsable}</span>
        )}
      </div>
    </section>
  );
}

export default ApartadoResponsable;
