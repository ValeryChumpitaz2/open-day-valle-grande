<?php

ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

// Configuración de la sesión
session_set_cookie_params([
    "lifetime" => 0,
    "path" => "/",
    "secure" => false,
    "httponly" => true,
    "samesite" => "Lax"
]);

session_start();

// Responder solicitudes OPTIONS
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    ob_end_clean();
    exit;
}

// Función para responder JSON
function responder($codigo, $datos)
{
    http_response_code($codigo);

    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Solo permitir POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, [
        "success" => false,
        "message" => "Método no permitido."
    ]);
}

require_once __DIR__ . "/config/database.php";

try {

    // Recibir información enviada desde React
    $datos = json_decode(file_get_contents("php://input"), true);

    if (!is_array($datos)) {
        responder(400, [
            "success" => false,
            "message" => "Solicitud inválida."
        ]);
    }

    $correo = trim($datos["correo"] ?? "");
    $password = $datos["password"] ?? "";

    if ($correo === "" || $password === "") {
        responder(400, [
            "success" => false,
            "message" => "Ingresa tu correo y contraseña."
        ]);
    }

    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        responder(400, [
            "success" => false,
            "message" => "El correo electrónico no es válido."
        ]);
    }

    // Conectar con MySQL
    $database = new Database();
    $connection = $database->connect();

    // Buscar administrador activo
    $sql = "SELECT id, nombre, correo, password
            FROM administradores
            WHERE correo = :correo
            AND activo = 1
            LIMIT 1";

    $stmt = $connection->prepare($sql);

    $stmt->execute([
        ":correo" => $correo
    ]);

    $administrador = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verificar contraseña
    if (
        !$administrador ||
        !password_verify($password, $administrador["password"])
    ) {
        responder(401, [
            "success" => false,
            "message" => "Correo o contraseña incorrectos."
        ]);
    }

    // Regenerar identificador de sesión
    session_regenerate_id(true);

    // Guardar información del administrador
    $_SESSION["administrador"] = [
        "id" => $administrador["id"],
        "nombre" => $administrador["nombre"],
        "correo" => $administrador["correo"]
    ];

    responder(200, [
        "success" => true,
        "message" => "Inicio de sesión exitoso.",
        "administrador" => [
            "id" => $administrador["id"],
            "nombre" => $administrador["nombre"],
            "correo" => $administrador["correo"]
        ]
    ]);

} catch (Throwable $e) {

    error_log("Error en login: " . $e->getMessage());

    responder(500, [
        "success" => false,
        "message" => "Ocurrió un error al procesar el inicio de sesión."
    ]);
}
