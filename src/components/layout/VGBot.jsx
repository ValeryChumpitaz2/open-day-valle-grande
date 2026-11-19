
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  X,
  Send,
  CalendarDays,
  MapPin,
  GraduationCap,
  Sparkles,
  ClipboardList,
} from "lucide-react";

import "./VGBot.css";

const preguntasFrecuentes = [
  {
    texto: "Fecha del evento",
    icono: CalendarDays,
    respuesta:
      "El Open Day 2026 de Valle Grande se realizará el sábado 12 de diciembre de 2026, desde las 9:00 a. m. ¡Te esperamos!",
  },
  {
    texto: "¿Dónde se realizará?",
    icono: MapPin,
    respuesta:
      "El evento se realizará en el campus de Valle Grande, ubicado en Cañete. Será una excelente oportunidad para conocer nuestras instalaciones.",
  },
  {
    texto: "Conocer las carreras",
    icono: GraduationCap,
    respuesta:
      "Durante el Open Day podrás conocer nuestra oferta académica, descubrir las carreras y conversar sobre las oportunidades de formación que ofrece Valle Grande.",
  },
  {
    texto: "Actividades del evento",
    icono: Sparkles,
    respuesta:
      "Podrás conocer proyectos digitales, recorrer nuestro campus y participar en juegos y experiencias interactivas. ¡Tendremos actividades para disfrutar y aprender!",
  },
];

const normalizar = (texto) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const obtenerRespuesta = (mensaje) => {
  const texto = normalizar(mensaje);

  if (
    texto.includes("fecha") ||
    texto.includes("cuando") ||
    texto.includes("hora") ||
    texto.includes("dia") ||
    texto.includes("evento")
  ) {
    return preguntasFrecuentes[0].respuesta;
  }

  if (
    texto.includes("donde") ||
    texto.includes("ubicacion") ||
    texto.includes("direccion") ||
    texto.includes("campus") ||
    texto.includes("lugar")
  ) {
    return preguntasFrecuentes[1].respuesta;
  }

  if (
    texto.includes("carrera") ||
    texto.includes("estudiar") ||
    texto.includes("programa") ||
    texto.includes("academica") ||
    texto.includes("oferta")
  ) {
    return preguntasFrecuentes[2].respuesta;
  }

  if (
    texto.includes("actividad") ||
    texto.includes("juego") ||
    texto.includes("experiencia") ||
    texto.includes("proyecto")
  ) {
    return preguntasFrecuentes[3].respuesta;
  }

  if (
    texto.includes("inscripcion") ||
    texto.includes("inscribirme") ||
    texto.includes("registrarme") ||
    texto.includes("registro") ||
    texto.includes("formulario")
  ) {
    return "Puedes inscribirte completando el formulario de registro disponible en nuestra página web. Ingresa tus datos y envía tu inscripción para participar en el Open Day.";
  }

  if (
    texto.includes("costo") ||
    texto.includes("precio") ||
    texto.includes("gratis")
  ) {
    return "Para conocer los detalles sobre los costos o condiciones de participación, te recomendamos consultar directamente con el equipo organizador de Valle Grande.";
  }

  if (
    texto.includes("hola") ||
    texto.includes("buenos dias") ||
    texto.includes("buenas tardes") ||
    texto.includes("buenas noches")
  ) {
    return "¡Hola! Me alegra saludarte. 😊 Estoy aquí para ayudarte a conocer el Open Day 2026 de Valle Grande.";
  }

  if (texto.includes("gracias")) {
    return "¡Con mucho gusto! 😊 Será un placer ayudarte. ¡Esperamos verte en nuestro Open Day!";
  }

  return "¡Gracias por tu pregunta! Por el momento no tengo información específica sobre ese tema. Puedo ayudarte con información sobre la fecha, ubicación, carreras, actividades e inscripción.";
};

export default function VGBot() {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);

  const [conversacion, setConversacion] = useState([
    {
      tipo: "bot",
      texto:
        "¡Hola! Soy VG Bot, el asistente virtual de Valle Grande. 👋\n\nEstoy aquí para ayudarte a conocer nuestro Open Day 2026. ¿Qué te gustaría saber?",
    },
  ]);

  const mensajesRef = useRef(null);
  const inputRef = useRef(null);
  const colaRef = useRef([]);
  const procesandoRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTo({
        top: mensajesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [conversacion, escribiendo]);

  useEffect(() => {
    if (abierto) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [abierto]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const procesarCola = () => {
    if (procesandoRef.current) return;

    const siguiente = colaRef.current.shift();

    if (!siguiente) {
      setEscribiendo(false);
      return;
    }

    procesandoRef.current = true;
    setEscribiendo(true);

    timerRef.current = setTimeout(() => {
      setConversacion((anterior) => [
        ...anterior,
        {
          tipo: "bot",
          texto:
            siguiente.respuesta +
            "\n\n¿Te gustaría saber algo más? Estoy aquí para ayudarte. 😊",
        },
      ]);

      procesandoRef.current = false;
      procesarCola();
    }, 650);
  };

  const enviarMensaje = (texto, respuestaPersonalizada = null) => {
    const contenido = texto.trim();

    if (!contenido) return;

    setConversacion((anterior) => [
      ...anterior,
      {
        tipo: "usuario",
        texto: contenido,
      },
    ]);

    setMensaje("");

    colaRef.current.push({
      respuesta:
        respuestaPersonalizada || obtenerRespuesta(contenido),
    });

    procesarCola();
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    enviarMensaje(mensaje);
  };

  const irAInscripcion = () => {
    const formulario =
      document.getElementById("inscripcion") ||
      document.getElementById("registro");

    if (formulario) {
      setAbierto(false);

      setTimeout(() => {
        formulario.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } else {
      enviarMensaje(
        "¿Cómo puedo inscribirme?",
        "Puedes completar el formulario de inscripción disponible en nuestra página web. Si no lo encuentras, revisa la sección de registro."
      );
    }
  };

  return (
    <div className="vg-bot-container">

      {!abierto && (
        <button
          className="vg-bot-trigger"
          onClick={() => setAbierto(true)}
          aria-label="Abrir asistente virtual"
        >
          <Bot size={27} />
          <span className="vg-bot-online"></span>
        </button>
      )}

      {abierto && (
        <section className="vg-chat-window">

          {/* Encabezado */}
          <header className="vg-chat-header">
            <div className="vg-chat-brand">
              <div className="vg-chat-avatar">
                <Bot size={23} />
              </div>

              <div>
                <h3>VG Bot</h3>
                <p>
                  <span className="vg-status-dot"></span>
                  Asistente virtual de Valle Grande
                </p>
              </div>
            </div>

            <button
              className="vg-chat-close"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
            >
              <X size={19} />
            </button>
          </header>

          {/* Conversación */}
          <div
            className="vg-chat-messages"
            ref={mensajesRef}
          >
            <div className="vg-chat-date">
              OPEN DAY 2026
            </div>

            {conversacion.map((item, index) => (
              <div
                key={index}
                className={`vg-message ${
                  item.tipo === "usuario"
                    ? "vg-message-user"
                    : "vg-message-bot"
                }`}
              >
                {item.tipo === "bot" && (
                  <div className="vg-message-avatar">
                    <Bot size={16} />
                  </div>
                )}

                <div className="vg-message-content">
                  {item.texto}
                </div>
              </div>
            ))}

            {escribiendo && (
              <div className="vg-message vg-message-bot">
                <div className="vg-message-avatar">
                  <Bot size={16} />
                </div>

                <div className="vg-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {/* Sugerencias para continuar */}
            {!escribiendo && (
              <div className="vg-suggestions">
                <p>También puedes consultar:</p>

                <div className="vg-suggestions-list">
                  {preguntasFrecuentes.map((pregunta, index) => {
                    const Icono = pregunta.icono;

                    return (
                      <button
                        key={index}
                        onClick={() =>
                          enviarMensaje(
                            pregunta.texto,
                            pregunta.respuesta
                          )
                        }
                      >
                        <Icono size={14} />
                        {pregunta.texto}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Inscripción secundaria */}
          <div className="vg-chat-register">
            <button onClick={irAInscripcion}>
              <ClipboardList size={15} />
              Quiero inscribirme
            </button>
          </div>

          {/* Entrada de texto */}
          <form
            className="vg-chat-input"
            onSubmit={manejarEnvio}
          >
            <input
              ref={inputRef}
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu pregunta..."
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={!mensaje.trim()}
              aria-label="Enviar pregunta"
            >
              <Send size={17} />
            </button>
          </form>

          <footer className="vg-chat-footer">
            Valle Grande · Open Day 2026
          </footer>

        </section>
      )}
    </div>
  );
}
