
import { useEffect, useRef, useState } from "react";
import {
  Bot,
  X,
  Send,
  CalendarDays,
  MapPin,
  GraduationCap,
  ClipboardList,
  MessageCircle,
  Sparkles,
  ChevronDown,
} from "lucide-react";

import "./VGBot.css";

const preguntasFrecuentes = [
  {
    texto: "Información del evento",
    icono: CalendarDays,
    respuesta:
      "¡Claro! El Open Day 2026 de Valle Grande se realizará el sábado 12 de diciembre de 2026, desde las 9:00 a. m. ¡Te esperamos!",
  },
  {
    texto: "¿Dónde se realizará?",
    icono: MapPin,
    respuesta:
      "El evento se realizará en las instalaciones de Valle Grande. ¡Será una excelente oportunidad para conocer nuestro campus!",
  },
  {
    texto: "Quiero conocer las carreras",
    icono: GraduationCap,
    respuesta:
      "¡Excelente! Durante el Open Day podrás conocer nuestra propuesta educativa y recibir información sobre las carreras. También puedes revisar la sección de carreras de nuestra página.",
  },
  {
    texto: "¿Cómo me inscribo?",
    icono: ClipboardList,
    respuesta:
      "¡Es muy sencillo! Dirígete al formulario de inscripción de esta página, completa tus datos y registra tu participación. ¡Te esperamos!",
  },
];

const obtenerRespuesta = (mensaje) => {
  const texto = mensaje.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (
    texto.includes("fecha") ||
    texto.includes("cuando") ||
    texto.includes("dia") ||
    texto.includes("horario") ||
    texto.includes("hora")
  ) {
    return "El Open Day 2026 se realizará el sábado 12 de diciembre, desde las 9:00 a. m. ¡Reserva la fecha!";
  }

  if (
    texto.includes("donde") ||
    texto.includes("ubicacion") ||
    texto.includes("direccion") ||
    texto.includes("lugar")
  ) {
    return "El evento se realizará en Valle Grande. ¡Te esperamos para conocer nuestras instalaciones!";
  }

  if (
    texto.includes("inscripcion") ||
    texto.includes("inscrib") ||
    texto.includes("registro") ||
    texto.includes("participar")
  ) {
    return "¡Nos alegra que quieras participar! Completa el formulario de inscripción que encontrarás en esta página para registrar tu visita.";
  }

  if (
    texto.includes("carrera") ||
    texto.includes("estudiar") ||
    texto.includes("programa") ||
    texto.includes("profesion")
  ) {
    return "Durante el Open Day podrás conocer nuestra propuesta educativa, explorar las carreras y resolver tus dudas con nuestro equipo.";
  }

  if (
    texto.includes("actividad") ||
    texto.includes("hacer") ||
    texto.includes("visitar")
  ) {
    return "Podrás conocer las instalaciones, explorar nuestra propuesta educativa y vivir una experiencia junto a la comunidad de Valle Grande.";
  }

  if (
    texto.includes("costo") ||
    texto.includes("precio") ||
    texto.includes("gratis") ||
    texto.includes("pagar")
  ) {
    return "Para conocer los detalles sobre los costos o condiciones de participación, te recomendamos consultar directamente con el equipo de Valle Grande.";
  }

  if (
    texto.includes("gracias") ||
    texto.includes("muchas gracias")
  ) {
    return "¡Con mucho gusto! 💙 Estamos aquí para ayudarte. ¡Esperamos verte en el Open Day!";
  }

  if (
    texto.includes("hola") ||
    texto.includes("buenos dias") ||
    texto.includes("buenas tardes") ||
    texto.includes("buenas noches")
  ) {
    return "¡Hola! 👋 Soy VG Bot, tu asistente virtual de Valle Grande. ¿Qué te gustaría conocer sobre nuestro Open Day?";
  }

  return "¡Gracias por tu pregunta! 😊 Por ahora puedo ayudarte con información sobre el evento, ubicación, carreras, actividades e inscripciones. ¿Sobre cuál de estos temas deseas saber más?";
};

function VGBot() {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);

  const [conversacion, setConversacion] = useState([
    {
      tipo: "bot",
      texto:
        "¡Hola! Soy VG Bot 👋 Estoy aquí para ayudarte a conocer el Open Day 2026 de Valle Grande. ¿En qué puedo ayudarte?",
    },
  ]);

  const mensajesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop =
        mensajesRef.current.scrollHeight;
    }
  }, [conversacion, escribiendo]);

  useEffect(() => {
    if (abierto) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [abierto]);

  const enviarMensaje = (texto) => {
    const contenido = texto.trim();

    if (!contenido || escribiendo) return;

    setConversacion((anterior) => [
      ...anterior,
      { tipo: "usuario", texto: contenido },
    ]);

    setMensaje("");
    setEscribiendo(true);

    setTimeout(() => {
      const respuesta = obtenerRespuesta(contenido);

      setConversacion((anterior) => [
        ...anterior,
        { tipo: "bot", texto: respuesta },
      ]);

      setEscribiendo(false);
    }, 650);
  };

  const seleccionarPregunta = (pregunta) => {
    enviarMensaje(pregunta);
  };

  const irAInscripcion = () => {
    setAbierto(false);

    setTimeout(() => {
      const formulario =
        document.getElementById("inscripcion") ||
        document.getElementById("registro");

      if (formulario) {
        formulario.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        setAbierto(true);
        enviarMensaje("Quiero inscribirme");
      }
    }, 150);
  };

  return (
    <div className="vg-bot-container">

      {/* Ventana del chatbot */}
      {abierto && (
        <section
          className="vg-chat-window"
          aria-label="Asistente virtual VG Bot"
        >
          {/* Encabezado */}
          <header className="vg-chat-header">
            <div className="vg-chat-avatar">
              <Bot size={27} />
              <span className="vg-avatar-status"></span>
            </div>

            <div className="vg-chat-header-info">
              <h3>VG Bot</h3>
              <span>
                <i></i>
                Asistente virtual de Valle Grande
              </span>
            </div>

            <button
              className="vg-chat-close"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chatbot"
            >
              <X size={21} />
            </button>
          </header>

          {/* Mensajes */}
          <div className="vg-chat-messages" ref={mensajesRef}>
            <div className="vg-chat-date">
              <span>OPEN DAY 2026</span>
            </div>

            {conversacion.map((item, index) => (
              <div
                key={index}
                className={`vg-message-row ${
                  item.tipo === "usuario"
                    ? "vg-message-user"
                    : "vg-message-assistant"
                }`}
              >
                {item.tipo === "bot" && (
                  <div className="vg-message-avatar">
                    <Bot size={17} />
                  </div>
                )}

                <div className="vg-message-bubble">
                  {item.texto}
                </div>
              </div>
            ))}

            {escribiendo && (
              <div className="vg-message-row vg-message-assistant">
                <div className="vg-message-avatar">
                  <Bot size={17} />
                </div>

                <div className="vg-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {/* Preguntas iniciales */}
            {conversacion.length === 1 && (
              <div className="vg-quick-questions">
                <p>Preguntas frecuentes</p>

                {preguntasFrecuentes.map((pregunta, index) => {
                  const Icono = pregunta.icono;

                  return (
                    <button
                      key={index}
                      onClick={() =>
                        seleccionarPregunta(pregunta.texto)
                      }
                    >
                      <Icono size={16} />
                      <span>{pregunta.texto}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acceso rápido a inscripción */}
          <div className="vg-chat-action">
            <button onClick={irAInscripcion}>
              <ClipboardList size={16} />
              Quiero inscribirme
            </button>
          </div>

          {/* Entrada de mensajes */}
          <form
            className="vg-chat-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensaje(mensaje);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu pregunta..."
              aria-label="Escribe tu pregunta"
            />

            <button
              type="submit"
              disabled={!mensaje.trim() || escribiendo}
              aria-label="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          </form>

          <div className="vg-chat-footer">
            <Sparkles size={12} />
            <span>Asistente virtual Open Day 2026</span>
          </div>
        </section>
      )}

      {/* Botón flotante */}
      <button
        className={`vg-bot-trigger ${abierto ? "active" : ""}`}
        onClick={() => setAbierto(!abierto)}
        aria-label={abierto ? "Cerrar VG Bot" : "Abrir VG Bot"}
      >
        {abierto ? (
          <ChevronDown size={27} />
        ) : (
          <>
            <Bot size={30} />
            <span className="vg-bot-notification"></span>
          </>
        )}
      </button>

    </div>
  );
}

export default VGBot;
