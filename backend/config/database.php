
<?php

class Database
{
    private string $host;
    private string $database;
    private string $username;
    private string $password;
    private string $port;

    public function __construct()
    {
        $this->host = getenv("DB_HOST") ?: "mysql";
        $this->database = getenv("DB_NAME") ?: "open_day_valle_grande";
        $this->username = getenv("DB_USER") ?: "open_day_user";
        $this->password = getenv("DB_PASSWORD") ?: "";
        $this->port = getenv("DB_PORT") ?: "3306";
    }

    public function connect(): PDO
    {
        try {
            $connection = new PDO(
                "mysql:host={$this->host};port={$this->port};dbname={$this->database};charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );

            return $connection;

        } catch (PDOException $e) {
            error_log("Error de conexión MySQL: " . $e->getMessage());

            throw new Exception(
                "No se pudo conectar con la base de datos."
            );
        }
    }
}
