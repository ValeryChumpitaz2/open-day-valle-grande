
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  ArrowUp,
  ShieldCheck
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">

        <div className="footer-main">

          {/* Marca institucional */}
          <div className="footer-brand">
            <a href="#inicio" className="footer-logo-link">
              <img
                src="/images/logo-valle-grande.png"
                alt="Valle Grande"
                className="footer-logo"
              />
            </a>

            <p>
              Descubre nuevas oportunidades, desarrolla tus talentos
              y construye tu futuro junto a Valle Grande.
            </p>
          </div>

          {/* Navegación */}
          <div className="footer-navigation">
            <h3>Explora</h3>

            <a href="#inicio">Inicio</a>
            <a href="#evento">El Open Day</a>
            <a href="#ubicacion">Ubicación</a>
            <a href="#inscripcion">Inscripciones</a>

            <Link to="/admin" className="footer-admin-link">
              <ShieldCheck size={16} />
              Acceso administrativo
            </Link>
          </div>

          {/* Información de contacto */}
          <div className="footer-contact">
            <h3>Contacto</h3>

            <div className="footer-contact-item">
              <MapPin size={19} />
              <p>
                Ant. Panamericana Sur: Km. 144,
                San Vicente de Cañete, Lima, Perú.
                Apartado Postal 70.
              </p>
            </div>

            <div className="footer-contact-item">
              <Phone size={18} />
              <a href="tel:+5115812261">
                (01) 581-2261
              </a>
            </div>

            <div className="footer-contact-item">
              <Mail size={18} />
              <a href="mailto:informes@vallegrande.edu.pe">
                informes@vallegrande.edu.pe
              </a>
            </div>

            <div className="footer-contact-item">
              <Globe size={18} />
              <a
                href="https://www.vallegrande.edu.pe"
                target="_blank"
                rel="noreferrer"
              >
                www.vallegrande.edu.pe
              </a>
            </div>
          </div>

        </div>

        {/* Pie de página */}
        <div className="footer-bottom">
          <p>
            © Valle Grande 2026 – Todos los Derechos Reservados.
          </p>

          <a href="#inicio" className="footer-top">
            Volver arriba
            <ArrowUp size={16} />
          </a>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
