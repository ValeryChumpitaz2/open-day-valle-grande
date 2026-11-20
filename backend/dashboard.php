
<?php

ob_start();

header("Content-Type: application/json; charset=UTF-8");
header("Vary: Origin");

$origenesPermitidos = [
    "https://openday.vallegrande.edu.pe",
    "http://localhost:5173"
];

// Leer los dominios configurados en Railway.
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

$origen = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origen, $origenesPermitidos, true)) {
    header("Access-Control-Allow-Origin: " . $origen);
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Continúa aquí tu código original:
// session_set_cookie_params(...);
// session_start();
