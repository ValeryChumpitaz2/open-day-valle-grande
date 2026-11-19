
import './AboutEvent.css';

function AboutEvent() {
    const experiences = [
        {
            number: '01',
            title: 'Proyectos digitales',
            description:
                'Descubre aplicaciones, sistemas y soluciones tecnológicas creadas por nuestros estudiantes.',
            image: '/images/proyectos-digitales.png',
            alt: 'Estudiantes desarrollando proyectos digitales'
        },
        {
            number: '02',
            title: 'Conoce nuestro campus',
            description:
                'Explora nuestras instalaciones, laboratorios y espacios de aprendizaje.',
            image: '/images/campus.JPG',
            alt: 'Instalaciones del campus Valle Grande'
        },
        {
            number: '03',
            title: 'Juegos y experiencias',
            description:
                'Participa en dinámicas, juegos y actividades interactivas para descubrir la tecnología.',
            image: '/images/juegos-experiencias.png',
            alt: 'Estudiantes participando en actividades interactivas'
        }
    ];

    return (
        <section className="about-section" id="evento">
            <div className="container">

                <div className="about-heading">
                    <span className="about-label">
                        DESCUBRE Y EXPERIMENTA
                    </span>

                    <h2>
                        ¿Qué encontrarás en nuestro
                        <span> Open Day?</span>
                    </h2>

                    <p>
                        Prepárate para conocer, explorar y disfrutar
                        de experiencias pensadas para ti.
                    </p>
                </div>

                <div className="row g-4">
                    {experiences.map((item) => (
                        <div
                            className="col-lg-4 col-md-6"
                            key={item.number}
                        >
                            <article className="experience-card">

                                <div className="experience-image-wrapper">
                                    <img
                                        src={item.image}
                                        alt={item.alt}
                                        className="experience-image"
                                    />

                                    <span className="experience-number">
                                        {item.number}
                                    </span>
                                </div>

                                <div className="experience-content">
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </div>

                            </article>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}

export default AboutEvent;
