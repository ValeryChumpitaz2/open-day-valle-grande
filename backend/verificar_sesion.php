
<?php

require_once __DIR__ . "/config/database.php";

$mensaje = "";
$tipoMensaje = "";

try {
    $database = new Database();
    $connection = $database->connect();

    // Verificar si ya existe un administrador
    $consulta = $connection->query(
        "SELECT COUNT(*) FROM administradores"
    );

    $totalAdministradores = $consulta->fetchColumn();

    if ($totalAdministradores > 0) {
        die("Ya existe un administrador. El registro inicial está deshabilitado.");
    }

    if ($_SERVER["REQUEST_METHOD"] === "POST") {

        $nombre = trim($_POST["nombre"] ?? "");
        $correo = trim($_POST["correo"] ?? "");
        $password = $_POST["password"] ?? "";

        if ($nombre === "" || $correo === "" || $password === "") {
            throw new Exception("Completa todos los campos.");
        }

        if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            throw new Exception("Ingresa un correo electrónico válido.");
        }

        if (strlen($password) < 10) {
            throw new Exception("La contraseña debe tener al menos 10 caracteres.");
        }

        // Generar hash seguro de la contraseña
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        // Registrar administrador
        $sql = "INSERT INTO administradores
                (nombre, correo, password)
                VALUES (:nombre, :correo, :password)";

        $stmt = $connection->prepare($sql);

        $stmt->execute([
            ":nombre" => $nombre,
            ":correo" => $correo,
            ":password" => $passwordHash
        ]);

        $mensaje = "Administrador creado correctamente.";
        $tipoMensaje = "success";
    }

} catch (Exception $e) {
    $mensaje = $e->getMessage();
    $tipoMensaje = "error";
}

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crear administrador | Open Day</title>
</head>
<body>

    <h2>Crear administrador</h2>
    <p>Configuración inicial del panel administrativo.</p>

    <?php if ($mensaje !== ""): ?>
        <p style="color: <?= $tipoMensaje === 'success' ? 'green' : 'red' ?>">
            <?= htmlspecialchars($mensaje) ?>
        </p>
    <?php endif; ?>

    <?php if (isset($totalAdministradores) && $totalAdministradores === 0): ?>

        <form method="POST">

            <label>Nombre completo</label><br>
            <input type="text" name="nombre" required>
            <br><br>

            <label>Correo electrónico</label><br>
            <input type="email" name="correo" required>
            <br><br>

            <label>Contraseña</label><br>
            <input type="password" name="password" minlength="10" required>
            <br><br>

            <button type="submit">Crear administrador</button>

        </form>

    <?php endif; ?>

</body>
</html>
