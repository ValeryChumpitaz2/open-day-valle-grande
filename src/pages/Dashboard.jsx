
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard,
  ClipboardList,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Users,
  Clock3,
  CircleCheck,
  CircleX,
  Search,
  Download,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CalendarDays,
  GraduationCap,
  X,
  Filter,
  UsersRound,
  CalendarCheck,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  UserRound,
  Mail,
  Phone,
  Building2,
  RotateCcw,
  Check,
  AlertCircle,
  Activity,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "./Dashboard.css";
import API_URL from "../config/api";

const ITEMS_PER_PAGE = 8;

const MENU_ITEMS = [
  { id: "resumen", label: "Resumen general", icon: LayoutDashboard },
  { id: "inscripciones", label: "Inscripciones", icon: ClipboardList },
  { id: "reportes", label: "Reportes", icon: ChartNoAxesCombined },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

const ESTADOS = ["Pendiente", "Confirmada", "Cancelada"];

const DISTRITOS_CANETE = [
  "Asia",
  "Calango",
  "Cerro Azul",
  "Chilca",
  "Coayllo",
  "Imperial",
  "Lunahuaná",
  "Mala",
  "Nuevo Imperial",
  "Pacarán",
  "Quilmaná",
  "San Antonio",
  "San Luis",
  "San Vicente de Cañete",
  "Santa Cruz de Flores",
  "Zúñiga",
];

const TIPOS_VISITANTES = [
  "Estudiante",
  "Padre o madre",
  "Tutor",
  "Otro familiar",
];

const normalizarTexto = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatearFecha = (fecha) => {
  if (!fecha) return "—";

  const valor = String(fecha).replace(" ", "T");
  const date = new Date(valor);

  if (Number.isNaN(date.getTime())) return String(fecha);

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatearFechaCompleta = (fecha) => {
  if (!fecha) return "—";

  const date = new Date(String(fecha).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return String(fecha);

  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const obtenerIniciales = (nombre = "") =>
  String(nombre)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("") || "AD";

const obtenerClaseEstado = (estado) => {
  const valor = normalizarTexto(estado);

  if (valor === "confirmada") return "status-confirmada";
  if (valor === "cancelada") return "status-cancelada";

  return "status-pendiente";
};

const calcularEstadisticas = (registros) => ({
  total: registros.length,
  pendientes: registros.filter(
    (item) => normalizarTexto(item.estado) === "pendiente"
  ).length,
  confirmadas: registros.filter(
    (item) => normalizarTexto(item.estado) === "confirmada"
  ).length,
  canceladas: registros.filter(
    (item) => normalizarTexto(item.estado) === "cancelada"
  ).length,
});

const obtenerFechaLocal = (fecha = new Date()) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

// CAMBIO: lectura de respuestas más segura.
// Permite identificar respuestas no JSON y errores HTTP.
const leerRespuesta = async (respuesta) => {
  const texto = await respuesta.text();

  let resultado;

  try {
    resultado = texto ? JSON.parse(texto) : {};
  } catch {
    throw new Error(
      `El servidor devolvió una respuesta no válida. Código HTTP: ${respuesta.status}.`
    );
  }

  if (!respuesta.ok || resultado.success === false) {
    throw new Error(
      resultado.message ||
        `No se pudo completar la solicitud. Código HTTP: ${respuesta.status}.`
    );
  }

  return resultado;
};

function Dashboard() {
  const [seccionActiva, setSeccionActiva] = useState("resumen");

  const [inscripciones, setInscripciones] = useState([]);
  const [administrador, setAdministrador] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroDistrito, setFiltroDistrito] = useState("Todos");

  const [orden, setOrden] = useState("recientes");
  const [paginaActual, setPaginaActual] = useState(1);

  const [inscripcionSeleccionada, setInscripcionSeleccionada] =
    useState(null);

  const [actualizandoEstado, setActualizandoEstado] = useState(null);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // ---------------------------------------------------
  // ADMINISTRADOR
  // ---------------------------------------------------

  useEffect(() => {
    // CAMBIO: se utiliza la misma clave que Login.jsx.
    const adminGuardado =
      sessionStorage.getItem("administrador") ||
      sessionStorage.getItem("admin");

    if (adminGuardado) {
      try {
        const admin = JSON.parse(adminGuardado);
        setAdministrador(admin);

        sessionStorage.setItem(
          "administrador",
          JSON.stringify(admin)
        );
      } catch {
        sessionStorage.removeItem("admin");
        sessionStorage.removeItem("administrador");
      }
    }
  }, []);

  // ---------------------------------------------------
  // MENSAJES TEMPORALES
  // ---------------------------------------------------

  const mostrarMensaje = (texto) => {
    setMensaje(texto);

    window.setTimeout(() => {
      setMensaje("");
    }, 4000);
  };

  // ---------------------------------------------------
  // CARGAR INFORMACIÓN DEL DASHBOARD
  // ---------------------------------------------------

  const cargarDatos = useCallback(async (mostrarCarga = true) => {
    try {
      if (mostrarCarga) {
        setCargando(true);
      } else {
        setActualizando(true);
      }

      setError("");

      const respuesta = await fetch(`${API_URL}/dashboard.php`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const resultado = await leerRespuesta(respuesta);

      const registros =
        resultado.inscripciones ??
        resultado.registros ??
        resultado.registrations ??
        [];

      if (!Array.isArray(registros)) {
        throw new Error(
          "El servidor no devolvió una lista válida de inscripciones."
        );
      }

      setInscripciones(registros);

      const admin =
        resultado.administrador ??
        resultado.admin ??
        null;

      if (admin) {
        setAdministrador(admin);

        sessionStorage.setItem(
          "administrador",
          JSON.stringify(admin)
        );
      }
    } catch (err) {
      console.error("Error al cargar el dashboard:", err);

      setError(
        err.message ||
          "No se pudo conectar con el servidor. Verifica tu conexión."
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos(true);
  }, [cargarDatos]);

  // ---------------------------------------------------
  // ESTADÍSTICAS
  // ---------------------------------------------------

  const estadisticas = useMemo(
    () => calcularEstadisticas(inscripciones),
    [inscripciones]
  );

  const porcentajeConfirmadas =
    estadisticas.total > 0
      ? Math.round(
          (estadisticas.confirmadas / estadisticas.total) * 100
        )
      : 0;

  const tiposVisitantes = useMemo(() => {
    const conteo = {};

    inscripciones.forEach((item) => {
      const tipo = item.tipo_visitante || "Sin especificar";
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });

    return Object.entries(conteo)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje:
          inscripciones.length > 0
            ? (cantidad / inscripciones.length) * 100
            : 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [inscripciones]);

  const distritos = useMemo(() => {
    const conteo = {};

    inscripciones.forEach((item) => {
      const distrito = item.distrito || "Sin especificar";
      conteo[distrito] = (conteo[distrito] || 0) + 1;
    });

    return Object.entries(conteo)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [inscripciones]);

  const distritosCanete = useMemo(() => {
    return DISTRITOS_CANETE.map((nombre) => {
      const registro = distritos.find(
        (item) =>
          normalizarTexto(item.nombre) === normalizarTexto(nombre)
      );

      const cantidad = registro?.cantidad || 0;

      return {
        nombre,
        cantidad,
        porcentaje:
          estadisticas.total > 0
            ? (cantidad / estadisticas.total) * 100
            : 0,
      };
    });
  }, [distritos, estadisticas.total]);

  const actividadSemanal = useMemo(() => {
    const dias = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setHours(0, 0, 0, 0);
      fecha.setDate(fecha.getDate() - i);

      const clave = obtenerFechaLocal(fecha);

      const cantidad = inscripciones.filter((item) => {
        if (!item.fecha_registro) return false;

        return String(item.fecha_registro).slice(0, 10) === clave;
      }).length;

      dias.push({
        fecha: clave,
        nombre: fecha.toLocaleDateString("es-PE", {
          weekday: "short",
        }),
        cantidad,
      });
    }

    return dias;
  }, [inscripciones]);

  const maxActividad = Math.max(
    ...actividadSemanal.map((item) => item.cantidad),
    1
  );

  const ultimasInscripciones = useMemo(() => {
    return [...inscripciones]
      .sort((a, b) => {
        const fechaA = new Date(
          String(a.fecha_registro || "").replace(" ", "T")
        ).getTime();

        const fechaB = new Date(
          String(b.fecha_registro || "").replace(" ", "T")
        ).getTime();

        return (fechaB || 0) - (fechaA || 0);
      })
      .slice(0, 5);
  }, [inscripciones]);

  // ---------------------------------------------------
  // FILTROS Y ORDENAMIENTO
  // ---------------------------------------------------

  const inscripcionesFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    const resultado = inscripciones.filter((item) => {
      const textoBusqueda = [
        item.nombre,
        item.correo,
        item.celular,
        item.distrito,
        item.colegio,
        item.tipo_visitante,
      ]
        .map(normalizarTexto)
        .join(" ");

      const coincideBusqueda =
        !termino || textoBusqueda.includes(termino);

      const coincideEstado =
        filtroEstado === "Todos" ||
        normalizarTexto(item.estado) === normalizarTexto(filtroEstado);

      const coincideTipo =
        filtroTipo === "Todos" ||
        normalizarTexto(item.tipo_visitante) === normalizarTexto(filtroTipo);

      const coincideDistrito =
        filtroDistrito === "Todos" ||
        normalizarTexto(item.distrito) === normalizarTexto(filtroDistrito);

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideTipo &&
        coincideDistrito
      );
    });

    resultado.sort((a, b) => {
      if (orden === "nombre") {
        return String(a.nombre || "").localeCompare(
          String(b.nombre || ""),
          "es"
        );
      }

      if (orden === "antiguos") {
        return (
          new Date(String(a.fecha_registro || "").replace(" ", "T")) -
          new Date(String(b.fecha_registro || "").replace(" ", "T"))
        );
      }

      return (
        new Date(String(b.fecha_registro || "").replace(" ", "T")) -
        new Date(String(a.fecha_registro || "").replace(" ", "T"))
      );
    });

    return resultado;
  }, [
    inscripciones,
    busqueda,
    filtroEstado,
    filtroTipo,
    filtroDistrito,
    orden,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(inscripcionesFiltradas.length / ITEMS_PER_PAGE)
  );

  const inscripcionesPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_PER_PAGE;

    return inscripcionesFiltradas.slice(
      inicio,
      inicio + ITEMS_PER_PAGE
    );
  }, [inscripcionesFiltradas, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroEstado, filtroTipo, filtroDistrito, orden]);

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [paginaActual, totalPaginas]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("Todos");
    setFiltroTipo("Todos");
    setFiltroDistrito("Todos");
    setOrden("recientes");
    setPaginaActual(1);
  };

  const hayFiltrosActivos =
    busqueda !== "" ||
    filtroEstado !== "Todos" ||
    filtroTipo !== "Todos" ||
    filtroDistrito !== "Todos";

  // ---------------------------------------------------
  // CAMBIAR ESTADO
  // ---------------------------------------------------

  const cambiarEstado = async (id, nuevoEstado) => {
    if (!id || !ESTADOS.includes(nuevoEstado)) return;

    const confirmar = window.confirm(
      `¿Deseas cambiar el estado de esta inscripción a "${nuevoEstado}"?`
    );

    if (!confirmar) return;

    try {
      setActualizandoEstado(id);
      setError("");
      setMensaje("");

      const respuesta = await fetch(
        `${API_URL}/actualizar_estado.php`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            id,
            estado: nuevoEstado,
          }),
        }
      );

      await leerRespuesta(respuesta);

      setInscripciones((actuales) =>
        actuales.map((item) =>
          Number(item.id) === Number(id)
            ? { ...item, estado: nuevoEstado }
            : item
        )
      );

      setInscripcionSeleccionada((actual) =>
        actual && Number(actual.id) === Number(id)
          ? { ...actual, estado: nuevoEstado }
          : actual
      );

      mostrarMensaje("Estado actualizado correctamente.");
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setError(err.message);
    } finally {
      setActualizandoEstado(null);
    }
  };

  // ---------------------------------------------------
  // EXPORTAR CSV
  // ---------------------------------------------------

  const exportarCSV = () => {
    if (inscripcionesFiltradas.length === 0) {
      window.alert("No hay registros para exportar.");
      return;
    }

    const columnas = [
      "ID",
      "Nombre",
      "Tipo de visitante",
      "Celular",
      "Correo",
      "Colegio",
      "Grado",
      "Distrito",
      "Asistentes",
      "Fecha de registro",
      "Estado",
    ];

    const escaparCSV = (valor) => {
      const texto = String(valor ?? "");
      return `"${texto.replace(/"/g, '""')}"`;
    };

    const filas = inscripcionesFiltradas.map((item) => [
      item.id,
      item.nombre,
      item.tipo_visitante,
      item.celular,
      item.correo,
      item.colegio,
      item.grado,
      item.distrito,
      item.asistentes,
      item.fecha_registro,
      item.estado,
    ]);

    const contenido = [
      columnas,
      ...filas,
    ]
      .map((fila) => fila.map(escaparCSV).join(";"))
      .join("\n");

    // BOM para que Excel reconozca correctamente los caracteres especiales.
    const archivo = new Blob(
      ["\uFEFF", contenido],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "Inscripciones_Open_Day_2026.csv";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);

    mostrarMensaje("Archivo CSV exportado correctamente.");
  };

  // ---------------------------------------------------
  // EXPORTAR PDF
  // ---------------------------------------------------

  const exportarPDF = () => {
    if (inscripcionesFiltradas.length === 0) {
      window.alert("No hay inscripciones para exportar.");
      return;
    }

    const documento = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const fechaActual = new Date().toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    documento.setFillColor(18, 63, 112);
    documento.rect(0, 0, 297, 35, "F");

    documento.setTextColor(255, 255, 255);
    documento.setFont("helvetica", "bold");
    documento.setFontSize(18);
    documento.text("VALLE GRANDE", 14, 15);

    documento.setFontSize(11);
    documento.setFont("helvetica", "normal");
    documento.text("OPEN DAY 2026", 14, 23);

    documento.setFontSize(9);
    documento.text("Reporte de inscripciones", 14, 29);

    documento.setTextColor(80, 95, 110);
    documento.setFontSize(9);
    documento.text(`Fecha de emisión: ${fechaActual}`, 14, 44);

    const resumen = calcularEstadisticas(inscripcionesFiltradas);

    documento.setFont("helvetica", "bold");
    documento.setTextColor(35, 55, 75);
    documento.text(
      `Total: ${resumen.total}     Pendientes: ${resumen.pendientes}     Confirmadas: ${resumen.confirmadas}     Canceladas: ${resumen.canceladas}`,
      14,
      53
    );

    const filas = inscripcionesFiltradas.map((item, index) => [
      index + 1,
      item.nombre || "—",
      item.tipo_visitante || "—",
      item.celular || "—",
      item.correo || "—",
      item.distrito || "—",
      item.colegio || "—",
      item.estado || "Pendiente",
      formatearFecha(item.fecha_registro),
    ]);

    autoTable(documento, {
      startY: 61,
      head: [[
        "N.º",
        "Visitante",
        "Tipo",
        "Celular",
        "Correo",
        "Distrito",
        "Colegio",
        "Estado",
        "Fecha de registro",
      ]],
      body: filas,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 3,
        textColor: [65, 80, 95],
        lineColor: [225, 232, 239],
        lineWidth: 0.15,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [18, 63, 112],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [246, 249, 252],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 34 },
        2: { cellWidth: 25 },
        3: { cellWidth: 23 },
        4: { cellWidth: 42 },
        5: { cellWidth: 25 },
        6: { cellWidth: 38 },
        7: { cellWidth: 22 },
        8: { cellWidth: 29 },
      },
      margin: {
        left: 14,
        right: 14,
        bottom: 17,
      },
      didDrawPage: () => {
        const pagina = documento.internal.getNumberOfPages();

        documento.setFontSize(8);
        documento.setTextColor(130, 140, 150);

        documento.text(
          "Valle Grande | Open Day 2026",
          14,
          documento.internal.pageSize.height - 8
        );

        documento.text(
          `Página ${pagina}`,
          283,
          documento.internal.pageSize.height - 8,
          { align: "right" }
        );
      },
    });

    documento.save("Reporte_Inscripciones_Open_Day_2026.pdf");

    mostrarMensaje("Reporte PDF generado correctamente.");
  };

  // ---------------------------------------------------
  // CERRAR SESIÓN
  // ---------------------------------------------------

  const cerrarSesion = async () => {
    const confirmar = window.confirm(
      "¿Estás segura de que deseas cerrar la sesión?"
    );

    if (!confirmar) return;

    try {
      const respuesta = await fetch(`${API_URL}/logout.php`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      // Se intenta leer la respuesta, pero se limpian los datos
      // locales incluso si el servidor devuelve un error.
      await respuesta.text();
    } catch (err) {
      console.error("No se pudo contactar con el servidor:", err);
    } finally {
      sessionStorage.removeItem("admin");
      sessionStorage.removeItem("administrador");
      window.location.href = "/admin";
    }
  };

  // ---------------------------------------------------
  // NAVEGACIÓN
  // ---------------------------------------------------

  const cambiarSeccion = (seccion) => {
    setSeccionActiva(seccion);
    setError("");
    setMensaje("");
    setInscripcionSeleccionada(null);
  };

  const nombreAdministrador =
    administrador?.nombre ||
    administrador?.usuario ||
    "Administrador";

  const inicialesAdministrador =
    obtenerIniciales(nombreAdministrador);

  const fechaHoy = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ---------------------------------------------------
  // COMPONENTE: ESTADO
  // ---------------------------------------------------

  const EstadoBadge = ({ estado }) => (
    <span
      className={`registration-status ${obtenerClaseEstado(estado)}`}
    >
      {estado || "Pendiente"}
    </span>
  );

  // ---------------------------------------------------
  // COMPONENTE: TARJETAS ESTADÍSTICAS
  // ---------------------------------------------------

  const TarjetaEstadistica = ({
    titulo,
    valor,
    descripcion,
    icono: Icono,
    clase,
  }) => (
    <div className={`stat-card ${clase}`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{titulo}</span>
        <div className="stat-card-icon">
          <Icono size={20} />
        </div>
      </div>

      <strong className="stat-card-value">{valor}</strong>

      <span className="stat-card-description">
        {descripcion}
      </span>
    </div>
  );

  const TarjetasEstadisticas = () => (
    <div className="dashboard-stats">
      <TarjetaEstadistica
        titulo="Total de inscritos"
        valor={estadisticas.total}
        descripcion="Inscripciones registradas"
        icono={Users}
        clase="total"
      />

      <TarjetaEstadistica
        titulo="Pendientes"
        valor={estadisticas.pendientes}
        descripcion="Por revisar o confirmar"
        icono={Clock3}
        clase="pending"
      />

      <TarjetaEstadistica
        titulo="Confirmadas"
        valor={estadisticas.confirmadas}
        descripcion="Inscripciones confirmadas"
        icono={CircleCheck}
        clase="confirmed"
      />

      <TarjetaEstadistica
        titulo="Canceladas"
        valor={estadisticas.canceladas}
        descripcion="Inscripciones canceladas"
        icono={CircleX}
        clase="cancelled"
      />
    </div>
  );

  // ---------------------------------------------------
  // COMPONENTE: TABLA DE INSCRIPCIONES
  // ---------------------------------------------------

  const TablaInscripciones = ({
    registros,
    mostrarAcciones = true,
  }) => {
    if (registros.length === 0) {
      return (
        <div className="empty-state">
          <ClipboardList size={30} />
          <p>No se encontraron inscripciones.</p>
          <span>Los registros aparecerán aquí cuando existan datos.</span>
        </div>
      );
    }

    return (
      <div className="table-container">
        <table className="registrations-table">
          <thead>
            <tr>
              <th>Visitante</th>
              <th>Tipo de visitante</th>
              <th>Celular</th>
              <th>Distrito</th>
              <th>Estado</th>
              {mostrarAcciones && <th>Acciones</th>}
            </tr>
          </thead>

          <tbody>
            {registros.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="visitor-cell">
                    <div className="visitor-avatar">
                      {obtenerIniciales(item.nombre)}
                    </div>

                    <div>
                      <strong>{item.nombre || "Sin nombre"}</strong>
                      <small>
                        {item.correo || "Sin correo registrado"}
                      </small>
                    </div>
                  </div>
                </td>

                <td>{item.tipo_visitante || "—"}</td>
                <td>{item.celular || "—"}</td>
                <td>{item.distrito || "—"}</td>

                <td>
                  <EstadoBadge estado={item.estado} />
                </td>

                {mostrarAcciones && (
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="action-button"
                        title="Ver detalles"
                        onClick={() =>
                          setInscripcionSeleccionada(item)
                        }
                      >
                        <Eye size={16} />
                      </button>

                      <select
                        aria-label={`Cambiar estado de ${item.nombre}`}
                        value={item.estado || "Pendiente"}
                        disabled={actualizandoEstado === item.id}
                        onChange={(e) =>
                          cambiarEstado(item.id, e.target.value)
                        }
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ---------------------------------------------------
  // COMPONENTE: ENCABEZADO DE SECCIÓN
  // ---------------------------------------------------

  const Encabezado = ({
    titulo,
    descripcion,
    acciones,
  }) => (
    <div className="dashboard-header">
      <div className="dashboard-welcome">
        <h1>{titulo}</h1>
        <p>{descripcion}</p>
      </div>

      <div className="dashboard-header-actions">
        {acciones}
      </div>
    </div>
  );

  const BotonActualizar = () => (
    <button
      type="button"
      className="btn-secondary"
      onClick={() => cargarDatos(false)}
      disabled={actualizando}
    >
      <RefreshCw
        size={15}
        className={actualizando ? "refresh-spinning" : ""}
      />
      {actualizando ? "Actualizando..." : "Actualizar"}
    </button>
  );

  // ---------------------------------------------------
  // SECCIÓN: RESUMEN GENERAL
  // ---------------------------------------------------

  const renderResumen = () => (
    <>
      <Encabezado
        titulo="Resumen general"
        descripcion={`Hola, ${nombreAdministrador}. Aquí tienes el estado de las inscripciones del Open Day.`}
        acciones={
          <>
            <div className="dashboard-date">
              <CalendarDays size={15} />
              {fechaHoy}
            </div>
            <BotonActualizar />
          </>
        }
      />

      <TarjetasEstadisticas />

      <div className="dashboard-middle">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Tipos de visitantes</h2>
              <p>Distribución de las personas inscritas</p>
            </div>
            <UsersRound size={19} color="#7790a8" />
          </div>

          {tiposVisitantes.length > 0 ? (
            <div className="report-list">
              {tiposVisitantes.map((item) => (
                <div className="report-item" key={item.nombre}>
                  <div className="report-item-header">
                    <span>{item.nombre}</span>
                    <strong>
                      {item.cantidad} ({Math.round(item.porcentaje)}%)
                    </strong>
                  </div>

                  <div className="report-progress">
                    <div
                      className="report-progress-bar"
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Aún no hay visitantes registrados.
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Actividad de los últimos 7 días</h2>
              <p>Nuevas inscripciones por día</p>
            </div>
            <Activity size={19} color="#7790a8" />
          </div>

          <div className="weekly-chart">
            {actividadSemanal.map((dia) => (
              <div className="weekly-chart-item" key={dia.fecha}>
                <strong>{dia.cantidad}</strong>

                <div className="weekly-chart-track">
                  <div
                    className="weekly-chart-bar"
                    style={{
                      height: `${
                        dia.cantidad === 0
                          ? 3
                          : (dia.cantidad / maxActividad) * 100
                      }%`,
                    }}
                  />
                </div>

                <span>{dia.nombre}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-middle">
        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Estado de las inscripciones</h2>
              <p>Porcentaje de registros confirmados</p>
            </div>
            <TrendingUp size={19} color="#7790a8" />
          </div>

          <div className="completion-summary">
            <strong>{porcentajeConfirmadas}%</strong>
            <span>de inscripciones confirmadas</span>
          </div>

          <div className="report-progress completion-progress">
            <div
              className="report-progress-bar"
              style={{ width: `${porcentajeConfirmadas}%` }}
            />
          </div>

          <div className="completion-details">
            <span>
              <i className="completion-dot confirmed-dot" />
              Confirmadas: {estadisticas.confirmadas}
            </span>
            <span>
              <i className="completion-dot pending-dot" />
              Pendientes: {estadisticas.pendientes}
            </span>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Principales distritos</h2>
              <p>Distritos con más visitantes registrados</p>
            </div>
            <MapPin size={19} color="#7790a8" />
          </div>

          {distritos.length > 0 ? (
            <div className="report-list">
              {distritos.slice(0, 5).map((item) => (
                <div className="report-item" key={item.nombre}>
                  <div className="report-item-header">
                    <span>{item.nombre}</span>
                    <strong>{item.cantidad}</strong>
                  </div>

                  <div className="report-progress">
                    <div
                      className="report-progress-bar"
                      style={{
                        width: `${
                          estadisticas.total > 0
                            ? (item.cantidad / estadisticas.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No hay distritos registrados.
            </div>
          )}
        </section>
      </div>

      <section className="registrations-panel">
        <div className="panel-header">
          <div>
            <h2>Últimas inscripciones</h2>
            <p>Los cinco registros más recientes</p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => cambiarSeccion("inscripciones")}
          >
            Ver todas
            <ChevronRight size={15} />
          </button>
        </div>

        <TablaInscripciones
          registros={ultimasInscripciones}
          mostrarAcciones={false}
        />
      </section>

      <div className="event-banner">
        <div>
          <span className="event-banner-label">VALLE GRANDE</span>
          <h2>Open Day 2026</h2>
          <p>
            Administra las inscripciones, revisa la información de
            los visitantes y realiza el seguimiento de cada registro
            desde este panel.
          </p>
        </div>

        <GraduationCap size={48} color="rgba(255,255,255,.85)" />
      </div>
    </>
  );

  // ---------------------------------------------------
  // SECCIÓN: INSCRIPCIONES
  // ---------------------------------------------------

  const renderInscripciones = () => (
    <>
      <Encabezado
        titulo="Inscripciones"
        descripcion="Consulta, filtra y administra los registros de los visitantes."
        acciones={
          <>
            <BotonActualizar />

            <button
              type="button"
              className="btn-export"
              onClick={exportarPDF}
            >
              <Download size={16} />
              Exportar PDF
            </button>
          </>
        }
      />

      <TarjetasEstadisticas />

      <section className="registrations-panel">
        <div className="registrations-header">
          <div>
            <h2>
              Registro de visitantes{" "}
              <span className="registration-count">
                {inscripcionesFiltradas.length}
              </span>
            </h2>

            <p>
              Listado completo de personas inscritas al Open Day.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setMostrarFiltros((actual) => !actual)}
          >
            <Filter size={15} />
            {mostrarFiltros ? "Ocultar filtros" : "Filtros"}
          </button>
        </div>

        <div className="registrations-toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              type="search"
              placeholder="Buscar por nombre, correo, celular..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="Todos">Todos los estados</option>
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          {mostrarFiltros && (
            <>
              <div className="filter-group">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  aria-label="Filtrar por tipo"
                >
                  <option value="Todos">Todos los visitantes</option>
                  {TIPOS_VISITANTES.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <select
                  value={filtroDistrito}
                  onChange={(e) => setFiltroDistrito(e.target.value)}
                  aria-label="Filtrar por distrito"
                >
                  <option value="Todos">Todos los distritos</option>
                  {DISTRITOS_CANETE.map((distrito) => (
                    <option key={distrito} value={distrito}>
                      {distrito}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="filter-group">
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              aria-label="Ordenar inscripciones"
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="nombre">Orden alfabético</option>
            </select>
          </div>

          {hayFiltrosActivos && (
            <button
              type="button"
              className="btn-secondary"
              onClick={limpiarFiltros}
            >
              <RotateCcw size={15} />
              Limpiar
            </button>
          )}
        </div>

        <div className="export-toolbar">
          <span>
            {inscripcionesFiltradas.length} registros encontrados
          </span>

          <div>
            <button
              type="button"
              className="btn-export btn-export-light"
              onClick={exportarCSV}
            >
              <FileSpreadsheet size={15} />
              CSV
            </button>

            <button
              type="button"
              className="btn-export"
              onClick={exportarPDF}
            >
              <FileText size={15} />
              PDF
            </button>
          </div>
        </div>

        <TablaInscripciones registros={inscripcionesPaginadas} />

        <div className="pagination-container">
          <span className="pagination-info">
            Mostrando{" "}
            {inscripcionesFiltradas.length === 0
              ? 0
              : (paginaActual - 1) * ITEMS_PER_PAGE + 1}
            {" "}a{" "}
            {Math.min(
              paginaActual * ITEMS_PER_PAGE,
              inscripcionesFiltradas.length
            )}{" "}
            de {inscripcionesFiltradas.length} registros
          </span>

          <div className="pagination-buttons">
            <button
              type="button"
              disabled={paginaActual === 1}
              onClick={() =>
                setPaginaActual((p) => Math.max(1, p - 1))
              }
              aria-label="Página anterior"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="pagination-current">
              {paginaActual} / {totalPaginas}
            </span>

            <button
              type="button"
              disabled={paginaActual >= totalPaginas}
              onClick={() =>
                setPaginaActual((p) =>
                  Math.min(totalPaginas, p + 1)
                )
              }
              aria-label="Página siguiente"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </>
  );

  // ---------------------------------------------------
  // SECCIÓN: REPORTES
  // ---------------------------------------------------

  const renderReportes = () => (
    <>
      <Encabezado
        titulo="Reportes"
        descripcion="Consulta la distribución de visitantes y el comportamiento de las inscripciones."
        acciones={<BotonActualizar />}
      />

      <TarjetasEstadisticas />

      <div className="reports-grid">
        <section className="report-panel">
          <div className="panel-header">
            <div>
              <h2>Visitantes por tipo</h2>
              <p>Clasificación de las inscripciones</p>
            </div>
            <UsersRound size={19} color="#7790a8" />
          </div>

          {tiposVisitantes.length > 0 ? (
            <div className="report-list">
              {tiposVisitantes.map((item) => (
                <div className="report-item" key={item.nombre}>
                  <div className="report-item-header">
                    <span>{item.nombre}</span>
                    <strong>
                      {item.cantidad} ({Math.round(item.porcentaje)}%)
                    </strong>
                  </div>

                  <div className="report-progress">
                    <div
                      className="report-progress-bar"
                      style={{ width: `${item.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No hay datos disponibles.
            </div>
          )}
        </section>

        <section className="report-panel">
          <div className="panel-header">
            <div>
              <h2>Inscripciones por distrito</h2>
              <p>Distribución de visitantes en Cañete</p>
            </div>
            <MapPin size={19} color="#7790a8" />
          </div>

          <div className="report-list">
            {distritosCanete.map((item) => (
              <div className="report-item" key={item.nombre}>
                <div className="report-item-header">
                  <span>{item.nombre}</span>
                  <strong>
                    {item.cantidad} ({Math.round(item.porcentaje)}%)
                  </strong>
                </div>

                <div className="report-progress">
                  <div
                    className="report-progress-bar"
                    style={{
                      width: `${item.porcentaje}%`,
                      minWidth: item.cantidad > 0 ? "3px" : "0",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="report-panel full-width">
          <div className="panel-header">
            <div>
              <h2>Actividad de los últimos siete días</h2>
              <p>Cantidad de inscripciones por fecha</p>
            </div>
            <ChartNoAxesCombined size={19} color="#7790a8" />
          </div>

          <div className="report-list">
            {actividadSemanal.map((dia) => (
              <div className="report-item" key={dia.fecha}>
                <div className="report-item-header">
                  <span>{formatearFecha(dia.fecha)}</span>
                  <strong>
                    {dia.cantidad}{" "}
                    {dia.cantidad === 1 ? "registro" : "registros"}
                  </strong>
                </div>

                <div className="report-progress">
                  <div
                    className="report-progress-bar"
                    style={{
                      width: `${
                        (dia.cantidad / maxActividad) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Resumen de cobertura distrital</h2>
            <p>Los 16 distritos de la provincia de Cañete</p>
          </div>
          <MapPin size={20} color="#7790a8" />
        </div>

        <div className="district-summary">
          <strong>{distritosCanete.filter((d) => d.cantidad > 0).length}</strong>
          <span>de 16 distritos con visitantes registrados</span>
        </div>

        <div className="district-grid">
          {distritosCanete.map((item) => (
            <div className="district-card" key={item.nombre}>
              <span>{item.nombre}</span>
              <strong>{item.cantidad}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  // ---------------------------------------------------
  // SECCIÓN: CONFIGURACIÓN
  // ---------------------------------------------------

  const renderConfiguracion = () => (
    <>
      <Encabezado
        titulo="Configuración"
        descripcion="Información de la cuenta que administra el panel."
      />

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Cuenta administrativa</h2>
            <p>Datos de la sesión actual</p>
          </div>
          <ShieldCheck size={21} color="#7790a8" />
        </div>

        <div className="admin-profile">
          <div className="sidebar-avatar admin-profile-avatar">
            {inicialesAdministrador}
          </div>

          <div>
            <strong>{nombreAdministrador}</strong>
            <span>Administrador del sistema</span>
          </div>

          <span className="registration-status status-confirmada">
            <Check size={12} />
            Sesión activa
          </span>
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Nombre</label>
            <p>{nombreAdministrador}</p>
          </div>

          <div className="modal-field">
            <label>Correo electrónico</label>
            <p>{administrador?.correo || "No disponible"}</p>
          </div>

          <div className="modal-field">
            <label>Usuario</label>
            <p>{administrador?.usuario || "No disponible"}</p>
          </div>

          <div className="modal-field">
            <label>Rol</label>
            <p>Administrador</p>
          </div>
        </div>
      </section>

      <section className="dashboard-panel settings-event-panel">
        <div className="panel-header">
          <div>
            <h2>Información del evento</h2>
            <p>Datos generales de la actividad</p>
          </div>
          <GraduationCap size={21} color="#7790a8" />
        </div>

        <div className="modal-body">
          <div className="modal-field">
            <label>Evento</label>
            <p>Open Day 2026</p>
          </div>

          <div className="modal-field">
            <label>Institución</label>
            <p>Valle Grande</p>
          </div>

          <div className="modal-field">
            <label>Plataforma</label>
            <p>Sistema de inscripciones</p>
          </div>

          <div className="modal-field">
            <label>Base de datos</label>
            <p>MySQL</p>
          </div>

          <div className="modal-field">
            <label>Backend</label>
            <p>PHP 8.3</p>
          </div>

          <div className="modal-field">
            <label>Frontend</label>
            <p>React + Vite</p>
          </div>
        </div>
      </section>

      <section className="dashboard-panel settings-event-panel">
        <div className="panel-header">
          <div>
            <h2>Conexión del sistema</h2>
            <p>Información del servicio de datos</p>
          </div>
          <Activity size={21} color="#7790a8" />
        </div>

        <div className="connection-information">
          <div>
            <span>Dirección del backend</span>
            <strong>{API_URL}</strong>
          </div>

          <span className="connection-status">
            <i />
            Configurado
          </span>
        </div>
      </section>
    </>
  );

  // ---------------------------------------------------
  // MODAL DE DETALLES
  // ---------------------------------------------------

  const renderModal = () => {
    if (!inscripcionSeleccionada) return null;

    const item = inscripcionSeleccionada;

    return (
      <div
        className="modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setInscripcionSeleccionada(null);
          }
        }}
      >
        <div
          className="modal-content"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-inscripcion-title"
        >
          <div className="modal-header">
            <div>
              <h2 id="modal-inscripcion-title">
                Detalle de inscripción
              </h2>
              <p>Información registrada del visitante</p>
            </div>

            <button
              type="button"
              className="modal-close"
              onClick={() => setInscripcionSeleccionada(null)}
              aria-label="Cerrar"
            >
              <X size={19} />
            </button>
          </div>

          <div className="modal-visitor-heading">
            <div className="visitor-avatar modal-visitor-avatar">
              {obtenerIniciales(item.nombre)}
            </div>

            <div>
              <strong>{item.nombre || "Sin nombre"}</strong>
              <span>{item.tipo_visitante || "Visitante"}</span>
            </div>
          </div>

          <div className="modal-body">
            <div className="modal-field full">
              <label>Nombre completo</label>
              <p>{item.nombre || "—"}</p>
            </div>

            <div className="modal-field">
              <label>Tipo de visitante</label>
              <p>{item.tipo_visitante || "—"}</p>
            </div>

            <div className="modal-field">
              <label>Celular</label>
              <p>{item.celular || "—"}</p>
            </div>

            <div className="modal-field full">
              <label>Correo electrónico</label>
              <p>{item.correo || "No registrado"}</p>
            </div>

            <div className="modal-field">
              <label>Colegio</label>
              <p>{item.colegio || "—"}</p>
            </div>

            <div className="modal-field">
              <label>Grado</label>
              <p>{item.grado || "—"}</p>
            </div>

            <div className="modal-field">
              <label>Distrito</label>
              <p>{item.distrito || "—"}</p>
            </div>

            <div className="modal-field">
              <label>Número de asistentes</label>
              <p>{item.asistentes ?? "—"}</p>
            </div>

            <div className="modal-field">
              <label>Fecha de registro</label>
              <p>{formatearFechaCompleta(item.fecha_registro)}</p>
            </div>

            <div className="modal-field">
              <label>Estado actual</label>
              <p>
                <EstadoBadge estado={item.estado} />
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setInscripcionSeleccionada(null)}
            >
              Cerrar
            </button>

            <select
              value={item.estado || "Pendiente"}
              disabled={actualizandoEstado === item.id}
              onChange={(e) =>
                cambiarEstado(item.id, e.target.value)
              }
              aria-label="Actualizar estado de la inscripción"
            >
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------
  // PANTALLA DE CARGA
  // ---------------------------------------------------

  if (cargando) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <strong>Cargando información del panel...</strong>
        <span>Estamos consultando las inscripciones.</span>
      </div>
    );
  }

  // ---------------------------------------------------
  // VISTA PRINCIPAL
  // ---------------------------------------------------

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <img
            src="/images/logo-valle-grande.png"
            alt="Valle Grande"
          />
        </div>

        <p className="sidebar-label">MENÚ PRINCIPAL</p>

        <nav className="sidebar-menu">
          {MENU_ITEMS.map((item) => {
            const Icono = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                className={
                  seccionActiva === item.id ? "active" : ""
                }
                onClick={() => cambiarSeccion(item.id)}
              >
                <Icono size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {inicialesAdministrador}
            </div>

            <div className="sidebar-user-info">
              <strong>{nombreAdministrador}</strong>
              <span>Administrador</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={cerrarSesion}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {error && (
            <div className="dashboard-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>

              <button
                type="button"
                onClick={() => cargarDatos(false)}
                aria-label="Reintentar conexión"
              >
                <RotateCcw size={15} />
                Reintentar
              </button>
            </div>
          )}

          {mensaje && (
            <div className="dashboard-success" role="status">
              <Check size={17} />
              {mensaje}
            </div>
          )}

          {seccionActiva === "resumen" && renderResumen()}

          {seccionActiva === "inscripciones" &&
            renderInscripciones()}

          {seccionActiva === "reportes" && renderReportes()}

          {seccionActiva === "configuracion" &&
            renderConfiguracion()}
        </div>
      </main>

      {renderModal()}
    </div>
  );
}

export default Dashboard;
