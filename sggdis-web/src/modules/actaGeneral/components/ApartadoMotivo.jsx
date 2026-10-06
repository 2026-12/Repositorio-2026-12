import { useEffect, useRef, useState } from 'react';
import { MOTIVOS_INSPECCION } from '../config/actaGeneral';

// Apartado III del wizard del Acta General (HU-008): motivo de la
// inspección. Es una lista desplegable de selección ÚNICA (combobox): solo se
// puede elegir un motivo. El estado y el guardado viven en useActaGeneral,
// acá solo vive si la lista está abierta o cerrada.
function ApartadoMotivo({ datos, errores, onCambiarCampo }) {
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

  // Selección única: marcar un motivo reemplaza al que estuviera marcado, y
  // volver a marcar el mismo lo deja sin selección. La lista se cierra al
  // elegir, como un <select> nativo. El dato sigue siendo un arreglo (de 0 o
  // 1 elemento) para no cambiar la validación ni el guardado.
  const elegirMotivo = (valor) => {
    const yaElegido = (datos.motivoInspeccion ?? []).includes(valor);

    onCambiarCampo('motivoInspeccion', yaElegido ? [] : [valor]);
    setListaAbierta(false);
  };

  const resumenSeleccion = MOTIVOS_INSPECCION
    .filter((motivo) => (datos.motivoInspeccion ?? []).includes(motivo.valor))
    .map((motivo) => motivo.etiqueta)
    .join(', ');

  return (
    <section className="acta-apartado">
      <p className="acta-apartado__etiqueta">Apartado III</p>

      <h2 className="acta-apartado__titulo">Motivo de la Inspección</h2>

      <p className="acta-apartado__descripcion">
        Seleccione el motivo de esta inspección.
      </p>

      <div className="acta-campo">
        <span className="acta-campo__etiquetaGrupo" id="motivoInspeccion-etiqueta">
          Motivo de la inspección *
        </span>

        <div className="acta-multiselect" ref={contenedorListaRef}>
          <button
            type="button"
            className={`acta-multiselect__boton ${resumenSeleccion ? '' : 'acta-multiselect__boton--vacio'}`}
            data-campo="motivoInspeccion"
            aria-haspopup="true"
            aria-expanded={listaAbierta}
            aria-labelledby="motivoInspeccion-etiqueta"
            title={resumenSeleccion || undefined}
            onClick={() => setListaAbierta((abierta) => !abierta)}
          >
            {resumenSeleccion || 'Seleccione un motivo'}
          </button>

          {listaAbierta && (
            <div className="acta-multiselect__lista" role="group" aria-labelledby="motivoInspeccion-etiqueta">
              {MOTIVOS_INSPECCION.map((motivo) => (
                <label key={motivo.valor} className="acta-multiselect__opcion">
                  <input
                    type="checkbox"
                    checked={(datos.motivoInspeccion ?? []).includes(motivo.valor)}
                    onChange={() => elegirMotivo(motivo.valor)}
                  />
                  <span>{motivo.etiqueta}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {errores.motivoInspeccion && (
          <span className="acta-campo__error">{errores.motivoInspeccion}</span>
        )}
      </div>

      {(datos.motivoInspeccion ?? []).includes('OTRO') && (
        <div className="acta-campo">
          <label htmlFor="motivoInspeccionOtro">Especifique el motivo *</label>
          <input
            id="motivoInspeccionOtro"
            type="text"
            placeholder="Ej: Verificación de denuncia anónima"
            value={datos.motivoInspeccionOtro}
            onChange={manejarCambio('motivoInspeccionOtro')}
          />
          {errores.motivoInspeccionOtro && (
            <span className="acta-campo__error">{errores.motivoInspeccionOtro}</span>
          )}
        </div>
      )}
    </section>
  );
}

export default ApartadoMotivo;
