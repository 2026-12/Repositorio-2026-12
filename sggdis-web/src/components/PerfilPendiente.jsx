import './PantallaLogin.css';

export default function PerfilPendiente({ rol, onCerrarSesion }) {
  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="perfil-pendiente-titulo">
        <header className="login-brand">
          <div className="login-brand__seal" />
          <p className="login-brand__name">MINISTERIO DE SALUD · COSTA RICA</p>
          <h1 id="perfil-pendiente-titulo">Perfil pendiente</h1>
          <p className="login-brand__subtitle">El espacio para el rol {rol} aún no está disponible. Contacte al Administrador.</p>
        </header>
        <button className="login-submit" type="button" onClick={onCerrarSesion}>Cerrar sesión</button>
      </section>
    </main>
  );
}