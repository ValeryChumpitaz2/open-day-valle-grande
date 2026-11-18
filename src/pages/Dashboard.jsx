
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
  UserRound,
  FileText,
  Building2,
  X,
  Filter,
  Mail,
  Phone,
  User,
  UsersRound,
  CalendarCheck,
  ShieldCheck,
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

// Los 16 distritos de la provincia de Cañete.
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

const obtenerIniciales = (nombre = "") => {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
};

const normalizarTexto = (texto) => {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const obtenerClaseEstado = (estado) => {
  const valor = normalizarTexto(estado);

  if (valor === "confirmada") return "status-confirmada";
  if (valor === "cancelada") return "status-cancelada";

  return "status-pendiente";
};

const calcularEstadisticas = (registros) => {
  return {
    total: registros.length,
    pendientes: registros.filter(
      (item) => item.estado === "Pendiente"
    ).length,
    confirmadas: registros.filter(
      (item) => item.estado === "Confirmada"
    ).length,
    canceladas: registros.filter(
      (item) => item.estado === "Cancelada"
    ).length,
  };
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

  const [paginaActual, setPaginaActual] = useState(1);

  const [inscripcionSeleccionada, setInscripcionSeleccionada] =
    useState(null);

  const [actualizandoEstado, setActualizandoEstado] = useState(null);

  // ---------------------------------------------------
  // ADMINISTRADOR
  // ---------------------------------------------------

  useEffect(() => {
    const adminGuardado = sessionStorage.getItem("admin");

    if (adminGuardado) {
      try {
        setAdministrador(JSON.parse(adminGuardado));
      } catch {
        setAdministrador(null);
      }
    }
  }, []);

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
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok || resultado.success === false) {
        throw new Error(
          resultado.message || "No se pudieron cargar los datos."
        );
      }

      const registros =
        resultado.inscripciones ??
        resultado.registros ??
        resultado.registrations ??
        [];

      setInscripciones(Array.isArray(registros) ? registros : []);

      if (resultado.admin) {
        setAdministrador(resultado.admin);
        sessionStorage.setItem(
          "admin",
          JSON.stringify(resultado.admin)
        );
      }
    } catch (err) {
      console.error("Error al cargar el dashboard:", err);
      setError(
        err.message || "Ocurrió un error al conectar con el servidor."
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
  // ESTADÍSTICAS GENERALES
  // ---------------------------------------------------

  const estadisticas = useMemo(
    () => calcularEstadisticas(inscripciones),
    [inscripciones]
  );

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

  // Conteo general de distritos registrados en MySQL.
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
        porcentaje:
          inscripciones.length > 0
            ? (cantidad / inscripciones.length) * 100
            : 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [inscripciones]);

  // Reporte de los 16 distritos, incluso cuando tienen cero inscritos.
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

      const anio = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, "0");
      const dia = String(fecha.getDate()).padStart(2, "0");
      const clave = `${anio}-${mes}-${dia}`;

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

        return fechaB - fechaA;
      })
      .slice(0, 5);
  }, [inscripciones]);

  // ---------------------------------------------------
  // FILTROS DE INSCRIPCIONES
  // ---------------------------------------------------

  // Ahora el filtro siempre muestra los 16 distritos.
  const opcionesDistritos = DISTRITOS_CANETE;

  const inscripcionesFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    return inscripciones.filter((item) => {
      const coincideBusqueda =
        !termino ||
        normalizarTexto(item.nombre).includes(termino) ||
        normalizarTexto(item.correo).includes(termino) ||
        normalizarTexto(item.celular).includes(termino) ||
        normalizarTexto(item.distrito).includes(termino) ||
        normalizarTexto(item.colegio).includes(termino);

      const coincideEstado =
        filtroEstado === "Todos" || item.estado === filtroEstado;

      const coincideTipo =
        filtroTipo === "Todos" ||
        item.tipo_visitante === filtroTipo;

      const coincideDistrito =
        filtroDistrito === "Todos" ||
        normalizarTexto(item.distrito) ===
          normalizarTexto(filtroDistrito);

      return (
        coincideBusqueda &&
        coincideEstado &&
        coincideTipo &&
        coincideDistrito
      );
    });
  }, [
    inscripciones,
    busqueda,
    filtroEstado,
    filtroTipo,
    filtroDistrito,
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
  }, [busqueda, filtroEstado, filtroTipo, filtroDistrito]);

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
    setPaginaActual(1);
  };

  // ---------------------------------------------------
  // ACTUALIZAR ESTADO DE UNA INSCRIPCIÓN
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

      const resultado = await respuesta.json();

      if (!respuesta.ok || resultado.success === false) {
        throw new Error(
          resultado.message || "No se pudo actualizar el estado."
        );
      }

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

      setMensaje(
        "El estado de la inscripción se actualizó correctamente."
      );

      window.setTimeout(() => setMensaje(""), 3500);
    } catch (err) {
      setError(err.message);
    } finally {
      setActualizandoEstado(null);
    }
  };

  // ---------------------------------------------------
  // EXPORTAR INSCRIPCIONES A PDF
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
      await fetch(`${API_URL}/logout.php`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("No se pudo contactar con el servidor:", err);
    } finally {
      sessionStorage.removeItem("admin");
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
    administrador?.nombre || "Administrador";

  const inicialesAdministrador =
    obtenerIniciales(nombreAdministrador) || "AD";

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
    <span className={`registration-status ${obtenerClaseEstado(estado)}`}>
      {estado || "Pendiente"}
    </span>
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
          <ClipboardList />
          <p>No se encontraron inscripciones.</p>
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
                      <strong>{item.nombre}</strong>
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
                        onClick={() => setInscripcionSeleccionada(item)}
                      >
                        <Eye />
                      </button>

                      <select
                        aria-label={`Cambiar estado de ${item.nombre}`}
                        value={item.estado || "Pendiente"}
                        disabled={actualizandoEstado === item.id}
                        onChange={(e) =>
                          cambiarEstado(item.id, e.target.value)
                        }
                        style={{
                          width: "118px",
                          minHeight: "33px",
                          padding: "0 7px",
                          color: "#53677e",
                          background: "#fff",
                          border: "1px solid #e7edf4",
                          borderRadius: "8px",
                          fontSize: "10px",
                        }}
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
  // SECCIÓN: RESUMEN GENERAL
  // ---------------------------------------------------

  const renderResumen = () => (
    <>
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Resumen general</h1>
          <p>
            Hola, {nombreAdministrador}. Aquí tienes el estado de las
            inscripciones del Open Day.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <div className="dashboard-date">
            <CalendarDays
              size={15}
              style={{ marginRight: 7, verticalAlign: "middle" }}
            />
            {fechaHoy}
          </div>

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
            Actualizar
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card total">
          <div className="stat-card-header">
            <span className="stat-card-title">Total de inscritos</span>
            <div className="stat-card-icon"><Users /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.total}</strong>
          <span className="stat-card-description">
            Inscripciones registradas
          </span>
        </div>

        <div className="stat-card pending">
          <div className="stat-card-header">
            <span className="stat-card-title">Pendientes</span>
            <div className="stat-card-icon"><Clock3 /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.pendientes}</strong>
          <span className="stat-card-description">
            Por revisar o confirmar
          </span>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-card-header">
            <span className="stat-card-title">Confirmadas</span>
            <div className="stat-card-icon"><CircleCheck /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.confirmadas}</strong>
          <span className="stat-card-description">
            Inscripciones confirmadas
          </span>
        </div>

        <div className="stat-card cancelled">
          <div className="stat-card-header">
            <span className="stat-card-title">Canceladas</span>
            <div className="stat-card-icon"><CircleX /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.canceladas}</strong>
          <span className="stat-card-description">
            Inscripciones canceladas
          </span>
        </div>
      </div>

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
            <ChartNoAxesCombined size={19} color="#7790a8" />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-around",
              gap: 12,
              minHeight: 155,
              paddingTop: 15,
            }}
          >
            {actividadSemanal.map((dia) => (
              <div
                key={dia.fecha}
                style={{
                  display: "flex",
                  flex: 1,
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  height: 145,
                  justifyContent: "flex-end",
                }}
              >
                <strong style={{ color: "#52677e", fontSize: 11 }}>
                  {dia.cantidad}
                </strong>

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    width: "100%",
                    height: 95,
                    background: "#f1f5f9",
                    borderRadius: "8px 8px 3px 3px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${
                        dia.cantidad === 0
                          ? 3
                          : (dia.cantidad / maxActividad) * 100
                      }%`,
                      minHeight: 3,
                      background:
                        "linear-gradient(180deg, #70b4e2, #246da7)",
                      borderRadius: "8px 8px 0 0",
                      transition: "height .3s ease",
                    }}
                  />
                </div>

                <span
                  style={{
                    color: "#8b9bad",
                    fontSize: 10,
                    textTransform: "capitalize",
                  }}
                >
                  {dia.nombre}
                </span>
              </div>
            ))}
          </div>
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
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Inscripciones</h1>
          <p>
            Consulta, filtra y administra los registros de los visitantes.
          </p>
        </div>

        <div className="dashboard-header-actions">
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
            Actualizar
          </button>

          <button
            type="button"
            className="btn-export"
            onClick={exportarPDF}
          >
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card total">
          <div className="stat-card-header">
            <span className="stat-card-title">Total de inscritos</span>
            <div className="stat-card-icon"><Users /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.total}</strong>
          <span className="stat-card-description">Registros en el sistema</span>
        </div>

        <div className="stat-card pending">
          <div className="stat-card-header">
            <span className="stat-card-title">Pendientes</span>
            <div className="stat-card-icon"><Clock3 /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.pendientes}</strong>
          <span className="stat-card-description">Por confirmar</span>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-card-header">
            <span className="stat-card-title">Confirmadas</span>
            <div className="stat-card-icon"><CircleCheck /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.confirmadas}</strong>
          <span className="stat-card-description">
            Confirmadas correctamente
          </span>
        </div>

        <div className="stat-card cancelled">
          <div className="stat-card-header">
            <span className="stat-card-title">Canceladas</span>
            <div className="stat-card-icon"><CircleX /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.canceladas}</strong>
          <span className="stat-card-description">Registros cancelados</span>
        </div>
      </div>

      <section className="registrations-panel">
        <div className="registrations-header">
          <div>
            <h2>
              Registro de visitantes{" "}
              <span className="registration-count">
                {inscripcionesFiltradas.length}
              </span>
            </h2>
            <p style={{ margin: "6px 0 0", color: "#718096", fontSize: 11 }}>
              Listado completo de personas inscritas al Open Day.
            </p>
          </div>
        </div>

        <div className="registrations-toolbar">
          <div className="search-box">
            <Search
              size={17}
              color="#91a1b3"
              style={{
                position: "absolute",
                top: 13,
                left: 13,
                pointerEvents: "none",
              }}
            />
            <input
              type="search"
              placeholder="Buscar por nombre, correo, celular..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingLeft: 40 }}
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

          <div className="filter-group">
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              aria-label="Filtrar por tipo de visitante"
            >
              <option value="Todos">Todos los visitantes</option>
              <option value="Estudiante">Estudiante</option>
              <option value="Padre o madre">Padre o madre</option>
              <option value="Tutor">Tutor</option>
              <option value="Otro familiar">Otro familiar</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filtroDistrito}
              onChange={(e) => setFiltroDistrito(e.target.value)}
              aria-label="Filtrar por distrito"
            >
              <option value="Todos">Todos los distritos</option>
              {opcionesDistritos.map((distrito) => (
                <option key={distrito} value={distrito}>
                  {distrito}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={limpiarFiltros}
            title="Limpiar filtros"
          >
            <Filter size={15} />
            Limpiar
          </button>
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
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              <ChevronLeft size={15} />
            </button>

            <button type="button" className="active">
              {paginaActual}
            </button>

            <button
              type="button"
              disabled={paginaActual >= totalPaginas}
              onClick={() =>
                setPaginaActual((p) => Math.min(totalPaginas, p + 1))
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
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Reportes</h1>
          <p>
            Consulta la distribución de visitantes y el comportamiento
            de las inscripciones.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <div className="dashboard-date">
            <CalendarDays
              size={15}
              style={{ marginRight: 7, verticalAlign: "middle" }}
            />
            {fechaHoy}
          </div>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card total">
          <div className="stat-card-header">
            <span className="stat-card-title">Total registrados</span>
            <div className="stat-card-icon"><Users /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.total}</strong>
          <span className="stat-card-description">Todos los visitantes</span>
        </div>

        <div className="stat-card confirmed">
          <div className="stat-card-header">
            <span className="stat-card-title">Confirmaciones</span>
            <div className="stat-card-icon"><CalendarCheck /></div>
          </div>
          <strong className="stat-card-value">
            {estadisticas.confirmadas}
          </strong>
          <span className="stat-card-description">
            Visitantes confirmados
          </span>
        </div>

        <div className="stat-card pending">
          <div className="stat-card-header">
            <span className="stat-card-title">Pendientes</span>
            <div className="stat-card-icon"><Clock3 /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.pendientes}</strong>
          <span className="stat-card-description">Por gestionar</span>
        </div>

        <div className="stat-card cancelled">
          <div className="stat-card-header">
            <span className="stat-card-title">Cancelaciones</span>
            <div className="stat-card-icon"><CircleX /></div>
          </div>
          <strong className="stat-card-value">{estadisticas.canceladas}</strong>
          <span className="stat-card-description">Registros cancelados</span>
        </div>
      </div>

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
                    <strong>{item.cantidad}</strong>
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
            <div className="empty-state">No hay datos disponibles.</div>
          )}
        </section>

        {/* REPORTE COMPLETO DE LOS 16 DISTRITOS */}
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
              <p>Cantidad de inscripciones registradas por fecha</p>
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
                      width: `${(dia.cantidad / maxActividad) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );

  // ---------------------------------------------------
  // SECCIÓN: CONFIGURACIÓN
  // ---------------------------------------------------

  const renderConfiguracion = () => (
    <>
      <div className="dashboard-header">
        <div className="dashboard-welcome">
          <h1>Configuración</h1>
          <p>
            Información de la cuenta que administra el panel.
          </p>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Cuenta administrativa</h2>
            <p>Datos de la sesión actual</p>
          </div>
          <ShieldCheck size={21} color="#7790a8" />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "20px",
            marginBottom: 24,
            background: "#f6f9fc",
            border: "1px solid #e7edf4",
            borderRadius: 14,
          }}
        >
          <div
            className="sidebar-avatar"
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              fontSize: 19,
            }}
          >
            {inicialesAdministrador}
          </div>

          <div>
            <strong
              style={{
                display: "block",
                color: "#123f70",
                fontSize: 16,
              }}
            >
              {nombreAdministrador}
            </strong>
            <span
              style={{
                display: "block",
                marginTop: 5,
                color: "#718096",
                fontSize: 12,
              }}
            >
              Administrador del sistema
            </span>
          </div>
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
            <label>Rol</label>
            <p>Administrador</p>
          </div>

          <div className="modal-field">
            <label>Estado de la sesión</label>
            <p>
              <span className="registration-status status-confirmada">
                Activa
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-panel" style={{ marginTop: 20 }}>
        <div className="panel-header">
          <div>
            <h2>Información del evento</h2>
            <p>Datos generales del Open Day</p>
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
        </div>
      </section>
    </>
  );

  // ---------------------------------------------------
  // VISTA PRINCIPAL
  // ---------------------------------------------------

  if (cargando) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        Cargando información del panel...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* MENÚ LATERAL */}
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

      {/* CONTENIDO */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {error && (
            <div className="dashboard-error">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="dashboard-success">
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

      {/* MODAL DE DETALLES */}
      {inscripcionSeleccionada && (
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
                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#718096",
                    fontSize: 11,
                  }}
                >
                  Información registrada del visitante
                </p>
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

            <div className="modal-body">
              <div className="modal-field full">
                <label>Nombre completo</label>
                <p>{inscripcionSeleccionada.nombre || "—"}</p>
              </div>

              <div className="modal-field">
                <label>Tipo de visitante</label>
                <p>{inscripcionSeleccionada.tipo_visitante || "—"}</p>
              </div>

              <div className="modal-field">
                <label>Celular</label>
                <p>{inscripcionSeleccionada.celular || "—"}</p>
              </div>

              <div className="modal-field full">
                <label>Correo electrónico</label>
                <p>
                  {inscripcionSeleccionada.correo || "No registrado"}
                </p>
              </div>

              <div className="modal-field">
                <label>Colegio</label>
                <p>{inscripcionSeleccionada.colegio || "—"}</p>
              </div>

              <div className="modal-field">
                <label>Grado</label>
                <p>{inscripcionSeleccionada.grado || "—"}</p>
              </div>

              <div className="modal-field">
                <label>Distrito</label>
                <p>{inscripcionSeleccionada.distrito || "—"}</p>
              </div>

              <div className="modal-field">
                <label>Número de asistentes</label>
                <p>{inscripcionSeleccionada.asistentes || "—"}</p>
              </div>

              <div className="modal-field">
                <label>Fecha de registro</label>
                <p>
                  {formatearFechaCompleta(
                    inscripcionSeleccionada.fecha_registro
                  )}
                </p>
              </div>

              <div className="modal-field">
                <label>Estado actual</label>
                <p>
                  <EstadoBadge
                    estado={inscripcionSeleccionada.estado}
                  />
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
