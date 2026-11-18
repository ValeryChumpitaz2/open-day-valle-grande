
import { useState } from 'react';
import {
  UserRound,
  GraduationCap,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  LoaderCircle
} from 'lucide-react';

import './RegistrationForm.css';
import API_URL from '../../config/api';
// Distritos de la provincia de Cañete
const DISTRITOS_CANETE = [
  'Asia',
  'Calango',
  'Cerro Azul',
  'Chilca',
  'Coayllo',
  'Imperial',
  'Lunahuaná',
  'Mala',
  'Nuevo Imperial',
  'Pacarán',
  'Quilmaná',
  'San Antonio',
  'San Luis',
  'San Vicente de Cañete',
  'Santa Cruz de Flores',
  'Zúñiga'
];

function RegistrationForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    tipoVisitante: '',
    celular: '',
    correo: '',
    colegio: '',
    grado: '',
    distrito: '',
    asistentes: ''
  });

  const [cargando, setCargando] = useState(false);

  const [mensaje, setMensaje] = useState({
    tipo: '',
    texto: ''
  });

  const esEstudiante = formData.tipoVisitante === 'Estudiante';

  // Actualizar los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'tipoVisitante' && value !== 'Estudiante'
        ? { colegio: '', grado: '' }
        : {})
    }));

    setMensaje({
      tipo: '',
      texto: ''
    });
  };

  // Registrar inscripción
  const handleSubmit = async (e) => {
    e.preventDefault();

    setCargando(true);
    setMensaje({
      tipo: '',
      texto: ''
    });

    try {
      const respuesta = await fetch(
        `${API_URL}/inscripciones.php`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain'
          },
          body: JSON.stringify(formData)
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.success) {
        throw new Error(
          resultado.message || 'No se pudo registrar la inscripción.'
        );
      }

      setMensaje({
        tipo: 'success',
        texto: '¡Inscripción registrada correctamente! Te esperamos en Valle Grande.'
      });

      // Limpiar formulario después del registro
      setFormData({
        nombre: '',
        tipoVisitante: '',
        celular: '',
        correo: '',
        colegio: '',
        grado: '',
        distrito: '',
        asistentes: ''
      });

    } catch (error) {
      console.error('Error al registrar:', error);

      setMensaje({
        tipo: 'error',
        texto: error.message === 'Failed to fetch'
          ? 'No se pudo conectar con el servidor. Verifica que Docker esté funcionando.'
          : error.message
      });

    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="registration-section" id="inscripcion">
      <div className="container">

        {/* Encabezado */}
        <div className="registration-heading">
          <span>OPEN DAY 2026</span>
          <h2>¡Inscríbete y vive la experiencia!</h2>
          <p>
            Completa tus datos y reserva tu participación.
            ¡Nos encantará recibirte en Valle Grande!
          </p>
        </div>

        {/* Formulario */}
        <div className="registration-card">
          <form onSubmit={handleSubmit}>

            {/* Datos del visitante */}
            <div className="form-section-heading">
              <UserRound size={21} />
              <h3>Datos del visitante</h3>
            </div>

            <div className="row">

              <div className="col-md-6 registration-field">
                <label htmlFor="nombre">
                  Nombres y apellidos *
                </label>

                <input
                  type="text"
                  id="nombre"
                  className="form-control"
                  name="nombre"
                  placeholder="Ingresa tus nombres completos"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6 registration-field">
                <label htmlFor="tipoVisitante">
                  ¿Quién realiza el registro? *
                </label>

                <select
                  id="tipoVisitante"
                  className="form-select"
                  name="tipoVisitante"
                  value={formData.tipoVisitante}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Estudiante">Estudiante</option>
                  <option value="Padre o madre">Padre o madre</option>
                  <option value="Tutor">Tutor</option>
                  <option value="Otro familiar">Otro familiar</option>
                </select>
              </div>

              <div className="col-md-6 registration-field">
                <label htmlFor="celular">
                  Celular / WhatsApp *
                </label>

                <input
                  type="tel"
                  id="celular"
                  className="form-control"
                  name="celular"
                  placeholder="Número de celular"
                  value={formData.celular}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6 registration-field">
                <label htmlFor="correo">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  id="correo"
                  className="form-control"
                  name="correo"
                  placeholder="ejemplo@correo.com"
                  value={formData.correo}
                  onChange={handleChange}
                />
              </div>

            </div>

            {/* Información académica */}
            {esEstudiante && (
              <div className="student-fields">

                <div className="form-section-heading">
                  <GraduationCap size={21} />
                  <h3>Información académica</h3>
                </div>

                <div className="row">

                  <div className="col-md-6 registration-field">
                    <label htmlFor="colegio">
                      Colegio *
                    </label>

                    <input
                      type="text"
                      id="colegio"
                      className="form-control"
                      name="colegio"
                      placeholder="Nombre de tu colegio"
                      value={formData.colegio}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 registration-field">
                    <label htmlFor="grado">
                      Grado *
                    </label>

                    <select
                      id="grado"
                      className="form-select"
                      name="grado"
                      value={formData.grado}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecciona tu grado</option>
                      <option value="3.º de secundaria">
                        3.º de secundaria
                      </option>
                      <option value="4.º de secundaria">
                        4.º de secundaria
                      </option>
                      <option value="5.º de secundaria">
                        5.º de secundaria
                      </option>
                      <option value="Egresado">
                        Egresado
                      </option>
                    </select>
                  </div>

                </div>
              </div>
            )}

            {/* Procedencia y asistencia */}
            <div className="form-section-heading">
              <MapPin size={21} />
              <h3>Datos de procedencia y asistencia</h3>
            </div>

            <div className="row">

              <div className="col-md-6 registration-field">
                <label htmlFor="distrito">
                  Distrito de procedencia *
                </label>

                <select
                  id="distrito"
                  className="form-select"
                  name="distrito"
                  value={formData.distrito}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Selecciona tu distrito
                  </option>

                  {DISTRITOS_CANETE.map((distrito) => (
                    <option key={distrito} value={distrito}>
                      {distrito}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 registration-field">
                <label htmlFor="asistentes">
                  Personas que asistirán, incluyéndote *
                </label>

                <select
                  id="asistentes"
                  className="form-select"
                  name="asistentes"
                  value={formData.asistentes}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="1">1 persona</option>
                  <option value="2">2 personas</option>
                  <option value="3">3 personas</option>
                  <option value="4">4 personas</option>
                  <option value="5 o más">5 o más personas</option>
                </select>
              </div>

            </div>

            {/* Mensajes de respuesta */}
            {mensaje.texto && (
              <div
                className={`registration-message ${mensaje.tipo}`}
                role="alert"
              >
                {mensaje.tipo === 'success'
                  ? <CheckCircle2 size={20} />
                  : <AlertCircle size={20} />
                }

                <span>{mensaje.texto}</span>
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              className="registration-submit"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  Registrando...
                  <LoaderCircle
                    size={18}
                    className="spin-icon"
                  />
                </>
              ) : (
                <>
                  Confirmar inscripción
                  <Send size={18} />
                </>
              )}
            </button>

            <p className="registration-privacy">
              * Los campos marcados son obligatorios.
            </p>

          </form>
        </div>
      </div>
    </section>
  );
}

export default RegistrationForm;
