<?php
ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
        "message" => "No tienes autorización."
    ]);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, [
        "success" => false,
        "message" => "Método no permitido."
    ]);
}

$datos = json_decode(file_get_contents("php://input"), true);

$id = isset($datos["id"]) ? (int) $datos["id"] : 0;
$estado = $datos["estado"] ?? "";

$estadosPermitidos = ["Pendiente", "Confirmada", "Cancelada"];

if ($id <= 0 || !in_array($estado, $estadosPermitidos, true)) {
    responder(400, [
        "success" => false,
        "message" => "Los datos enviados no son válidos."
    ]);
}

require_once __DIR__ . "/config/database.php";

try {
    $database = new Database();
    $connection = $database->connect();

    $sql = "
        UPDATE inscripciones
        SET estado = :estado
        WHERE id = :id
    ";

    $stmt = $connection->prepare($sql);
    $stmt->execute([
        ":estado" => $estado,
        ":id" => $id
    ]);

    if ($stmt->rowCount() === 0) {
        $verificar = $connection->prepare(
            "SELECT id FROM inscripciones WHERE id = :id"
        );
        $verificar->execute([":id" => $id]);

        if (!$verificar->fetch()) {
            responder(404, [
                "success" => false,
                "message" => "No se encontró la inscripción."
            ]);
        }
    }

    responder(200, [
        "success" => true,
        "message" => "Estado actualizado correctamente."
    ]);

} catch (Throwable $e) {
    error_log("Error al actualizar estado: " . $e->getMessage());

    responder(500, [
        "success" => false,
        "message" => "No se pudo actualizar el estado."
    ]);
}
