<?php

ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Vary: Origin");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: 0");

// ======================================================
// 1. CONFIGURACIÓN CORS
// ======================================================

$origenesPermitidos = [
    "https://openday.vallegrande.edu.pe",
    "http://localhost:5173"
];

$origenesConfigurados = getenv("FRONTEND_URLS")
    ?: ($_ENV["FRONTEND_URLS"] ?? $_SERVER["FRONTEND_URLS"] ?? "");

if (!empty($origenesConfigurados)) {
    $origenesExtra = array_map(
        "trim",
        explode(",", $origenesConfigurados)
    );

    $origenesPermitidos = array_merge(
        $origenesPermitidos,
        $origenesExtra
    );
}

$origenesPermitidos = array_unique(
    array_filter($origenesPermitidos)
);

$origen = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origen, $origenesPermitidos, true)) {
    header("Access-Control-Allow-Origin: " . $origen);
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// ======================================================
// 2. FUNCIÓN DE RESPUESTA JSON
// ======================================================

function responder($codigo, $datos)
{
    http_response_code($codigo);

    if (ob_get_length() !== false) {
        ob_clean();
    }

    echo json_encode(
        $datos,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

// ======================================================
// 3. CONTROL DE ERRORES
// ======================================================

ini_set("display_errors", "0");
ini_set("log_errors", "1");
error_reporting(E_ALL);

// ======================================================
// 4. VALIDAR MÉTODO HTTP
// ======================================================

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responder(405, [
        "success" => false,
        "mensaje" => "Método no permitido."
    ]);
}

// ======================================================
// 5. CONFIGURACIÓN DE SESIÓN
// ======================================================

if (session_status() === PHP_SESSION_NONE) {

    session_set_cookie_params([
        "lifetime" => 0,
        "path" => "/",
        "secure" => true,
        "httponly" => true,
        "samesite" => "None"
    ]);

    session_start();
}

// ======================================================
// 6. VALIDAR ADMINISTRADOR
// ======================================================

$administrador = $_SESSION["administrador"]
    ?? $_SESSION["admin"]
    ?? null;

if (empty($administrador)) {
    responder(401, [
        "success" => false,
        "mensaje" => "Sesión no válida. Inicia sesión nuevamente."
    ]);
}

// ======================================================
// 7. CONEXIÓN A BASE DE DATOS
// ======================================================

try {

    require_once __DIR__ . "/config/database.php";

    $database = new Database();
    $conexion = $database->connect();

    if (!$conexion instanceof PDO) {
        throw new Exception(
            "La conexión a la base de datos no es válida."
        );
    }

    $conexion->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    $conexion->setAttribute(
        PDO::ATTR_DEFAULT_FETCH_MODE,
        PDO::FETCH_ASSOC
    );

    // ==================================================
    // 8. ESTADÍSTICAS GENERALES
    // ==================================================

    $sqlEstadisticas = "
        SELECT
            COUNT(*) AS total,
            SUM(CASE
                WHEN estado = 'Pendiente' THEN 1
                ELSE 0
            END) AS pendientes,
            SUM(CASE
                WHEN estado = 'Confirmada' THEN 1
                ELSE 0
            END) AS confirmadas,
            SUM(CASE
                WHEN estado = 'Cancelada' THEN 1
                ELSE 0
            END) AS canceladas
        FROM inscripciones
    ";

    $consultaEstadisticas = $conexion->query(
        $sqlEstadisticas
    );

    $estadisticas = $consultaEstadisticas->fetch();

    $estadisticasFinales = [
        "total" => (int) ($estadisticas["total"] ?? 0),
        "pendientes" => (int) ($estadisticas["pendientes"] ?? 0),
        "confirmadas" => (int) ($estadisticas["confirmadas"] ?? 0),
        "canceladas" => (int) ($estadisticas["canceladas"] ?? 0)
    ];

    // ==================================================
    // 9. LISTADO DE INSCRIPCIONES
    // ==================================================

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

    $consultaInscripciones = $conexion->query(
        $sqlInscripciones
    );

    $inscripciones = $consultaInscripciones->fetchAll();

    // ==================================================
    // 10. REPORTE POR TIPO DE VISITANTE
    // ==================================================

    $sqlPorTipo = "
        SELECT
            tipo_visitante AS tipo,
            COUNT(*) AS cantidad
        FROM inscripciones
        GROUP BY tipo_visitante
        ORDER BY cantidad DESC
    ";

    $consultaPorTipo = $conexion->query($sqlPorTipo);

    $porTipo = $consultaPorTipo->fetchAll();

    // ==================================================
    // 11. REPORTE POR DISTRITO
    // ==================================================

    $sqlPorDistrito = "
        SELECT
            distrito,
            COUNT(*) AS cantidad
        FROM inscripciones
        GROUP BY distrito
        ORDER BY cantidad DESC
    ";

    $consultaPorDistrito = $conexion->query($sqlPorDistrito);

    $porDistrito = $consultaPorDistrito->fetchAll();

    // ==================================================
    // 12. REPORTE POR DÍA (ÚLTIMOS 7 DÍAS)
    // ==================================================

    $sqlPorDia = "
        SELECT
            DATE(fecha_registro) AS fecha,
            COUNT(*) AS cantidad
        FROM inscripciones
        WHERE fecha_registro >= DATE_SUB(
            CURDATE(),
            INTERVAL 6 DAY
        )
        GROUP BY DATE(fecha_registro)
        ORDER BY fecha ASC
    ";

    $consultaPorDia = $conexion->query($sqlPorDia);

    $porDia = $consultaPorDia->fetchAll();

    // ==================================================
    // 13. NORMALIZAR VALORES
    // ==================================================

    foreach ($porTipo as &$fila) {
        $fila["cantidad"] = (int) $fila["cantidad"];
    }
    unset($fila);

    foreach ($porDistrito as &$fila) {
        $fila["cantidad"] = (int) $fila["cantidad"];
    }
    unset($fila);

    foreach ($porDia as &$fila) {
        $fila["cantidad"] = (int) $fila["cantidad"];
    }
    unset($fila);

    foreach ($inscripciones as &$fila) {

        $fila["id"] = (int) $fila["id"];

        $fila["asistentes"] = (int) (
            $fila["asistentes"] ?? 0
        );
    }
    unset($fila);

    // ==================================================
    // 14. RESPUESTA FINAL
    // ==================================================

    responder(200, [
        "success" => true,

        "mensaje" => "Dashboard cargado correctamente.",

        "estadisticas" => $estadisticasFinales,

        "inscripciones" => $inscripciones,

        "reportes" => [
            "por_tipo" => $porTipo,
            "por_distrito" => $porDistrito,
            "por_dia" => $porDia
        ],

        "administrador" => $administrador,

        "admin" => $administrador
    ]);

} catch (Throwable $error) {

    error_log(
        "ERROR DASHBOARD: " . $error->getMessage()
    );

    responder(500, [
        "success" => false,
        "mensaje" => "Ocurrió un error al cargar el dashboard.",
        "error" => $error->getMessage()
    ]);
}
