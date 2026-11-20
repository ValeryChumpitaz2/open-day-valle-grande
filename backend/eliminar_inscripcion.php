
<?php

ob_start();

header("Content-Type: application/json; charset=UTF-8");

$origenesPermitidos = array_filter(
    array_map(
        "trim",
        explode(",", getenv("FRONTEND_URLS") ?: "")
    )
);

$origen = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origen, $origenesPermitidos, true)) {
    header("Access-Control-Allow-Origin: " . $origen);
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

function responder($success, $mensaje, $codigo = 200)
{
    http_response_code($codigo);

    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode(
        [
            "success" => $success,
            "mensaje" => $mensaje
        ],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(false, "Método no permitido.", 405);
}

session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "secure" => true,
    "httponly" => true,
    "samesite" => "None"
]);

session_start();

// Validar sesión administrativa
if (
    empty($_SESSION["administrador"]) &&
    empty($_SESSION["admin"])
) {
    responder(false, "Sesión no autorizada. Inicia sesión nuevamente.", 401);
}

// Leer información enviada por React
$datos = json_decode(file_get_contents("php://input"), true);

if (!is_array($datos) || !isset($datos["id"])) {
    responder(false, "No se recibió el identificador de la inscripción.", 400);
}

$id = filter_var(
    $datos["id"],
    FILTER_VALIDATE_INT,
    ["options" => ["min_range" => 1]]
);

if ($id === false) {
    responder(false, "El identificador de la inscripción no es válido.", 400);
}

try {
    require_once __DIR__ . "/config/database.php";
    $database = new Database();
    $conexion = $database->connect();

    // Comprobar que el registro exista
    $consulta = $conexion->prepare(
        "SELECT id FROM inscripciones WHERE id = :id LIMIT 1"
    );

    $consulta->execute([
        ":id" => $id
    ]);

    if (!$consulta->fetch()) {
        responder(false, "La inscripción no existe o ya fue eliminada.", 404);
    }

    // Eliminar inscripción
    $eliminar = $conexion->prepare(
        "DELETE FROM inscripciones WHERE id = :id"
    );

    $eliminar->execute([
        ":id" => $id
    ]);

    if ($eliminar->rowCount() !== 1) {
        responder(false, "No se pudo eliminar la inscripción.", 500);
    }

    responder(true, "Inscripción eliminada correctamente.");

} catch (Throwable $e) {
    error_log("Error al eliminar inscripción: " . $e->getMessage());

    responder(
        false,
        "Ocurrió un error al eliminar la inscripción.",
        500
    );
}
