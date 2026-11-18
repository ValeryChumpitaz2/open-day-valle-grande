<?php

ob_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/config/database.php";

try {

    $database = new Database();
    $connection = $database->connect();

    ob_clean();

    echo json_encode([
        "success" => true,
        "message" => "API Open Day funcionando correctamente.",
        "database" => "Conexión MySQL exitosa."
    ]);

} catch (Exception $e) {

    ob_clean();

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}