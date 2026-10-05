export default function PendienteSincronizacion() {
  return (
    <div className="vista-previa__pendiente" role="status" aria-live="polite">
      <strong>Inspección pendiente de sincronización</strong>
      <p>El documento quedó guardado en este dispositivo. Se enviará automáticamente cuando se recupere la conexión.</p>
    </div>
  );
}
