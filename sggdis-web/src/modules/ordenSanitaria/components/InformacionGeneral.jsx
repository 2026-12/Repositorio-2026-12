import { useEffect, useRef, useState } from 'react';

const CONDICIONES = [
  { id: 'Propietario', nombre: 'Propietario' },
  { id: 'Inquilino', nombre: 'Inquilino' },
  { id: 'Arrendatario', nombre: 'Arrendatario' },
  { id: 'Presidente', nombre: 'Presidente' },
  { id: 'Director', nombre: 'Director' },
  { id: 'Representante legal', nombre: 'Representante legal' },
  { id: 'Gerente', nombre: 'Gerente' },
  { id: 'Otro', nombre: 'Otro' },
];

function SelectorCondicion({ value, onChange, error }) {
  const [abierto, setAbierto] = useState(false);
  const referencia = useRef(null);
  const seleccionada = CONDICIONES.find((opcion) => opcion.id === value);

  useEffect(() => {
    const cerrarSelector = (evento) => {
      if (referencia.current && !referencia.current.contains(evento.target)) setAbierto(false);
    };

    document.addEventListener('mousedown', cerrarSelector);
    return () => document.removeEventListener('mousedown', cerrarSelector);
  }, []);

  return (
    <div className="orden-campo" ref={referencia}>
      <label htmlFor="condicion">En su condición de </label>

      <div className={`orden-selector ${abierto ? 'orden-selector--abierto' : ''}`}>
        <button
          id="condicion"
          type="button"
          className="orden-selector__boton"
          onClick={() => setAbierto((actual) => !actual)}
          aria-expanded={abierto}
        >
          <span className={seleccionada ? '' : 'orden-selector__placeholder'}>
            {seleccionada ? seleccionada.nombre : 'Seleccione...'}
          </span>

          <span className={`orden-selector__flecha ${abierto ? 'orden-selector__flecha--abierta' : ''}`}>
            ▾
          </span>
        </button>

        {abierto && (
          <div className="orden-selector__opciones">
            <button
              type="button"
              className="orden-selector__opcion orden-selector__opcion--placeholder"
              onClick={() => {
                onChange('');
                setAbierto(false);
              }}
            >
              Seleccione...
            </button>

            {CONDICIONES.map((opcion) => (
              <button
                key={opcion.id}
                type="button"
                className={`orden-selector__opcion ${opcion.id === value ? 'orden-selector__opcion--seleccionada' : ''}`}
                onClick={() => {
                  onChange(opcion.id);
                  setAbierto(false);
                }}
              >
                {opcion.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <span className="orden-error">{error}</span>}
    </div>
  );
}

export default function InformacionGeneral({ datos = {}, errores = {}, onChange }) {
  const condicionEsOtra = (datos.condicion || '').toLowerCase() === 'otro';

  return (
    <>
      <section className="orden-apartado">
        <h2>Información General de la Orden Sanitaria</h2>
        <p>Verifique los datos provenientes de la inspección relacionada y complete la información requerida para la Orden Sanitaria.</p>
      </section>

      <div className="orden-dato-general">
        <div className="orden-campo">
          <label htmlFor="numeroConsecutivo">Número consecutivo de la inspección</label>
          <input id="numeroConsecutivo" type="text" value={datos.numeroConsecutivo || ''} readOnly className="orden-campo--solo-lectura" />
          {errores.numeroConsecutivo && <span className="orden-error">{errores.numeroConsecutivo}</span>}
        </div>
      </div>

      <section className="orden-grupo orden-grupo--selector">
        <div className="orden-grupo__titulo">Persona a notificar</div>

        <div className="orden-grupo__contenido">
          <div className="orden-campo">
            <label htmlFor="nombreCompleto">Nombre de la persona a notificar</label>
            <input id="nombreCompleto" type="text" value={datos.nombreCompleto || ''} readOnly className="orden-campo--solo-lectura" />
            {errores.nombreCompleto && <span className="orden-error">{errores.nombreCompleto}</span>}
          </div>

          <div className="orden-grid-2">
            <div>
              <SelectorCondicion value={datos.condicion || ''} onChange={(valor) => onChange('condicion', valor)} error={errores.condicion} />

              {condicionEsOtra && (
                <div className="orden-campo">
                  <label htmlFor="otraCondicion">Otra condición </label>
                  <input id="otraCondicion" type="text" value={datos.otraCondicion || ''} onChange={(e) => onChange('otraCondicion', e.target.value)} />
                  {errores.otraCondicion && <span className="orden-error">{errores.otraCondicion}</span>}
                </div>
              )}
            </div>

            <div className="orden-campo">
              <label htmlFor="identificacion">Número de identificación</label>
              <input id="identificacion" type="text" value={datos.identificacion || ''} readOnly className="orden-campo--solo-lectura" />
              {errores.identificacion && <span className="orden-error">{errores.identificacion}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="orden-grupo">
        <div className="orden-grupo__titulo">Información del establecimiento, sitio o inmueble</div>

        <div className="orden-grupo__contenido">
          <div className="orden-campo">
            <label htmlFor="nombreEstablecimiento">Nombre del establecimiento / sitio / inmueble</label>
            <input id="nombreEstablecimiento" type="text" value={datos.nombreEstablecimiento || ''} readOnly className="orden-campo--solo-lectura" />
            {errores.nombreEstablecimiento && <span className="orden-error">{errores.nombreEstablecimiento}</span>}
          </div>

          <div className="orden-campo">
            <label htmlFor="numeroExpediente">Número de expediente</label>
            <input id="numeroExpediente" type="text" value={datos.numeroExpediente || ''} onChange={(e) => onChange('numeroExpediente', e.target.value)} />
          </div>
        </div>
      </section>
    </>
  );
}