<?php

ob_start();

ini_set("display_errors", "0");
ini_set("log_errors", "1");
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Vary: Origin");

$frontends = getenv("FRONTEND_URLS")
    ?: "https://openday.vallegrande.edu.pe,http://localhost:5173";

$origenesPermitidos = array_filter(
    array_map("trim", explode(",", $frontends))
);

$origen = $_SERVER["HTTP_ORIGIN"] ?? "";

if ($origen !== "" && in_array($origen, $origenesPermitidos, true)) {
    header("Access-Control-Allow-Origin: " . $origen);
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");

function responder($codigo, $datos)
{
    http_response_code($codigo);

    if (ob_get_level() > 0 && ob_get_length() !== false) {
        ob_clean();
    }

    echo json_encode(
        $datos,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}

// Preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Validar método
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, [
        "success" => false,
        "mensaje" => "Método no permitido."
    ]);
}

// Configuración de sesión: igual que login.php
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

// Validar administrador
$administrador = $_SESSION["administrador"] ?? null;

if (
    !is_array($administrador) ||
    empty($administrador["id"])
) {
    responder(401, [
        "success" => false,
        "mensaje" => "Sesión no autorizada. Inicia sesión nuevamente."
    ]);
}

// Leer JSON
$datos = json_decode(file_get_contents("php://input"), true);

if (!is_array($datos) || !isset($datos["id"])) {
    responder(400, [
        "success" => false,
        "mensaje" => "No se recibió el ID de la inscripción."
    ]);
}

$id = filter_var(
    $datos["id"],
    FILTER_VALIDATE_INT,
    ["options" => ["min_range" => 1]]
);

if ($id === false) {
    responder(400, [
        "success" => false,
        "mensaje" => "El ID de la inscripción no es válido."
    ]);
}

try {

    // Conexión a MySQL
    require_once __DIR__ . "/config/database.php";

    $database = new Database();
    $conexion = $database->connect();

    // Eliminar registro
    $sql = "DELETE FROM inscripciones WHERE id = :id";

    $consulta = $conexion->prepare($sql);

    $consulta->execute([
        ":id" => $id
    ]);

    if ($consulta->rowCount() !== 1) {
        responder(404, [
            "success" => false,
            "mensaje" => "La inscripción no existe o ya fue eliminada."
        ]);
    }

    responder(200, [
        "success" => true,
        "mensaje" => "Inscripción eliminada correctamente.",
        "id" => $id
    ]);

} catch (Throwable $error) {

    error_log(
        "ERROR ELIMINAR INSCRIPCIÓN: " . $error->getMessage()
    );

    responder(500, [
        "success" => false,
        "mensaje" => "No se pudo eliminar la inscripción. Revisa los registros del servidor."
    ]);
}
