<?php
$host = "127.0.0.1";
$db   = "riversideclinicdb";
$user = "root";
$pass = "root123";
$charset = "utf8mb4";

$dsn = "mysql:host=$host;port=3306;dbname=$db;charset=$charset";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
  http_response_code(500);
  header("Content-Type: application/json");
  echo json_encode([
    "error" => "DB Connection failed",
    "details" => $e->getMessage(),
    "db" => $db,
    "host" => $host,
    "dsn" => $dsn
  ]);
  exit;
}

session_start();
header('Content-Type: application/json');
?>