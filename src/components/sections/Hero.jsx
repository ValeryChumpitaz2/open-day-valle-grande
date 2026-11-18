
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import Countdown from './Countdown';
import './Hero.css';

function Hero() {
  return (
    <section className="hero-section" id="inicio">
      <div className="container">
        <div className="row align-items-center g-5">

          {/* TEXTO PRINCIPAL */}
          <div className="col-lg-5">
            <span className="hero-label">
              OPEN DAY 2026
            </span>

            <h1>
              Descubre tu futuro.
              <span> Vive la experiencia.</span>
            </h1>

            <p className="hero-description">
              Conoce Valle Grande, explora nuestras instalaciones
              y descubre nuevas oportunidades para tu formación
              profesional.
            </p>

            <div className="hero-event-info">
              <div>
                <CalendarDays size={19} />
                <span>12 de diciembre de 2026</span>
              </div>

              <div>
                <MapPin size={19} />
                <span>Valle Grande - Cañete</span>
              </div>
            </div>

            <a href="#inscripcion" className="hero-button">
              Quiero participar
              <ArrowRight size={19} />
            </a>
          </div>

          {/* IMAGEN Y CUENTA REGRESIVA */}
          <div className="col-lg-7">
            <div className="hero-visual">
              <img
                src="/images/estudiantes.jpg"
                alt="Experiencia educativa en Valle Grande"
                className="hero-image"
              />

              <Countdown eventDate="2026-12-12T09:00:00-05:00" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;
