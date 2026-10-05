// Aviso flotante pequeño (costado derecho) cuando el inspector intenta
// continuar con campos obligatorios sin llenar. Igual que el aviso de
// navegación bloqueada de Guía de Inspección: no tapa la pantalla, se cierra
// solo, y el módulo ya llevó al inspector al campo que falta.
function AvisoCamposObligatorios() {
  return (
    <div className="acta-aviso" role="alert">
      <span className="acta-aviso__icono" aria-hidden="true">!</span>

      <span>Complete todos los campos obligatorios antes de continuar.</span>
    </div>
  );
}

export default AvisoCamposObligatorios;
