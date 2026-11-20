<?php

class Database
{
    private string $host;
    private string $database;
    private string $username;
    private string $password;
    private int $port;

    public function __construct()
    {
        $this->host = getenv("DB_HOST") ?: "mysql";

        $this->database = getenv("DB_NAME")
            ?: "open_day_valle_grande";

        $this->username = getenv("DB_USER")
            ?: "open_day_user";

        $this->password = getenv("DB_PASSWORD") ?: "";

        $this->port = (int) (getenv("DB_PORT") ?: 3306);
    }

    public function connect(): PDO
    {
        try {

            if (
                empty($this->host) ||
                empty($this->database) ||
                empty($this->username) ||
                $this->port <= 0
            ) {
                throw new Exception(
                    "La configuración de la base de datos está incompleta."
                );
            }

            $dsn = "mysql:host={$this->host};"
                . "port={$this->port};"
                . "dbname={$this->database};"
                . "charset=utf8mb4";

            $connection = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_PERSISTENT => false
                ]
            );

            return $connection;

        } catch (PDOException $e) {

            error_log(
                "ERROR MYSQL: " . $e->getMessage()
            );

            throw new Exception(
                "No se pudo establecer la conexión con la base de datos."
            );

        } catch (Throwable $e) {

            error_log(
                "ERROR DATABASE: " . $e->getMessage()
            );

            throw new Exception(
                "Error en la configuración de la base de datos."
            );
        }
    }
}
