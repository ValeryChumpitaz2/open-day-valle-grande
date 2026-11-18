
<?php

class Database
{
    private $host = "mysql";
    private $database = "open_day_valle_grande";
    private $username = "open_day_user";
    private $password = "OpenDay_User_2026!";

    public function connect()
    {
        try {
            $connection = new PDO(
                "mysql:host={$this->host};dbname={$this->database};charset=utf8mb4",
                $this->username,
                $this->password
            );

            $connection->setAttribute(
                PDO::ATTR_ERRMODE,
                PDO::ERRMODE_EXCEPTION
            );

            return $connection;

        } catch (PDOException $e) {
            throw new Exception("No se pudo conectar con la base de datos.");
        }
    }
}
