<?php

ob_start();

/* =====================================================
   CONFIGURACIÓN GENERAL Y CORS
===================================================== */

header("Content-Type: application/json; charset=UTF-8");
header("Vary: Origin");
header("Cache-Control: no-store, no-cache, must-revalidate");

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

// Orígenes permitidos.
// En Railway configura FRONTEND_URLS con los dominios separados por comas.
$allowedOrigins = [
    "http://localhost:5173",
    "https://openday.vallegrande.edu.pe"
];

$frontendUrls = getenv("FRONTEND_URLS") ?: "";

if (!empty($frontendUrls)) {
    $additionalOrigins = array_map(
        "trim",
        explode(",", $frontendUrls)
    );

    $allowedOrigins = array_merge(
        $allowedOrigins,
        $additionalOrigins
    );
}

$allowedOrigins = array_unique($allowedOrigins);

if ($origin !== "" && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

/* =====================================================
   SOLICITUDES PREFLIGHT
===================================================== */

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

/* =====================================================
   CONFIGURACIÓN DE SESIÓN
===================================================== */

// Debe coincidir con la configuración de login.php.
session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "secure" => true,
    "httponly" => true,
    "samesite" => "None"
]);

session_start();

/* =====================================================
   FUNCIÓN PARA RESPONDER JSON
===================================================== */

function responder($codigo, $datos)
{
    http_response_code($codigo);

    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode(
        $datos,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

/* =====================================================
   VALIDAR MÉTODO HTTP
===================================================== */

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responder(405, [
        "success" => false,
        "message" => "Método no permitido."
    ]);
}

/* =====================================================
   VALIDAR SESIÓN DEL ADMINISTRADOR
===================================================== */

if (!isset($_SESSION["administrador"])) {
    responder(401, [
        "success" => false,
        "message" => "Tu sesión ha expirado. Inicia sesión nuevamente."
    ]);
}

/* =====================================================
   CONEXIÓN Y CONSULTAS
===================================================== */

try {

    require_once __DIR__ . "/config/database.php";

    $database = new Database();
    $connection = $database->connect();

    if (!$connection) {
        throw new Exception("No se pudo establecer la conexión con la base de datos.");
    }

    /* =============================================
       ESTADÍSTICAS GENERALES
    ============================================= */

    $sqlEstadisticas = "
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes,
            SUM(CASE WHEN estado = 'Confirmada' THEN 1 ELSE 0 END) AS confirmadas,
            SUM(CASE WHEN estado = 'Cancelada' THEN 1 ELSE 0 END) AS canceladas
        FROM inscripciones
    ";

    $consultaEstadisticas = $connection->query($sqlEstadisticas);

    $estadisticas = $consultaEstadisticas->fetch(PDO::FETCH_ASSOC);

    /* =============================================
       LISTADO DE INSCRIPCIONES
    ============================================= */

    $sqlInscripciones = "
        SELECT
            id,
            nombre,
            tipo_visitante,
            celular,
            correo,
            colegio,
            grado,
            distrito,
            asistentes,
            fecha_registro,
            estado
        FROM inscripciones
        ORDER BY fecha_registro DESC
    ";

    $consultaInscripciones = $connection->query($sqlInscripciones);

    $inscripciones = $consultaInscripciones->fetchAll(PDO::FETCH_ASSOC);

    /* =============================================
       REPORTE POR TIPO DE VISITANTE
    ============================================= */

    $sqlPorTipo = "
        SELECT
            tipo_visitante AS nombre,
            COUNT(*) AS total
        FROM inscripciones
        GROUP BY tipo_visitante
        ORDER BY total DESC
    ";

    $porTipo = $connection
        ->query($sqlPorTipo)
        ->fetchAll(PDO::FETCH_ASSOC);

    /* =============================================
       REPORTE POR DISTRITO
    ============================================= */

    $sqlPorDistrito = "
        SELECT
            distrito AS nombre,
            COUNT(*) AS total
        FROM inscripciones
        WHERE distrito IS NOT NULL
          AND distrito <> ''
        GROUP BY distrito
        ORDER BY total DESC
        LIMIT 10
    ";

    $porDistrito = $connection
        ->query($sqlPorDistrito)
        ->fetchAll(PDO::FETCH_ASSOC);

    /* =============================================
       ACTIVIDAD DE LOS ÚLTIMOS SIETE DÍAS
    ============================================= */

    $sqlPorDia = "
        SELECT
            DATE(fecha_registro) AS fecha,
            COUNT(*) AS total
        FROM inscripciones
        WHERE fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(fecha_registro)
        ORDER BY fecha ASC
    ";

    $porDia = $connection
        ->query($sqlPorDia)
        ->fetchAll(PDO::FETCH_ASSOC);

    /* =============================================
       NORMALIZAR ESTADÍSTICAS
    ============================================= */

    $estadisticasFinales = [
        "total" => (int) ($estadisticas["total"] ?? 0),
        "pendientes" => (int) ($estadisticas["pendientes"] ?? 0),
        "confirmadas" => (int) ($estadisticas["confirmadas"] ?? 0),
        "canceladas" => (int) ($estadisticas["canceladas"] ?? 0)
    ];

    /* =============================================
       RESPUESTA FINAL
    ============================================= */

    responder(200, [
        "success" => true,
        "estadisticas" => $estadisticasFinales,
        "inscripciones" => $inscripciones,
        "reportes" => [
            "por_tipo" => $porTipo,
            "por_distrito" => $porDistrito,
            "por_dia" => $porDia
        ],

        // Se incluyen ambas propiedades para compatibilidad
        // con las versiones del Dashboard.jsx.
        "administrador" => $_SESSION["administrador"],
        "admin" => $_SESSION["administrador"]
    ]);

} catch (Throwable $e) {

    error_log("Error en dashboard.php: " . $e->getMessage());

    responder(500, [
        "success" => false,
        "message" => "No se pudieron cargar los datos del panel."
    ]);
}
