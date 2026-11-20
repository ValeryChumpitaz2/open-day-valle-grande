
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
  Menu,
  UserRound,
  Mail,
  Phone,
  Building2,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";

import API_URL from "../config/api";
import "./Dashboard.css";

const ITEMS_PER_PAGE = 8;

const ESTADOS = ["Pendiente", "Confirmada", "Cancelada"];

const MENU = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "inscripciones", label: "Inscripciones", icon: ClipboardList },
  { id: "reportes", label: "Reportes", icon: ChartNoAxesCombined },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

const obtenerUrl = (archivo) => {
  const base = String(API_URL || "").replace(/\/+$/, "");
  return `${base}/${archivo}`;
};

const normalizarTexto = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  const date = new Date(String(fecha).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return fecha;

  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatearFechaCompleta = (fecha) => {
  if (!fecha) return "Sin fecha";

  const date = new Date(String(fecha).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return fecha;

  return date.toLocaleString("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

const obtenerIniciales = (nombre) =>
  String(nombre || "Visitante")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");

const claseEstado = (estado) => {
  const normalizado = normalizarTexto(estado);

  if (normalizado === "confirmada") return "confirmada";
  if (normalizado === "cancelada") return "cancelada";

  return "pendiente";
};

async function leerRespuesta(response) {
  const texto = await response.text();

  let resultado;

  try {
    resultado = JSON.parse(texto);
  } catch {
    throw new Error(
      `El servidor no devolvió JSON válido. Respuesta recibida: ${texto.slice(0, 180)}`
    );
  }

  if (!response.ok || resultado.success === false) {
    throw new Error(
      resultado.mensaje || `Error del servidor (${response.status}).`
    );
  }

  return resultado;
}

function Dashboard() {
  const [seccion, setSeccion] = useState("resumen");
  const [inscripciones, setInscripciones] = useState([]);
  const [administrador, setAdministrador] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [pagina, setPagina] = useState(1);

  const [inscripcionSeleccionada, setInscripcionSeleccionada] =
    useState(null);

  const [menuMovil, setMenuMovil] = useState(false);

  // =====================================================
  // CARGAR INFORMACIÓN
  // =====================================================

  const cargarDatos = useCallback(async (mostrarCarga = true) => {
    if (mostrarCarga) setCargando(true);

    setError("");

    try {
      const response = await fetch(obtenerUrl("dashboard.php"), {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const resultado = await leerRespuesta(response);

      const registros =
        resultado.inscripciones ??
        resultado.registros ??
        resultado.registrations;

      if (!Array.isArray(registros)) {
        throw new Error(
          "El servidor no envió una lista válida de inscripciones."
        );
      }

      setInscripciones(registros);

      setAdministrador(
        resultado.administrador ??
        resultado.admin ??
        null
      );
    } catch (err) {
      console.error("Error al cargar dashboard:", err);
      setError(err.message || "No se pudo cargar el dashboard.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const estadisticas = useMemo(() => {
    return inscripciones.reduce(
      (resultado, registro) => {
        resultado.total += 1;

        const estado = normalizarTexto(registro.estado);

        if (estado === "confirmada") {
          resultado.confirmadas += 1;
        } else if (estado === "cancelada") {
          resultado.canceladas += 1;
        } else {
          resultado.pendientes += 1;
        }

        return resultado;
      },
      {
        total: 0,
        pendientes: 0,
        confirmadas: 0,
        canceladas: 0,
      }
    );
  }, [inscripciones]);

  const porcentajeConfirmadas = estadisticas.total
    ? Math.round(
        (estadisticas.confirmadas / estadisticas.total) * 100
      )
    : 0;

  // =====================================================
  // FILTROS
  // =====================================================

  const tiposVisitante = useMemo(() => {
    return [
      ...new Set(
        inscripciones
          .map((item) => item.tipo_visitante)
          .filter(Boolean)
      ),
    ].sort();
  }, [inscripciones]);

  const inscripcionesFiltradas = useMemo(() => {
    return inscripciones.filter((item) => {
      const texto = normalizarTexto(
        [
          item.nombre,
          item.correo,
          item.celular,
          item.colegio,
          item.distrito,
          item.tipo_visitante,
        ].join(" ")
      );

      const coincideBusqueda = texto.includes(
        normalizarTexto(busqueda)
      );

      const coincideEstado =
        filtroEstado === "Todos" ||
        normalizarTexto(item.estado) === normalizarTexto(filtroEstado);

      const coincideTipo =
        filtroTipo === "Todos" ||
        normalizarTexto(item.tipo_visitante) === normalizarTexto(filtroTipo);

      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [inscripciones, busqueda, filtroEstado, filtroTipo]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(inscripcionesFiltradas.length / ITEMS_PER_PAGE)
  );

  const inscripcionesPaginadas = useMemo(() => {
    const inicio = (pagina - 1) * ITEMS_PER_PAGE;

    return inscripcionesFiltradas.slice(
      inicio,
      inicio + ITEMS_PER_PAGE
    );
  }, [inscripcionesFiltradas, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busqueda, filtroEstado, filtroTipo]);

  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  // =====================================================
  // ACTUALIZAR ESTADO
  // =====================================================

  const cambiarEstado = async (id, nuevoEstado) => {
    if (!id || !ESTADOS.includes(nuevoEstado)) return;

    setActualizando(true);
    setError("");
    setMensaje("");

    try {
      const response = await fetch(
        obtenerUrl("actualizar_estado.php"),
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

      const resultado = await leerRespuesta(response);

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
        resultado.mensaje || "Estado actualizado correctamente."
      );
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      setError(err.message || "No se pudo actualizar el estado.");
    } finally {
      setActualizando(false);
    }
  };

  // =====================================================
  // ELIMINAR INSCRIPCIÓN
  // =====================================================

  const eliminarInscripcion = async (id, nombre) => {
    if (!id || eliminandoId !== null) return;

    const confirmar = window.confirm(
      `¿Deseas eliminar la inscripción de "${nombre || "este visitante"}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    setEliminandoId(id);
    setError("");
    setMensaje("");

    try {
      const response = await fetch(
        obtenerUrl("eliminar_inscripcion.php"),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ id }),
        }
      );

      const resultado = await leerRespuesta(response);

      setInscripciones((actuales) =>
        actuales.filter(
          (item) => Number(item.id) !== Number(id)
        )
      );

      setInscripcionSeleccionada((actual) =>
        actual && Number(actual.id) === Number(id)
          ? null
          : actual
      );

      setMensaje(
        resultado.mensaje || "Inscripción eliminada correctamente."
      );
    } catch (err) {
      console.error("Error al eliminar inscripción:", err);
      setError(err.message || "No se pudo eliminar la inscripción.");
    } finally {
      setEliminandoId(null);
    }
  };

  // =====================================================
  // EXPORTAR CSV
  // =====================================================

  const exportarCSV = () => {
    if (inscripcionesFiltradas.length === 0) {
      setError("No hay inscripciones para exportar.");
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

    const contenido = [columnas, ...filas]
      .map((fila) =>
        fila
          .map((valor) =>
            `"${String(valor ?? "").replace(/"/g, '""')}"`
          )
          .join(";")
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + contenido],
      { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "inscripciones-open-day.csv";
    enlace.click();

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // CERRAR SESIÓN
  // =====================================================

  const cerrarSesion = async () => {
    try {
      await fetch(obtenerUrl("logout.php"), {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      sessionStorage.clear();
      window.location.href = "/admin";
    }
  };

  // =====================================================
  // REPORTES
  // =====================================================

  const reportePorTipo = useMemo(() => {
    const agrupado = {};

    inscripciones.forEach((item) => {
      const tipo = item.tipo_visitante || "Sin especificar";
      agrupado[tipo] = (agrupado[tipo] || 0) + 1;
    });

    return Object.entries(agrupado)
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [inscripciones]);

  const reportePorDistrito = useMemo(() => {
    const agrupado = {};

    inscripciones.forEach((item) => {
      const distrito = item.distrito || "Sin especificar";
      agrupado[distrito] = (agrupado[distrito] || 0) + 1;
    });

    return Object.entries(agrupado)
      .map(([distrito, cantidad]) => ({ distrito, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [inscripciones]);

  // =====================================================
  // COMPONENTES VISUALES
  // =====================================================

  const tituloSeccion =
    MENU.find((item) => item.id === seccion)?.label || "Resumen";

  const fechaActual = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const renderResumen = () => (
    <>
      <section className="dashboard-welcome">
        <div>
          <span className="eyebrow">OPEN DAY 2026</span>
          <h1>Resumen general</h1>
          <p>Consulta y administra las inscripciones del evento.</p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={17} />
          <span>{fechaActual}</span>
        </div>
      </section>

      <section className="dashboard-stats">
        <article className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Total de inscripciones</span>
            <span className="stat-card-icon blue">
              <Users size={21} />
            </span>
          </div>
          <strong className="stat-card-value">{estadisticas.total}</strong>
          <span className="stat-card-description">Registros recibidos</span>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Pendientes</span>
            <span className="stat-card-icon orange">
              <Clock3 size={21} />
            </span>
          </div>
          <strong className="stat-card-value">
            {estadisticas.pendientes}
          </strong>
          <span className="stat-card-description">Por confirmar</span>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Confirmadas</span>
            <span className="stat-card-icon green">
              <CircleCheck size={21} />
            </span>
          </div>
          <strong className="stat-card-value">
            {estadisticas.confirmadas}
          </strong>
          <span className="stat-card-description">
            Inscripciones confirmadas
          </span>
        </article>

        <article className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-title">Canceladas</span>
            <span className="stat-card-icon red">
              <CircleX size={21} />
            </span>
          </div>
          <strong className="stat-card-value">
            {estadisticas.canceladas}
          </strong>
          <span className="stat-card-description">
            Inscripciones canceladas
          </span>
        </article>
      </section>

      <section className="dashboard-middle">
        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Estado de inscripciones</h2>
              <p>Distribución de los registros actuales</p>
            </div>
            <ChartNoAxesCombined size={21} />
          </div>

          <div className="completion-summary">
            <div className="completion-number">
              <strong>{porcentajeConfirmadas}%</strong>
              <span>Confirmadas</span>
            </div>

            <div className="completion-progress">
              <div
                className="completion-progress-bar"
                style={{ width: `${porcentajeConfirmadas}%` }}
              />
            </div>

            <div className="completion-details">
              <span>
                <i className="completion-dot confirmed-dot" />
                Confirmadas ({estadisticas.confirmadas})
              </span>
              <span>
                <i className="completion-dot pending-dot" />
                Pendientes ({estadisticas.pendientes})
              </span>
              <span>
                <i className="completion-dot cancelled-dot" />
                Canceladas ({estadisticas.canceladas})
              </span>
            </div>
          </div>
        </article>

        <article className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Visitantes por tipo</h2>
              <p>Clasificación de los participantes</p>
            </div>
            <GraduationCap size={21} />
          </div>

          <div className="report-list">
            {reportePorTipo.length ? (
              reportePorTipo.slice(0, 5).map((item) => (
                <div className="report-item" key={item.tipo}>
                  <div className="report-item-header">
                    <span>{item.tipo}</span>
                    <strong>{item.cantidad}</strong>
                  </div>
                  <div className="report-progress">
                    <div
                      className="report-progress-bar"
                      style={{
                        width: `${
                          estadisticas.total
                            ? (item.cantidad / estadisticas.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">Todavía no hay registros.</p>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-panel registrations-panel">
        <div className="panel-header">
          <div>
            <h2>Últimas inscripciones</h2>
            <p>Los registros más recientes del evento</p>
          </div>

          <button
            className="text-button"
            onClick={() => setSeccion("inscripciones")}
          >
            Ver todas
          </button>
        </div>

        {inscripciones.length ? (
          <div className="recent-list">
            {inscripciones.slice(0, 5).map((item) => (
              <div className="recent-item" key={item.id}>
                <div className="visitor-avatar">
                  {obtenerIniciales(item.nombre)}
                </div>

                <div className="recent-info">
                  <strong>{item.nombre || "Visitante"}</strong>
                  <span>
                    {item.tipo_visitante || "Sin tipo"} ·{" "}
                    {formatearFecha(item.fecha_registro)}
                  </span>
                </div>

                <span
                  className={`registration-status ${claseEstado(item.estado)}`}
                >
                  {item.estado || "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No hay inscripciones registradas.</p>
        )}
      </section>
    </>
  );

  // =====================================================
  // INSCRIPCIONES
  // =====================================================

  const renderInscripciones = () => (
    <>
      <section className="dashboard-welcome">
        <div>
          <span className="eyebrow">GESTIÓN DE REGISTROS</span>
          <h1>Inscripciones</h1>
          <p>Administra, consulta y actualiza los registros del evento.</p>
        </div>

        <button
          className="btn-primary"
          onClick={exportarCSV}
          disabled={!inscripcionesFiltradas.length}
        >
          <Download size={17} />
          Exportar CSV
        </button>
      </section>

      <section className="dashboard-panel registrations-panel">
        <div className="registrations-header">
          <div>
            <h2>Listado de visitantes</h2>
            <p>{inscripcionesFiltradas.length} registros encontrados</p>
          </div>
        </div>

        <div className="registrations-toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar por nombre, correo, colegio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Filter size={17} />

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="Todos">Todos los estados</option>
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>

            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="Todos">Todos los tipos</option>
              {tiposVisitante.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="registrations-table">
            <thead>
              <tr>
                <th>Visitante</th>
                <th>Tipo</th>
                <th>Contacto</th>
                <th>Distrito</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {inscripcionesPaginadas.length ? (
                inscripcionesPaginadas.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="visitor-cell">
                        <div className="visitor-avatar">
                          {obtenerIniciales(item.nombre)}
                        </div>
                        <div>
                          <strong>{item.nombre || "Sin nombre"}</strong>
                          <span>{item.colegio || "Sin institución"}</span>
                        </div>
                      </div>
                    </td>

                    <td>{item.tipo_visitante || "No especificado"}</td>

                    <td>
                      <div className="contact-cell">
                        <span>{item.correo || "Sin correo"}</span>
                        <span>{item.celular || "Sin celular"}</span>
                      </div>
                    </td>

                    <td>{item.distrito || "Sin distrito"}</td>

                    <td>{formatearFecha(item.fecha_registro)}</td>

                    <td>
                      <span
                        className={`registration-status ${claseEstado(item.estado)}`}
                      >
                        {item.estado || "Pendiente"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="action-button"
                          title="Ver detalles"
                          onClick={() =>
                            setInscripcionSeleccionada(item)
                          }
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          className="action-button delete-action"
                          title="Eliminar inscripción"
                          disabled={eliminandoId !== null}
                          onClick={() =>
                            eliminarInscripcion(item.id, item.nombre)
                          }
                        >
                          {Number(eliminandoId) === Number(item.id) ? (
                            <RefreshCw
                              size={17}
                              className="refresh-spinning"
                            />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      No se encontraron inscripciones.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-container">
          <span className="pagination-info">
            Página {pagina} de {totalPaginas}
          </span>

          <div className="pagination-buttons">
            <button
              disabled={pagina <= 1}
              onClick={() => setPagina((actual) => actual - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="pagination-current">{pagina}</span>

            <button
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((actual) => actual + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>
    </>
  );

  // =====================================================
  // REPORTES
  // =====================================================

  const renderReportes = () => (
    <>
      <section className="dashboard-welcome">
        <div>
          <span className="eyebrow">ANÁLISIS DE INFORMACIÓN</span>
          <h1>Reportes</h1>
          <p>Consulta la distribución de las inscripciones registradas.</p>
        </div>

        <button className="btn-primary" onClick={exportarCSV}>
          <FileSpreadsheet size={17} />
          Descargar datos
        </button>
      </section>

      <section className="reports-grid">
        <article className="dashboard-panel report-panel">
          <div className="panel-header">
            <div>
              <h2>Inscripciones por tipo</h2>
              <p>Clasificación de visitantes</p>
            </div>
            <GraduationCap size={21} />
          </div>

          {reportePorTipo.length ? (
            <div className="report-list">
              {reportePorTipo.map((item) => (
                <div className="report-item" key={item.tipo}>
                  <div className="report-item-header">
                    <span>{item.tipo}</span>
                    <strong>{item.cantidad}</strong>
                  </div>
                  <div className="report-progress">
                    <div
                      className="report-progress-bar"
                      style={{
                        width: `${
                          estadisticas.total
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
            <p className="empty-state">No hay datos disponibles.</p>
          )}
        </article>

        <article className="dashboard-panel report-panel">
          <div className="panel-header">
            <div>
              <h2>Inscripciones por distrito</h2>
              <p>Procedencia de los visitantes</p>
            </div>
            <MapPin size={21} />
          </div>

          {reportePorDistrito.length ? (
            <div className="district-grid">
              {reportePorDistrito.map((item) => (
                <div className="district-card" key={item.distrito}>
                  <span>{item.distrito}</span>
                  <strong>{item.cantidad}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No hay datos disponibles.</p>
          )}
        </article>
      </section>

      <section className="dashboard-panel">
        <div className="panel-header">
          <div>
            <h2>Resumen de estados</h2>
            <p>Situación actual de las inscripciones</p>
          </div>
        </div>

        <div className="dashboard-stats report-stats">
          <article className="stat-card">
            <span className="stat-card-title">Total</span>
            <strong className="stat-card-value">{estadisticas.total}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-card-title">Pendientes</span>
            <strong className="stat-card-value">
              {estadisticas.pendientes}
            </strong>
          </article>
          <article className="stat-card">
            <span className="stat-card-title">Confirmadas</span>
            <strong className="stat-card-value">
              {estadisticas.confirmadas}
            </strong>
          </article>
          <article className="stat-card">
            <span className="stat-card-title">Canceladas</span>
            <strong className="stat-card-value">
              {estadisticas.canceladas}
            </strong>
          </article>
        </div>
      </section>
    </>
  );

  // =====================================================
  // CONFIGURACIÓN
  // =====================================================

  const renderConfiguracion = () => (
    <>
      <section className="dashboard-welcome">
        <div>
          <span className="eyebrow">PREFERENCIAS</span>
          <h1>Configuración</h1>
          <p>Información de la sesión y del sistema.</p>
        </div>
      </section>

      <section className="dashboard-panel settings-event-panel">
        <div className="settings-icon">
          <Settings size={25} />
        </div>

        <h2>Open Day 2026</h2>
        <p>Panel administrativo de gestión de inscripciones.</p>

        <div className="connection-information">
          <div>
            <span>Servicio</span>
            <strong>API del sistema</strong>
          </div>
          <span className="connection-status">
            <i />
            Conectado
          </span>
        </div>

        <div className="admin-profile">
          <div className="admin-profile-avatar">
            <UserRound size={25} />
          </div>

          <div>
            <strong>
              {typeof administrador === "string"
                ? administrador
                : administrador?.nombre || "Administrador"}
            </strong>
            <span>Sesión administrativa</span>
          </div>
        </div>
      </section>
    </>
  );

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="dashboard-page">
      <aside className={`dashboard-sidebar ${menuMovil ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">VG</div>
          <div>
            <strong>VALLE GRANDE</strong>
            <span>OPEN DAY 2026</span>
          </div>

          <button
            className="sidebar-mobile-close"
            onClick={() => setMenuMovil(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-label">MENÚ PRINCIPAL</div>

        <nav className="sidebar-menu">
          {MENU.map((item) => {
            const Icono = item.icon;

            return (
              <button
                key={item.id}
                className={seccion === item.id ? "active" : ""}
                onClick={() => {
                  setSeccion(item.id);
                  setMenuMovil(false);
                  setError("");
                  setMensaje("");
                }}
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
              <UserRound size={19} />
            </div>
            <div className="sidebar-user-info">
              <strong>
                {typeof administrador === "string"
                  ? administrador
                  : administrador?.nombre || "Administrador"}
              </strong>
              <span>Administrador</span>
            </div>
          </div>

          <button className="sidebar-logout" onClick={cerrarSesion}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {menuMovil && (
        <button
          className="sidebar-backdrop"
          onClick={() => setMenuMovil(false)}
          aria-label="Cerrar menú"
        />
      )}

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              className="mobile-menu-button"
              onClick={() => setMenuMovil(true)}
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>

            <div>
              <span className="header-breadcrumb">
                Administración / {tituloSeccion}
              </span>
              <strong>{tituloSeccion}</strong>
            </div>
          </div>

          <div className="dashboard-header-actions">
            <span className="header-admin">
              <span className="header-admin-dot" />
              Sistema administrativo
            </span>

            <button
              className={`refresh-button ${cargando ? "refresh-spinning" : ""}`}
              onClick={() => cargarDatos()}
              disabled={cargando}
              title="Actualizar información"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {error && (
            <div className="dashboard-error">
              <CircleX size={18} />
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Cerrar">
                <X size={17} />
              </button>
            </div>
          )}

          {mensaje && (
            <div className="dashboard-success">
              <CircleCheck size={18} />
              <span>{mensaje}</span>
              <button onClick={() => setMensaje("")} aria-label="Cerrar">
                <X size={17} />
              </button>
            </div>
          )}

          {cargando ? (
            <div className="dashboard-loading">
              <div className="loading-spinner" />
              <strong>Cargando información</strong>
              <span>Estamos preparando el panel administrativo.</span>
            </div>
          ) : (
            <>
              {seccion === "resumen" && renderResumen()}
              {seccion === "inscripciones" && renderInscripciones()}
              {seccion === "reportes" && renderReportes()}
              {seccion === "configuracion" && renderConfiguracion()}
            </>
          )}
        </div>
      </main>

      {/* =====================================================
          MODAL DE DETALLES
      ===================================================== */}

      {inscripcionSeleccionada && (
        <div
          className="modal-overlay"
          onClick={() => setInscripcionSeleccionada(null)}
        >
          <section
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">REGISTRO DE VISITANTE</span>
                <h2>Detalles de inscripción</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setInscripcionSeleccionada(null)}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-visitor-heading">
                <div className="modal-visitor-avatar">
                  {obtenerIniciales(inscripcionSeleccionada.nombre)}
                </div>
                <div>
                  <h3>{inscripcionSeleccionada.nombre}</h3>
                  <span>
                    {inscripcionSeleccionada.tipo_visitante || "Visitante"}
                  </span>
                </div>
              </div>

              <div className="modal-fields">
                <div className="modal-field">
                  <Mail size={17} />
                  <div>
                    <span>Correo electrónico</span>
                    <strong>
                      {inscripcionSeleccionada.correo || "No registrado"}
                    </strong>
                  </div>
                </div>

                <div className="modal-field">
                  <Phone size={17} />
                  <div>
                    <span>Celular</span>
                    <strong>
                      {inscripcionSeleccionada.celular || "No registrado"}
                    </strong>
                  </div>
                </div>

                <div className="modal-field">
                  <Building2 size={17} />
                  <div>
                    <span>Institución educativa</span>
                    <strong>
                      {inscripcionSeleccionada.colegio || "No registrado"}
                    </strong>
                  </div>
                </div>

                <div className="modal-field">
                  <GraduationCap size={17} />
                  <div>
                    <span>Grado</span>
                    <strong>
                      {inscripcionSeleccionada.grado || "No registrado"}
                    </strong>
                  </div>
                </div>

                <div className="modal-field">
                  <MapPin size={17} />
                  <div>
                    <span>Distrito</span>
                    <strong>
                      {inscripcionSeleccionada.distrito || "No registrado"}
                    </strong>
                  </div>
                </div>

                <div className="modal-field">
                  <Users size={17} />
                  <div>
                    <span>Número de asistentes</span>
                    <strong>
                      {inscripcionSeleccionada.asistentes ?? 0}
                    </strong>
                  </div>
                </div>

                <div className="modal-field">
                  <CalendarDays size={17} />
                  <div>
                    <span>Fecha de registro</span>
                    <strong>
                      {formatearFechaCompleta(
                        inscripcionSeleccionada.fecha_registro
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="modal-status-section">
                <label htmlFor="estado-inscripcion">
                  Estado de la inscripción
                </label>

                <select
                  id="estado-inscripcion"
                  value={inscripcionSeleccionada.estado || "Pendiente"}
                  disabled={actualizando}
                  onChange={(e) =>
                    cambiarEstado(
                      inscripcionSeleccionada.id,
                      e.target.value
                    )
                  }
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="modal-delete-button"
                disabled={eliminandoId !== null}
                onClick={() =>
                  eliminarInscripcion(
                    inscripcionSeleccionada.id,
                    inscripcionSeleccionada.nombre
                  )
                }
              >
                <Trash2 size={17} />
                Eliminar inscripción
              </button>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setInscripcionSeleccionada(null)}
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
