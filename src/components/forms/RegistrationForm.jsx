
import { useEffect, useState } from 'react';
import {
    UserRound,
    GraduationCap,
    MapPin,
    Send,
    CheckCircle2,
    AlertCircle,
    LoaderCircle,
    CalendarDays
} from 'lucide-react';

import './RegistrationForm.css';
import API_URL from '../../config/api';

const UBIGEO_API =
    'https://jmc-software-x.github.io/public-ubigeo-pe/data';

const INITIAL_FORM = {
    nombres: '',
    apellidos: '',
    tipoVisitante: '',
    celular: '',
    correo: '',
    colegio: '',
    grado: '',
    departamento: '',
    provincia: '',
    distrito: '',
    asistentes: ''
};

const validarNombre = (valor) =>
    /^[\p{L}\s'-]+$/u.test(valor.trim()) && valor.trim().length >= 2;

function RegistrationForm() {
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [errores, setErrores] = useState({});
    const [touched, setTouched] = useState({});
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    const [ubicacion, setUbicacion] = useState({
        departamentoId: '',
        provinciaId: '',
        distritoId: ''
    });

    const [cargandoUbigeo, setCargandoUbigeo] = useState(true);
    const [cargando, setCargando] = useState(false);
    const [errorUbigeo, setErrorUbigeo] = useState('');

    const [mensaje, setMensaje] = useState({
        tipo: '',
        texto: ''
    });

    const esEstudiante = formData.tipoVisitante === 'Estudiante';

    // Cargar departamentos
    useEffect(() => {
        const cargarDepartamentos = async () => {
            try {
                setCargandoUbigeo(true);
                setErrorUbigeo('');

                const respuesta = await fetch(
                    `${UBIGEO_API}/hierarchy.json`
                );

                if (!respuesta.ok) {
                    throw new Error(`Error HTTP ${respuesta.status}`);
                }

                const datos = await respuesta.json();

                if (!Array.isArray(datos)) {
                    throw new Error('El catálogo recibido no es una lista.');
                }

                setDepartamentos(datos);
            } catch (error) {
                console.error('Error cargando departamentos:', error);
                setErrorUbigeo(
                    'No se pudieron cargar las ubicaciones. Recarga la página.'
                );
            } finally {
                setCargandoUbigeo(false);
            }
        };

        cargarDepartamentos();
    }, []);

    // Validar formulario
    const validarFormulario = (datos) => {
        const erroresNuevos = {};

        if (!validarNombre(datos.nombres)) {
            erroresNuevos.nombres = 'Ingresa tus nombres correctamente.';
        }

        if (!validarNombre(datos.apellidos)) {
            erroresNuevos.apellidos = 'Ingresa tus apellidos correctamente.';
        }

        if (!datos.tipoVisitante) {
            erroresNuevos.tipoVisitante = 'Selecciona quién realiza el registro.';
        }

        if (!/^9\d{8}$/.test(datos.celular)) {
            erroresNuevos.celular = 'Ingresa un celular válido de 9 dígitos.';
        }

        if (
            datos.correo.trim() &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())
        ) {
            erroresNuevos.correo = 'Ingresa un correo electrónico válido.';
        }

        if (datos.tipoVisitante === 'Estudiante') {
            if (datos.colegio.trim().length < 2) {
                erroresNuevos.colegio = 'Ingresa el nombre de tu colegio.';
            }

            if (!datos.grado) {
                erroresNuevos.grado = 'Selecciona tu grado.';
            }
        }

        if (!datos.departamento) {
            erroresNuevos.departamento = 'Selecciona un departamento.';
        }

        if (!datos.provincia) {
            erroresNuevos.provincia = 'Selecciona una provincia.';
        }

        if (!datos.distrito) {
            erroresNuevos.distrito = 'Selecciona un distrito.';
        }

        if (!datos.asistentes) {
            erroresNuevos.asistentes = 'Selecciona cuántas personas asistirán.';
        }

        return erroresNuevos;
    };

    // Actualizar campos normales
    const handleChange = (e) => {
        const { name } = e.target;
        let { value } = e.target;

        if (name === 'celular') {
            value = value.replace(/\D/g, '').slice(0, 9);
        }

        setFormData((prev) => {
            const actualizado = { ...prev, [name]: value };

            if (name === 'tipoVisitante' && value !== 'Estudiante') {
                actualizado.colegio = '';
                actualizado.grado = '';
            }

            return actualizado;
        });

        setMensaje({ tipo: '', texto: '' });

        if (touched[name]) {
            setErrores((prev) => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Cargar provincias
    const handleDepartamento = async (e) => {
        const id = e.target.value;
        const seleccionado = departamentos.find((item) => item.id === id);

        setUbicacion({
            departamentoId: id,
            provinciaId: '',
            distritoId: ''
        });

        setProvincias([]);
        setDistritos([]);

        setFormData((prev) => ({
            ...prev,
            departamento: seleccionado?.name || '',
            provincia: '',
            distrito: ''
        }));

        setMensaje({ tipo: '', texto: '' });

        if (!id) return;

        try {
            setCargandoUbigeo(true);
            setErrorUbigeo('');

            const respuesta = await fetch(
                `${UBIGEO_API}/departments/${id}.json`
            );

            if (!respuesta.ok) {
                throw new Error(`Error HTTP ${respuesta.status}`);
            }

            const datos = await respuesta.json();

            if (!Array.isArray(datos.provinces)) {
                throw new Error('No se encontró la lista de provincias.');
            }

            setProvincias(datos.provinces);
        } catch (error) {
            console.error('Error cargando provincias:', error);
            setErrorUbigeo('No se pudieron cargar las provincias.');
        } finally {
            setCargandoUbigeo(false);
        }
    };

    // Cargar distritos
    const handleProvincia = async (e) => {
        const id = e.target.value;
        const seleccionada = provincias.find((item) => item.id === id);

        setUbicacion((prev) => ({
            ...prev,
            provinciaId: id,
            distritoId: ''
        }));

        setDistritos([]);

        setFormData((prev) => ({
            ...prev,
            provincia: seleccionada?.name || '',
            distrito: ''
        }));

        setMensaje({ tipo: '', texto: '' });

        if (!id) return;

        try {
            setCargandoUbigeo(true);
            setErrorUbigeo('');

            const respuesta = await fetch(
                `${UBIGEO_API}/provinces/${id}.json`
            );

            if (!respuesta.ok) {
                throw new Error(`Error HTTP ${respuesta.status}`);
            }

            const datos = await respuesta.json();

            if (!Array.isArray(datos.districts)) {
                throw new Error('No se encontró la lista de distritos.');
            }

            setDistritos(datos.districts);
        } catch (error) {
            console.error('Error cargando distritos:', error);
            setErrorUbigeo('No se pudieron cargar los distritos.');
        } finally {
            setCargandoUbigeo(false);
        }
    };

    // Seleccionar distrito
    const handleDistrito = (e) => {
        const id = e.target.value;
        const seleccionado = distritos.find((item) => item.id === id);

        setUbicacion((prev) => ({
            ...prev,
            distritoId: id
        }));

        setFormData((prev) => ({
            ...prev,
            distrito: seleccionado?.name || ''
        }));

        setMensaje({ tipo: '', texto: '' });
    };

    // Validar al salir del campo
    const handleBlur = (e) => {
        const { name } = e.target;

        setTouched((prev) => ({
            ...prev,
            [name]: true
        }));

        const nuevosErrores = validarFormulario(formData);

        setErrores((prev) => ({
            ...prev,
            [name]: nuevosErrores[name] || ''
        }));
    };

    // Enviar formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cargando) return;

        const nuevosErrores = validarFormulario(formData);

        setErrores(nuevosErrores);
        setTouched(
            Object.keys(INITIAL_FORM).reduce((objeto, campo) => {
                objeto[campo] = true;
                return objeto;
            }, {})
        );

        if (Object.keys(nuevosErrores).length > 0) {
            setMensaje({
                tipo: 'error',
                texto: 'Revisa los campos señalados antes de continuar.'
            });
            return;
        }

        setCargando(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            const respuesta = await fetch(`${API_URL}/inscripciones.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    ...formData,
                    nombres: formData.nombres.trim(),
                    apellidos: formData.apellidos.trim(),
                    correo: formData.correo.trim(),
                    colegio: formData.colegio.trim()
                })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok || !resultado.success) {
                throw new Error(
                    resultado.message || 'No se pudo registrar la inscripción.'
                );
            }

            setMensaje({
                tipo: 'success',
                texto: '¡Tu inscripción se registró correctamente! Te esperamos en Valle Grande.'
            });

            setFormData(INITIAL_FORM);
            setErrores({});
            setTouched({});
            setProvincias([]);
            setDistritos([]);

            setUbicacion({
                departamentoId: '',
                provinciaId: '',
                distritoId: ''
            });
        } catch (error) {
            console.error('Error de inscripción:', error);

            setMensaje({
                tipo: 'error',
                texto: error.message === 'Failed to fetch'
                    ? 'No se pudo conectar con el servidor. Inténtalo nuevamente.'
                    : error.message
            });
        } finally {
            setCargando(false);
        }
    };

    const errorVisible = (campo) =>
        touched[campo] && errores[campo];

    const claseCampo = (campo) =>
        `registration-control ${
            errorVisible(campo) ? 'invalid' : ''
        }`;

    return (
        <section className="registration-section" id="inscripcion">
            <div className="registration-layout">

                {/* IMAGEN INSTITUCIONAL */}
                <aside className="registration-visual">
                    <img
                        src="/images/open-day-inscripcion.png"
                        alt="Estudiantes y campus de Valle Grande"
                        className="registration-visual-image"
                    />

                    <div className="registration-visual-shade"></div>

                    <div className="registration-visual-content">
                        <span className="registration-eyebrow">
                            <CalendarDays size={14} />
                            OPEN DAY 2026
                        </span>

                        <h2>
                            Descubre.
                            <br />
                            Explora.
                            <br />
                            Construye tu futuro.
                        </h2>

                        <p>
                            Conoce nuestras carreras, descubre el campus
                            y vive una experiencia que puede cambiar tu futuro.
                        </p>

                        <div className="registration-visual-footer">
                            <span></span>
                            <small>VALLE GRANDE</small>
                        </div>
                    </div>
                </aside>

                {/* FORMULARIO */}
                <div className="registration-content">
                    <header className="registration-header">
                        <span className="registration-kicker">
                            RESERVA TU PARTICIPACIÓN
                        </span>

                        <h2>¡Inscríbete al Open Day!</h2>

                        <p>
                            Completa tus datos para reservar tu visita.
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} noValidate>

                        {/* DATOS PERSONALES */}
                        <div className="registration-section-title">
                            <span className="registration-section-icon">
                                <UserRound size={17} />
                            </span>
                            <h3>Datos del visitante</h3>
                        </div>

                        <div className="registration-grid">
                            <div className="registration-field">
                                <label htmlFor="nombres">Nombres *</label>
                                <input
                                    id="nombres"
                                    name="nombres"
                                    type="text"
                                    className={claseCampo('nombres')}
                                    placeholder="Ingresa tus nombres"
                                    value={formData.nombres}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="given-name"
                                    maxLength={150}
                                />
                                {errorVisible('nombres') && (
                                    <small className="field-error">{errores.nombres}</small>
                                )}
                            </div>

                            <div className="registration-field">
                                <label htmlFor="apellidos">Apellidos *</label>
                                <input
                                    id="apellidos"
                                    name="apellidos"
                                    type="text"
                                    className={claseCampo('apellidos')}
                                    placeholder="Ingresa tus apellidos"
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="family-name"
                                    maxLength={150}
                                />
                                {errorVisible('apellidos') && (
                                    <small className="field-error">{errores.apellidos}</small>
                                )}
                            </div>

                            <div className="registration-field">
                                <label htmlFor="tipoVisitante">¿Quién realiza el registro? *</label>
                                <select
                                    id="tipoVisitante"
                                    name="tipoVisitante"
                                    className={claseCampo('tipoVisitante')}
                                    value={formData.tipoVisitante}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                >
                                    <option value="">Selecciona una opción</option>
                                    <option value="Estudiante">Estudiante</option>
                                    <option value="Padre o madre">Padre o madre</option>
                                    <option value="Tutor">Tutor</option>
                                    <option value="Otro familiar">Otro familiar</option>
                                </select>
                                {errorVisible('tipoVisitante') && (
                                    <small className="field-error">{errores.tipoVisitante}</small>
                                )}
                            </div>

                            <div className="registration-field">
                                <label htmlFor="celular">Celular / WhatsApp *</label>
                                <input
                                    id="celular"
                                    name="celular"
                                    type="tel"
                                    inputMode="numeric"
                                    className={claseCampo('celular')}
                                    placeholder="987 654 321"
                                    value={formData.celular}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="tel"
                                    maxLength={9}
                                />
                                {errorVisible('celular') && (
                                    <small className="field-error">{errores.celular}</small>
                                )}
                            </div>

                            <div className="registration-field registration-full">
                                <label htmlFor="correo">Correo electrónico <span>(opcional)</span></label>
                                <input
                                    id="correo"
                                    name="correo"
                                    type="email"
                                    className={claseCampo('correo')}
                                    placeholder="ejemplo@correo.com"
                                    value={formData.correo}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    autoComplete="email"
                                    maxLength={150}
                                />
                                {errorVisible('correo') && (
                                    <small className="field-error">{errores.correo}</small>
                                )}
                            </div>
                        </div>

                        {/* DATOS DEL ESTUDIANTE */}
                        {esEstudiante && (
                            <div className="registration-academic">
                                <div className="registration-section-title">
                                    <span className="registration-section-icon">
                                        <GraduationCap size={17} />
                                    </span>
                                    <h3>Información académica</h3>
                                </div>

                                <div className="registration-grid">
                                    <div className="registration-field">
                                        <label htmlFor="colegio">Nombre del colegio *</label>
                                        <input
                                            id="colegio"
                                            name="colegio"
                                            type="text"
                                            className={claseCampo('colegio')}
                                            placeholder="Ingresa tu colegio"
                                            value={formData.colegio}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            maxLength={150}
                                        />
                                        {errorVisible('colegio') && (
                                            <small className="field-error">{errores.colegio}</small>
                                        )}
                                    </div>

                                    <div className="registration-field">
                                        <label htmlFor="grado">Grado de estudios *</label>
                                        <select
                                            id="grado"
                                            name="grado"
                                            className={claseCampo('grado')}
                                            value={formData.grado}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        >
                                            <option value="">Selecciona tu grado</option>
                                            <option value="3.º de secundaria">3.º de secundaria</option>
                                            <option value="4.º de secundaria">4.º de secundaria</option>
                                            <option value="5.º de secundaria">5.º de secundaria</option>
                                            <option value="Egresado">Egresado</option>
                                        </select>
                                        {errorVisible('grado') && (
                                            <small className="field-error">{errores.grado}</small>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PROCEDENCIA */}
                        <div className="registration-section-title registration-location-title">
                            <span className="registration-section-icon">
                                <MapPin size={17} />
                            </span>
                            <h3>Procedencia y asistencia</h3>
                        </div>

                        <div className="registration-location-grid">
                            <div className="registration-field">
                                <label htmlFor="departamento">Departamento *</label>
                                <select
                                    id="departamento"
                                    name="departamento"
                                    className={claseCampo('departamento')}
                                    value={ubicacion.departamentoId}
                                    onChange={handleDepartamento}
                                    onBlur={handleBlur}
                                    disabled={cargandoUbigeo}
                                >
                                    <option value="">
                                        {cargandoUbigeo ? 'Cargando...' : 'Selecciona'}
                                    </option>
                                    {departamentos.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                {errorVisible('departamento') && (
                                    <small className="field-error">{errores.departamento}</small>
                                )}
                            </div>

                            <div className="registration-field">
                                <label htmlFor="provincia">Provincia *</label>
                                <select
                                    id="provincia"
                                    name="provincia"
                                    className={claseCampo('provincia')}
                                    value={ubicacion.provinciaId}
                                    onChange={handleProvincia}
                                    onBlur={handleBlur}
                                    disabled={!ubicacion.departamentoId || cargandoUbigeo}
                                >
                                    <option value="">Selecciona</option>
                                    {provincias.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                {errorVisible('provincia') && (
                                    <small className="field-error">{errores.provincia}</small>
                                )}
                            </div>

                            <div className="registration-field">
                                <label htmlFor="distrito">Distrito *</label>
                                <select
                                    id="distrito"
                                    name="distrito"
                                    className={claseCampo('distrito')}
                                    value={ubicacion.distritoId}
                                    onChange={handleDistrito}
                                    onBlur={handleBlur}
                                    disabled={!ubicacion.provinciaId || cargandoUbigeo}
                                >
                                    <option value="">Selecciona</option>
                                    {distritos.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                {errorVisible('distrito') && (
                                    <small className="field-error">{errores.distrito}</small>
                                )}
                            </div>

                            <div className="registration-field registration-full">
                                <label htmlFor="asistentes">
                                    Personas que asistirán, incluyéndote *
                                </label>
                                <select
                                    id="asistentes"
                                    name="asistentes"
                                    className={claseCampo('asistentes')}
                                    value={formData.asistentes}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                >
                                    <option value="">Selecciona una opción</option>
                                    <option value="1">1 persona</option>
                                    <option value="2">2 personas</option>
                                    <option value="3">3 personas</option>
                                    <option value="4">4 personas</option>
                                    <option value="5 o más">5 o más personas</option>
                                </select>
                                {errorVisible('asistentes') && (
                                    <small className="field-error">{errores.asistentes}</small>
                                )}
                            </div>
                        </div>

                        {errorUbigeo && (
                            <div className="registration-ubigeo-error">
                                <AlertCircle size={15} />
                                {errorUbigeo}
                            </div>
                        )}

                        {/* MENSAJES */}
                        {mensaje.texto && (
                            <div className={`registration-message ${mensaje.tipo}`} role="alert">
                                {mensaje.tipo === 'success'
                                    ? <CheckCircle2 size={18} />
                                    : <AlertCircle size={18} />
                                }
                                <span>{mensaje.texto}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="registration-submit"
                            disabled={cargando || cargandoUbigeo}
                        >
                            {cargando ? (
                                <>
                                    Registrando inscripción
                                    <LoaderCircle size={17} className="registration-spin" />
                                </>
                            ) : (
                                <>
                                    Confirmar inscripción
                                    <Send size={16} />
                                </>
                            )}
                        </button>

                        <p className="registration-note">
                            * Los campos marcados son obligatorios.
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
}

export default RegistrationForm;
