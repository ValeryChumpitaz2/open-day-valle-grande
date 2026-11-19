<?php

ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Vary: Origin");

// =============================================
// 1. CONFIGURACIÓN CORS
// =============================================

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

$allowedOrigins = [
    "http://localhost:5173"
];

// Dominios configurados en Railway
$frontendUrls = getenv("FRONTEND_URLS") ?: "";

if (!empty($frontendUrls)) {
    $extraOrigins = explode(",", $frontendUrls);

    foreach ($extraOrigins as $url) {
        $url = trim($url);

        if (!empty($url)) {
            $allowedOrigins[] = rtrim($url, "/");
        }
    }
}

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: " . $origin);
    header("Access-Control-Allow-Credentials: true");
}

// =============================================
// 2. RESPUESTA OPTIONS
// =============================================

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// =============================================
// 3. CONEXIÓN A BASE DE DATOS
// =============================================

require_once __DIR__ . "/config/database.php";

try {

    $db = new Database();
    $conexion = $db->connect();

    if (!$conexion) {
        throw new Exception("No se pudo conectar a la base de datos.");
    }

    // =============================================
    // 4. MÉTODO GET - CONSULTA ADMINISTRATIVA
    // =============================================

    if ($_SERVER["REQUEST_METHOD"] === "GET") {

        session_start();

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
    // 5. MÉTODO POST - REGISTRAR INSCRIPCIÓN
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

        // -----------------------------------------
        // Compatibilidad de nombres React / PHP
        // -----------------------------------------

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

        $asistentes = trim($data["asistentes"] ?? "");

        // -----------------------------------------
        // Validar campos obligatorios
        // -----------------------------------------

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

        // -----------------------------------------
        // Validar longitud del nombre completo
        // -----------------------------------------

        $nombreCompleto = $nombres . " " . $apellidos;

        if (mb_strlen($nombreCompleto) > 150) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "El nombre completo supera los 150 caracteres."
            ]);

            exit;
        }

        // -----------------------------------------
        // Validar tipo de visitante
        // -----------------------------------------

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

        // -----------------------------------------
        // Validar celular
        // -----------------------------------------

        if (!preg_match("/^9[0-9]{8}$/", $celular)) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "El número de celular debe tener 9 dígitos y comenzar con 9."
            ]);

            exit;
        }

        // -----------------------------------------
        // Validar correo
        // -----------------------------------------

        if ($correo !== "" && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "El correo electrónico no es válido."
            ]);

            exit;
        }

        // -----------------------------------------
        // Validar datos académicos
        // -----------------------------------------

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

        // -----------------------------------------
        // Validar asistentes
        // -----------------------------------------

        $asistentesPermitidos = ["1", "2", "3", "4", "5"];

        if (!in_array($asistentes, $asistentesPermitidos, true)) {
            http_response_code(400);

            echo json_encode([
                "success" => false,
                "message" => "La cantidad de asistentes no es válida."
            ]);

            exit;
        }

        // -----------------------------------------
        // Validar longitudes de campos
        // -----------------------------------------

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
        // 6. INSERTAR EN MYSQL
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

        // =============================================
        // 7. RESPUESTA EXITOSA
        // =============================================

        http_response_code(201);

        echo json_encode([
            "success" => true,
            "message" => "¡Tu inscripción se registró correctamente!",
            "id" => $conexion->lastInsertId()
        ]);

        exit;
    }

    // =============================================
    // 8. MÉTODO NO PERMITIDO
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
