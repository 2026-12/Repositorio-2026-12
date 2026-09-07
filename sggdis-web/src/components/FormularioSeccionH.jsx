import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

function permiteNoAplica(item) {
  return item?.noAplica === true || item?.noAplica === 'S' || item?.noAplica === 's';
}

function opcionesCatering(item, opciones) {
  return permiteNoAplica(item)
    ? opciones
    : opciones.filter((opcion) => opcion.valor !== 'N/A');
}

function puntosCatering(item) {
  return Array.from({ length: item.valor }, (_, indice) => indice + 1);
}

export default function FormularioSeccionH({
  observaciones = {},
  onObservacionesChange,
  ...props
}) {
  const manejarObservacion = (itemId, texto) => {
    onObservacionesChange?.((actuales) => ({ ...actuales, [itemId]: texto }));
  };

  return (
    <FormularioSeccionAlimentos
      {...props}
      codigo="H"
      titulo="Servicio de Catering"
      tabActivo={7}
      obtenerOpcionesItem={opcionesCatering}
      obtenerPuntosItem={puntosCatering}
      renderizarContenidoItem={({ item }) => (
        <div className="item__observacion">
          <label htmlFor={`obs-${item.id}`}>Observación (opcional)</label>
          <textarea
            id={`obs-${item.id}`}
            rows={2}
            placeholder="Anotar observación..."
            value={observaciones[item.id] ?? ''}
            onChange={(evento) => manejarObservacion(item.id, evento.target.value)}
          />
        </div>
      )}
    />
  );
}
