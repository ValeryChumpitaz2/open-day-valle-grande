
import { ArrowRight, Sparkles } from 'lucide-react';
import './EventDetails.css';

function EventDetails() {
  return (
    <section className="event-details-section" id="ubicacion">
      <div className="container">
        <div className="event-poster-layout">

          <div className="event-poster-text">
            <span className="event-poster-label">
              <Sparkles size={15} />
              TODO ESTÁ LISTO
            </span>

            <h2>
              Una experiencia
              <span> que no te puedes perder.</span>
            </h2>

            <p>
              Descubre todo lo que hemos preparado para ti.
              Revisa los detalles de nuestro Open Day y prepárate
              para vivir una experiencia diferente en Valle Grande.
            </p>

            <a href="#inscripcion" className="event-poster-button">
              Quiero participar
              <ArrowRight size={19} />
            </a>
          </div>

          <div className="event-poster-image-wrapper">
            <img
              src="/images/open-day-info.jpg"
              alt="Afiche oficial del Open Day Valle Grande 2026"
              className="event-poster-image"
            />
          </div>

        </div>
      </div>
    </section>
  );
}

export default EventDetails;
