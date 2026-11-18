<?php
ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

session_start();

function responder($codigo, $datos)
{
    http_response_code($codigo);

    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_SESSION["administrador"])) {
    responder(401, [
        "success" => false,
        "message" => "No tienes autorización para acceder."
    ]);
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responder(405, [
        "success" => false,
        "message" => "Método no permitido."
    ]);
}

require_once __DIR__ . "/config/database.php";

try {
    $database = new Database();
    $connection = $database->connect();

    $sqlEstadisticas = "
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendientes,
            SUM(CASE WHEN estado = 'Confirmada' THEN 1 ELSE 0 END) AS confirmadas,
            SUM(CASE WHEN estado = 'Cancelada' THEN 1 ELSE 0 END) AS canceladas
        FROM inscripciones
    ";

    $estadisticas = $connection
        ->query($sqlEstadisticas)
        ->fetch(PDO::FETCH_ASSOC);

    // Todas las inscripciones para el módulo administrativo.
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

    $inscripciones = $connection
        ->query($sqlInscripciones)
        ->fetchAll(PDO::FETCH_ASSOC);

    // Visitantes agrupados por tipo.
    $porTipo = $connection->query("
        SELECT tipo_visitante AS nombre, COUNT(*) AS total
        FROM inscripciones
        GROUP BY tipo_visitante
        ORDER BY total DESC
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Visitantes agrupados por distrito.
    $porDistrito = $connection->query("
        SELECT distrito AS nombre, COUNT(*) AS total
        FROM inscripciones
        WHERE distrito IS NOT NULL AND distrito <> ''
        GROUP BY distrito
        ORDER BY total DESC
        LIMIT 10
    ")->fetchAll(PDO::FETCH_ASSOC);

    // Actividad de los últimos siete días.
    $porDia = $connection->query("
        SELECT DATE(fecha_registro) AS fecha, COUNT(*) AS total
        FROM inscripciones
        WHERE fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(fecha_registro)
        ORDER BY fecha ASC
    ")->fetchAll(PDO::FETCH_ASSOC);

    responder(200, [
        "success" => true,
        "estadisticas" => [
            "total" => (int) ($estadisticas["total"] ?? 0),
            "pendientes" => (int) ($estadisticas["pendientes"] ?? 0),
            "confirmadas" => (int) ($estadisticas["confirmadas"] ?? 0),
            "canceladas" => (int) ($estadisticas["canceladas"] ?? 0)
        ],
        "inscripciones" => $inscripciones,
        "reportes" => [
            "por_tipo" => $porTipo,
            "por_distrito" => $porDistrito,
            "por_dia" => $porDia
        ],
        "administrador" => $_SESSION["administrador"]
    ]);

} catch (Throwable $e) {
    error_log("Error en dashboard: " . $e->getMessage());

    responder(500, [
        "success" => false,
        "message" => "No se pudieron cargar los datos del panel."
    ]);
}
