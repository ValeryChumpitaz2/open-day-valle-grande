
import {
    Laptop,
    Building2,
    Gamepad2
} from 'lucide-react';

import './AboutEvent.css';

function AboutEvent() {
    const experiences = [
        {
            icon: Laptop,
            number: '01',
            title: 'Proyectos digitales',
            description:
                'Conoce las soluciones creadas por nuestros estudiantes.'
        },
        {
            icon: Building2,
            number: '02',
            title: 'Conoce nuestro campus',
            description:
                'Recorre nuestras instalaciones y descubre dónde construyes tu futuro.'
        },
        {
            icon: Gamepad2,
            number: '03',
            title: 'Juegos y experiencias',
            description:
                'Participa en actividades interactivas y vive la tecnología.'
        }
    ];

    return (
        <section className="about-section" id="evento">
            <div className="container">

                <div className="about-heading">
                    <span className="about-label">DESCUBRE Y EXPERIMENTA</span>

                    <h2>
                        ¿Qué encontrarás en nuestro
                        <span> Open Day?</span>
                    </h2>

                    <p>
                        Prepárate para conocer, explorar y disfrutar de
                        experiencias pensadas para ti.
                    </p>
                </div>

                <div className="row align-items-center g-5">
                    <div className="col-lg-7">
                        <div className="about-image-wrapper">
                            <img
                                src="/images/hero.jpg"
                                alt="Estudiantes de Valle Grande"
                                className="about-image"
                            />
                        </div>
                    </div>
                    <div className="col-lg-5">
                        <div className="experience-list">
                            {experiences.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <article className="experience-item" key={item.number}>
                                        <span className="experience-number">
                                            {item.number}
                                        </span>

                                        <div className="experience-icon">
                                            <Icon size={25} />
                                        </div>

                                        <div className="experience-content">
                                            <h3>{item.title}</h3>
                                            <p>{item.description}</p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

export default AboutEvent;
