
import { CalendarDays } from 'lucide-react';
import './Navbar.css';
function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-white sticky-top shadow-sm main-navbar">
      <div className="container py-2">

            <a className="navbar-brand" href="#inicio">
            <img
                src="/images/logo-valle-grande.png"
                alt="Valle Grande"
                className="logo"
            />
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menuPrincipal"
          aria-controls="menuPrincipal"
          aria-expanded="false"
          aria-label="Abrir menú"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="menuPrincipal">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-3">

            <li className="nav-item">
              <a className="nav-link" href="#inicio">Inicio</a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="#evento">El evento</a>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="#ubicacion">Ubicación</a>
            </li>

            <li className="nav-item">
              <a className="btn btn-primary px-4 rounded-pill"
                 href="#inscripcion">
                <CalendarDays size={17} className="me-2" />
                Inscríbete
              </a>
            </li>

          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
