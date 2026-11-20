import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ArrowLeft,
  LoaderCircle,
  ArrowRight
} from "lucide-react";

import "./Login.css";
import API_URL from "../config/api";

function Login() {
  const navigate = useNavigate();

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // INICIO DE SESIÓN
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setCargando(true);

    try {
      const response = await fetch(`${API_URL}/login.php`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          correo: correo.trim(),
          password
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "No se pudo iniciar sesión."
        );
      }

      // GUARDAR DATOS DEL ADMINISTRADOR
      sessionStorage.setItem(
        "administrador",
        JSON.stringify(data.administrador)
      );

      // REDIRIGIR AL DASHBOARD
      navigate("/dashboard");

    } catch (err) {
      console.error("Error en el inicio de sesión:", err);

      if (err instanceof TypeError) {
        setError(
          "No se pudo conectar con el servidor. Verifica tu conexión e inténtalo nuevamente."
        );
      } else {
        setError(
          err.message || "Ocurrió un error al iniciar sesión."
        );
      }

    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="login-page">

      <Link to="/" className="login-back">
        <ArrowLeft size={18} />
        <span>Volver al sitio web</span>
      </Link>

      <div className="login-container">

        {/* PANEL FOTOGRÁFICO */}
        <section className="login-image-panel">

          <img
            src="/images/logo.png"
            alt="Estudiantes de Valle Grande"
            className="login-background-image"
          />

          <div className="login-image-overlay"></div>

          <div className="login-image-content">

            <div className="login-brand">
              <img
                src="/images/logo-valle-grande.png"
                alt="Logo Valle Grande"
              />
            </div>

            <div className="login-image-message">

              <span className="login-tag">
                OPEN DAY 2026 · 12 DE DICIEMBRE
              </span>

              <h1>
                Tu futuro
                <br />
                comienza aquí.
              </h1>

              <p>
                Una experiencia para descubrir nuevas oportunidades,
                conocer nuestras carreras y construir el camino hacia
                tu futuro profesional.
              </p>

            </div>

            <div className="login-image-footer">
              <span>
                FORMANDO PERSONAS, TRANSFORMANDO VIDAS
              </span>

              <span>
                VALLE GRANDE · 2026
              </span>
            </div>

          </div>
        </section>

        {/* PANEL DE ACCESO */}
        <section className="login-form-panel">

          <div className="login-form-content">

            <div className="login-form-heading">

              <div className="login-icon">
                <ShieldCheck size={25} />
              </div>

              <span className="login-eyebrow">
                SISTEMA DE GESTIÓN
              </span>

              <h2>
                Acceso administrativo
              </h2>

              <p>
                Bienvenido. Ingresa tus credenciales para
                administrar las inscripciones del Open Day.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="login-form"
            >

              {/* CORREO ELECTRÓNICO */}
              <div className="login-field">

                <label htmlFor="correo">
                  Correo electrónico
                </label>

                <div className="login-input-wrapper">

                  <Mail size={19} />

                  <input
                    id="correo"
                    type="email"
                    placeholder="nombre@vallegrande.edu.pe"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    autoComplete="username"
                    required
                  />

                </div>
              </div>

              {/* CONTRASEÑA */}
              <div className="login-field">

                <label htmlFor="password">
                  Contraseña
                </label>

                <div className="login-input-wrapper">

                  <LockKeyhole size={19} />

                  <input
                    id="password"
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() =>
                      setMostrarPassword(!mostrarPassword)
                    }
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {mostrarPassword
                      ? <EyeOff size={19} />
                      : <Eye size={19} />
                    }
                  </button>

                </div>
              </div>

              {/* MENSAJE DE ERROR */}
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              {/* BOTÓN DE INGRESO */}
              <button
                type="submit"
                className="login-button"
                disabled={cargando}
              >

                {cargando ? (
                  <>
                    <LoaderCircle
                      className="login-spinner"
                      size={19}
                    />
                    Verificando acceso...
                  </>
                ) : (
                  <>
                    Ingresar al panel
                    <ArrowRight size={19} />
                  </>
                )}

              </button>

            </form>

            {/* SEGURIDAD */}
            <div className="login-security">
              <ShieldCheck size={18} />

              <span>
                Acceso exclusivo para personal autorizado
              </span>
            </div>

          </div>

          <footer className="login-footer">
            © 2026 Valle Grande. Todos los derechos reservados.
          </footer>

        </section>

      </div>
    </main>
  );
}

export default Login;
