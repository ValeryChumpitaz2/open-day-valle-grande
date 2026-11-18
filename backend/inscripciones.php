<?php

ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Vary: Origin");

// Permitir el frontend local.
$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if ($origin === "http://localhost:5173") {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
}

// Gestionar solicitudes OPTIONS.
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    ob_end_clean();
    exit;
}

function responder($codigo, $datos)
{
    if (ob_get_level() > 0) {
        ob_clean();
    }

    http_response_code($codigo);

    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// Solo permitir GET y POST.
$metodo = $_SERVER["REQUEST_METHOD"];

if (!in_array($metodo, ["GET", "POST"], true)) {
    responder(405, [
        "success" => false,
        "message" => "Método no permitido."
    ]);
}

// Para consultar inscripciones necesitamos una sesión.
if ($metodo === "GET") {
    session_start();

    if (!isset($_SESSION["administrador"])) {
        responder(401, [
            "success" => false,
            "message" => "No tienes autorización para consultar las inscripciones."
        ]);
    }
}

require_once __DIR__ . "/config/database.php";

try {

    $database = new Database();
    $connection = $database->connect();

    // CONSULTAR INSCRIPCIONES: SOLO ADMINISTRADORES.
    if ($metodo === "GET") {

        $sql = "SELECT * FROM inscripciones
                ORDER BY fecha_registro DESC";

        $consulta = $connection->prepare($sql);
        $consulta->execute();

        $inscripciones = $consulta->fetchAll(PDO::FETCH_ASSOC);

        responder(200, [
            "success" => true,
            "data" => $inscripciones
        ]);
    }

    // REGISTRAR INSCRIPCIÓN: ACCESO PÚBLICO.
    if ($metodo === "POST") {

        $datos = json_decode(file_get_contents("php://input"), true);

        if (!is_array($datos)) {
            responder(400, [
                "success" => false,
                "message" => "Los datos enviados no son válidos."
            ]);
        }

        $nombre = trim($datos["nombre"] ?? "");
        $tipoVisitante = trim($datos["tipoVisitante"] ?? "");
        $celular = trim($datos["celular"] ?? "");
        $correo = trim($datos["correo"] ?? "");
        $colegio = trim($datos["colegio"] ?? "");
        $grado = trim($datos["grado"] ?? "");
        $distrito = trim($datos["distrito"] ?? "");
        $asistentes = trim((string)($datos["asistentes"] ?? ""));

        // Validar campos obligatorios.
        if (
            $nombre === "" ||
            $tipoVisitante === "" ||
            $celular === "" ||
            $distrito === "" ||
            $asistentes === ""
        ) {
            responder(400, [
                "success" => false,
                "message" => "Completa todos los campos obligatorios."
            ]);
        }

        // Validar tipo de visitante.
        $tiposPermitidos = [
            "Estudiante",
            "Padre o madre",
            "Tutor",
            "Otro familiar"
        ];

        if (!in_array($tipoVisitante, $tiposPermitidos, true)) {
            responder(400, [
                "success" => false,
                "message" => "El tipo de visitante no es válido."
            ]);
        }

        // Validar información del estudiante.
        if ($tipoVisitante === "Estudiante") {

            if ($colegio === "" || $grado === "") {
                responder(400, [
                    "success" => false,
                    "message" => "Indica tu colegio y grado de estudios."
                ]);
            }

        } else {
            $colegio = null;
            $grado = null;
        }

        // Validar correo opcional.
        if (
            $correo !== "" &&
            !filter_var($correo, FILTER_VALIDATE_EMAIL)
        ) {
            responder(400, [
                "success" => false,
                "message" => "El correo electrónico no tiene un formato válido."
            ]);
        }

        // Insertar inscripción.
        $sql = "INSERT INTO inscripciones
            (nombre, tipo_visitante, celular, correo, colegio, grado, distrito, asistentes)
            VALUES
            (:nombre, :tipo_visitante, :celular, :correo, :colegio, :grado, :distrito, :asistentes)";

        $consulta = $connection->prepare($sql);

        $consulta->execute([
            ":nombre" => $nombre,
            ":tipo_visitante" => $tipoVisitante,
            ":celular" => $celular,
            ":correo" => $correo !== "" ? $correo : null,
            ":colegio" => $colegio,
            ":grado" => $grado,
            ":distrito" => $distrito,
            ":asistentes" => $asistentes
        ]);

        responder(201, [
            "success" => true,
            "message" => "Inscripción registrada correctamente.",
            "id" => $connection->lastInsertId()
        ]);
    }

} catch (Throwable $e) {

    error_log("Error en inscripciones.php: " . $e->getMessage());

    responder(500, [
        "success" => false,
        "message" => "Ocurrió un error al procesar la solicitud."
    ]);
}
