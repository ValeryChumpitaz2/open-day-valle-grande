
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import './MapSection.css';

function MapSection() {
  const mapsUrl =
    'https://www.google.com/maps/search/?api=1&query=Instituto+Valle+Grande+Cañete+Perú';

  return (
    <section className="map-section" id="ubicacion">
      <div className="container">

        <div className="map-heading">
          <span>ENCUÉNTRANOS</span>
          <h2>¿Cómo llegar a <strong>Valle Grande?</strong></h2>
          <p>
            Te esperamos en nuestro campus. Consulta nuestra ubicación
            y prepara tu visita al Open Day.
          </p>
        </div>

        <div className="map-content">
          <div className="map-information">
            <div className="map-icon">
              <MapPin size={25} />
            </div>

            <span className="map-label">NUESTRA UBICACIÓN</span>
            <h3>Visítanos en Valle Grande</h3>

            <p>
              Estamos en Cañete, Lima. Ven a conocer nuestras
              instalaciones y vivir una experiencia diferente.
            </p>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="map-button"
            >
              <Navigation size={18} />
              Cómo llegar
              <ExternalLink size={16} />
            </a>
          </div>

          <div className="map-frame">
            <iframe
              title="Ubicación de Valle Grande en Cañete"
              src="https://www.google.com/maps?q=Instituto%20Valle%20Grande%20Cañete%20Perú&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

      </div>
    </section>
  );
}

export default MapSection;
