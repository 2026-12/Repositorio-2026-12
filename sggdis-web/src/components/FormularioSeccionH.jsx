import FormularioSeccionAlimentos from './FormularioSeccionAlimentos';

// Revisa si el ítem permite la opción "N/A" (viene marcado desde el catálogo).
function permiteNoAplica(item) {
  return item?.noAplica === true || item?.noAplica === 'S' || item?.noAplica === 's';
}

// En la Sección H solo se muestra la opción "N/A" en los ítems que sí la permiten.
function opcionesCatering(item, opciones) {
  return permiteNoAplica(item)
    ? opciones
    : opciones.filter((opcion) => opcion.valor !== 'N/A');
}

// A diferencia de las demás secciones, aquí el puntaje parcial empieza en 1
// (no en 0): no se puede otorgar 0 puntos a un ítem marcado "Cumple".
function puntosCatering(item) {
  return Array.from({ length: item.valor }, (_, indice) => indice + 1);
}

// Componente dedicado para la Sección H (Servicio de Catering): a diferencia
// de B y C, este SÍ reutiliza FormularioSeccionAlimentos/FormularioSeccionGenerico
// tal como está pensado — solo le pasa personalizaciones puntuales (opciones,
// puntos y un campo de observación adicional por ítem). Este es el patrón
// recomendado para adaptar el núcleo genérico sin duplicar su lógica.
export default function FormularioSeccionH({
  observaciones = {},
  onObservacionesChange,
  ...props
}) {
  // Guarda el texto de la observación opcional que se puede escribir en cada ítem.
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
