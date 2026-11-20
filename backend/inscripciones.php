
<?php

ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Vary: Origin");

// =============================================
// 1. CONFIGURACIÓN CORS
// =============================================

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

$frontendUrls = getenv("FRONTEND_URLS")
    ?: "http://localhost:5173";

$allowedOrigins = array_map(
    "trim",
    explode(",", $frontendUrls)
);

$allowedOrigins = array_map(
    fn($url) => rtrim($url, "/"),
    $allowedOrigins
);

$allowedOrigins[] = "http://localhost:5173";

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
} elseif ($origin !== "") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Origen no autorizado."
    ]);
    exit;
}

// =============================================
// 2. SOLICITUD OPTIONS
// =============================================

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// =============================================
// 3. SESIÓN ADMINISTRATIVA
// =============================================

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

// =============================================
// 4. CONEXIÓN A BASE DE DATOS
// =============================================

require_once __DIR__ . "/config/database.php";

try {

    $db = new Database();
    $conexion = $db->connect();

    if (!$conexion) {
        throw new Exception("No se pudo conectar a la base de datos.");
    }

    // =============================================
    // 5. GET - CONSULTAR INSCRIPCIONES
    // =============================================

    if ($_SERVER["REQUEST_METHOD"] === "GET") {

        if (!isset($_SESSION["administrador"])) {
            http_response_code(401);

            echo json_encode([
                "success" => false,
                "message" => "No tienes autorización para consultar las inscripciones."
            ]);

            exit;
        }

        $sql = "SELECT * FROM inscripciones ORDER BY fecha_registro DESC";

        $stmt = $conexion->prepare($sql);
        $stmt->execute();

        $inscripciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "success" => true,
            "data" => $inscripciones
        ]);

        exit;
    }

    // =============================================
    // 6. POST - REGISTRAR INSCRIPCIÓN
    // =============================================

    if ($_SERVER["REQUEST_METHOD"] === "POST") {

        $contenido = file_get_contents("php://input");
        $data = json_decode($contenido, true);

        if (!is_array($data)) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "Los datos enviados no tienen un formato JSON válido."
            ]);

            exit;
        }

        $nombres = trim($data["nombres"] ?? "");
        $apellidos = trim($data["apellidos"] ?? "");

        $tipoVisitante = trim(
            $data["tipoVisitante"]
            ?? $data["tipo_visitante"]
            ?? ""
        );

        $celular = trim($data["celular"] ?? "");
        $correo = trim($data["correo"] ?? "");

        $colegio = trim($data["colegio"] ?? "");
        $grado = trim($data["grado"] ?? "");

        $departamento = trim($data["departamento"] ?? "");
        $provincia = trim($data["provincia"] ?? "");
        $distrito = trim($data["distrito"] ?? "");

        $asistentes = trim((string)($data["asistentes"] ?? ""));

        // =============================================
        // VALIDAR CAMPOS OBLIGATORIOS
        // =============================================

        $camposObligatorios = [
            "nombres" => $nombres,
            "apellidos" => $apellidos,
            "tipo de visitante" => $tipoVisitante,
            "celular" => $celular,
            "distrito" => $distrito,
            "cantidad de asistentes" => $asistentes
        ];

        foreach ($camposObligatorios as $campo => $valor) {

            if ($valor === "") {
                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "El campo {$campo} es obligatorio."
                ]);

                exit;
            }
        }

        // =============================================
        // VALIDAR NOMBRE
        // =============================================

        $nombreCompleto = $nombres . " " . $apellidos;

        if (mb_strlen($nombreCompleto) > 150) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "El nombre completo supera los 150 caracteres."
            ]);

            exit;
        }

        // =============================================
        // VALIDAR TIPO DE VISITANTE
        // =============================================

        $tiposPermitidos = [
            "Estudiante",
            "Padre o madre",
            "Tutor",
            "Otro familiar"
        ];

        if (!in_array($tipoVisitante, $tiposPermitidos, true)) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "El tipo de visitante no es válido."
            ]);

            exit;
        }

        // =============================================
        // VALIDAR CELULAR
        // =============================================

        if (!preg_match("/^9[0-9]{8}$/", $celular)) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "El número de celular debe tener 9 dígitos y comenzar con 9."
            ]);

            exit;
        }

        // =============================================
        // VALIDAR CORREO
        // =============================================

        if ($correo !== "" && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "El correo electrónico no es válido."
            ]);

            exit;
        }

        // =============================================
        // VALIDAR DATOS ACADÉMICOS
        // =============================================

        if ($tipoVisitante === "Estudiante") {

            if ($colegio === "" || $grado === "") {
                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "Debes completar el colegio y el grado."
                ]);

                exit;
            }

        } else {
            $colegio = "";
            $grado = "";
        }

        // =============================================
        // VALIDAR ASISTENTES
        // =============================================

        $asistentesPermitidos = ["1", "2", "3", "4", "5"];

        if (!in_array($asistentes, $asistentesPermitidos, true)) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "La cantidad de asistentes no es válida."
            ]);

            exit;
        }

        // =============================================
        // VALIDAR LONGITUDES
        // =============================================

        $limites = [
            "correo" => [$correo, 150],
            "colegio" => [$colegio, 150],
            "grado" => [$grado, 50],
            "departamento" => [$departamento, 100],
            "provincia" => [$provincia, 100],
            "distrito" => [$distrito, 100]
        ];

        foreach ($limites as $campo => $configuracion) {

            [$valor, $maximo] = $configuracion;

            if (mb_strlen($valor) > $maximo) {
                http_response_code(400);

                echo json_encode([
                    "success" => false,
                    "message" => "El campo {$campo} supera el máximo permitido."
                ]);

                exit;
            }
        }

        // =============================================
        // INSERTAR EN MYSQL
        // =============================================

        $sql = "INSERT INTO inscripciones (
            nombre,
            nombres,
            apellidos,
            tipo_visitante,
            celular,
            correo,
            departamento,
            provincia,
            colegio,
            grado,
            distrito,
            asistentes,
            fecha_registro,
            estado
        ) VALUES (
            :nombre,
            :nombres,
            :apellidos,
            :tipo_visitante,
            :celular,
            :correo,
            :departamento,
            :provincia,
            :colegio,
            :grado,
            :distrito,
            :asistentes,
            CURRENT_TIMESTAMP,
            'Pendiente'
        )";

        $stmt = $conexion->prepare($sql);

        $stmt->execute([
            ":nombre" => $nombreCompleto,
            ":nombres" => $nombres,
            ":apellidos" => $apellidos,
            ":tipo_visitante" => $tipoVisitante,
            ":celular" => $celular,
            ":correo" => $correo !== "" ? $correo : null,
            ":departamento" => $departamento !== "" ? $departamento : null,
            ":provincia" => $provincia !== "" ? $provincia : null,
            ":colegio" => $colegio !== "" ? $colegio : null,
            ":grado" => $grado !== "" ? $grado : null,
            ":distrito" => $distrito,
            ":asistentes" => $asistentes
        ]);

        http_response_code(201);

        echo json_encode([
            "success" => true,
            "message" => "¡Tu inscripción se registró correctamente!",
            "id" => $conexion->lastInsertId()
        ]);

        exit;
    }

    // =============================================
    // MÉTODO NO PERMITIDO
    // =============================================

    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Método no permitido."
    ]);

} catch (Throwable $e) {

    error_log("Error en inscripciones.php: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Ocurrió un error interno al procesar la inscripción."
    ]);
}
