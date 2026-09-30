import { useRef } from 'react';

export default function FilaOrdenanza({
  ordenanza,
  index,
  errores = {},
  onChange,
  onEliminar,
  onAgregar,
  puedeEliminar = false,
  mostrarAgregar = false,
}) {
  const fechaRef = useRef(null);
  const horaRef = useRef(null);

  const obtenerFechaActual = () => {
    const fecha = new Date();
    const offset = fecha.getTimezoneOffset() * 60000;
    return new Date(fecha.getTime() - offset).toISOString().slice(0, 10);
  };

  const fechaActual = obtenerFechaActual();

  const actualizarCampo = (campo, valor) => {
    onChange(index, { ...ordenanza, [campo]: valor });
  };

  const actualizarPlazo = (campo, valor) => {
    onChange(index, {
      ...ordenanza,
      plazo: {
        ...ordenanza.plazo,
        [campo]: valor,
      },
    });
  };

  const cambiarTipoPlazo = (valor) => {
    onChange(index, {
      ...ordenanza,
      plazo: {
        tipoPlazo: valor,
        cantidad: '',
        diaCumplimiento: '',
        mesCumplimiento: '',
        anioCumplimiento: '',
        horaCumplimiento: '',
      },
    });
  };

  const obtenerFecha = () => {
    const dia = ordenanza.plazo?.diaCumplimiento;
    const mes = ordenanza.plazo?.mesCumplimiento;
    const anio = ordenanza.plazo?.anioCumplimiento;

    if (!dia || !mes || !anio) return '';

    return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  };

  const cambiarFecha = (valor) => {
    if (valor && valor < fechaActual) return;

    if (!valor) {
      onChange(index, {
        ...ordenanza,
        plazo: {
          ...ordenanza.plazo,
          diaCumplimiento: '',
          mesCumplimiento: '',
          anioCumplimiento: '',
        },
      });
      return;
    }

    const [anio, mes, dia] = valor.split('-');

    onChange(index, {
      ...ordenanza,
      plazo: {
        ...ordenanza.plazo,
        diaCumplimiento: Number(dia),
        mesCumplimiento: Number(mes),
        anioCumplimiento: Number(anio),
      },
    });
  };

  const abrirSelector = (referencia) => {
    try {
      referencia.current?.showPicker?.();
    } catch {
      // El navegador utilizará su selector nativo.
    }
  };

  const obtenerEtiquetaCantidad = () => {
    if (ordenanza.plazo?.tipoPlazo === 'MESES') return 'Cantidad de meses';
    if (ordenanza.plazo?.tipoPlazo === 'HORAS') return 'Cantidad de horas';
    return 'Cantidad de días';
  };

  return (
    <section className="orden-ordenanza">
      <div className="orden-ordenanza__encabezado">
        <h3>Ordenanza {index + 1}</h3>

        <div className="orden-ordenanza__acciones">
          {mostrarAgregar && (
            <button type="button" className="orden-agregar" onClick={onAgregar}>
              + Agregar ordenanza
            </button>
          )}

          {puedeEliminar && (
            <button type="button" className="orden-eliminar" onClick={() => onEliminar(index)}>
              Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="orden-ordenanza__contenido">
        <div className="orden-campo">
          <label htmlFor={`ordenanza-${index}`}>Ordenanza</label>

          <textarea
            id={`ordenanza-${index}`}
            value={ordenanza.ordenanza || ''}
            placeholder="La redacción debe ser clara y precisa, no debe dar lugar a interpretaciones."
            onChange={(e) => actualizarCampo('ordenanza', e.target.value)}
          />

          {errores[`ordenanza-${index}`] && (
            <span className="orden-error">{errores[`ordenanza-${index}`]}</span>
          )}
        </div>

        <div className="orden-campo">
          <label htmlFor={`fundamento-${index}`}>Fundamento legal</label>

          <textarea
            id={`fundamento-${index}`}
            value={ordenanza.fundamentoLegal || ''}
            placeholder="Indique el fundamento legal correspondiente..."
            onChange={(e) => actualizarCampo('fundamentoLegal', e.target.value)}
          />

          {errores[`fundamento-${index}`] && (
            <span className="orden-error">{errores[`fundamento-${index}`]}</span>
          )}
        </div>

        <div className="orden-plazo">
          <span className="orden-plazo__titulo">Plazo de cumplimiento</span>

          <div className="orden-campo">
            <label htmlFor={`tipoPlazo-${index}`}>Tipo de plazo</label>

            <select
              id={`tipoPlazo-${index}`}
              value={ordenanza.plazo?.tipoPlazo || ''}
              onChange={(e) => cambiarTipoPlazo(e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="DIAS">Días</option>
              <option value="MESES">Meses</option>
              <option value="HORAS">Horas</option>
              <option value="FECHA">Fecha específica</option>
            </select>
          </div>

          {ordenanza.plazo?.tipoPlazo && ordenanza.plazo.tipoPlazo !== 'FECHA' && (
            <div className="orden-campo">
              <label htmlFor={`cantidadPlazo-${index}`}>
                {obtenerEtiquetaCantidad()}
              </label>

              <input
                id={`cantidadPlazo-${index}`}
                type="number"
                min="1"
                value={ordenanza.plazo?.cantidad || ''}
                onChange={(e) => actualizarPlazo('cantidad', e.target.value)}
              />
            </div>
          )}

          {ordenanza.plazo?.tipoPlazo === 'FECHA' && (
            <div className="orden-grid-2 orden-grid-fecha-hora">
              <div className="orden-campo">
                <label htmlFor={`fechaCumplimiento-${index}`}>
                  Fecha de cumplimiento
                </label>

                <input
                  ref={fechaRef}
                  id={`fechaCumplimiento-${index}`}
                  type="date"
                  min={fechaActual}
                  value={obtenerFecha()}
                  onChange={(e) => cambiarFecha(e.target.value)}
                  onClick={() => abrirSelector(fechaRef)}
                />
              </div>

              <div className="orden-campo">
                <label htmlFor={`horaCumplimiento-${index}`}>
                  Hora (formato 24 horas)
                </label>

                <input
                  ref={horaRef}
                  id={`horaCumplimiento-${index}`}
                  type="time"
                  value={ordenanza.plazo?.horaCumplimiento || ''}
                  step="300"
                  onChange={(e) => actualizarPlazo('horaCumplimiento', e.target.value)}
                  onClick={() => abrirSelector(horaRef)}
                />
              </div>
            </div>
          )}

          {errores[`plazo-${index}`] && (
            <span className="orden-error">{errores[`plazo-${index}`]}</span>
          )}
        </div>
      </div>
    </section>
  );
}