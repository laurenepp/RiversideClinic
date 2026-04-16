<?php

$host = "127.0.0.1";
$db = "riversideclinicdb";
$user = "root";
$pass = "root123";
$charset = "utf8mb4";
$dsn = "mysql:host=$host;port=3306;dbname=$db;charset=$charset";

// F-09 session timeout settings
define('SESSION_IDLE_TIMEOUT', 300);     // 5 minutes
define('SESSION_MAX_LIFETIME', 14400);   // 4 hours

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json");
    echo json_encode([
        "error" => "DB Connection failed"
    ]);
    exit;
}

// Safer session cookie settings
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

if (isset($_SESSION['user'])) {
    $now = time();

    // Set baseline timestamps if they do not exist yet
    if (!isset($_SESSION['created_at']) || !is_numeric($_SESSION['created_at'])) {
        $_SESSION['created_at'] = $now;
    }

    if (!isset($_SESSION['last_active']) || !is_numeric($_SESSION['last_active'])) {
        $_SESSION['last_active'] = $now;
    }

    $idleElapsed = $now - (int)$_SESSION['last_active'];
    $lifeElapsed = $now - (int)$_SESSION['created_at'];

    if ($idleElapsed > SESSION_IDLE_TIMEOUT || $lifeElapsed > SESSION_MAX_LIFETIME) {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'] ?? '/',
                $params['domain'] ?? '',
                !empty($params['secure']),
                !empty($params['httponly'])
            );
        }

        session_destroy();

        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            "error" => "Session expired"
        ]);
        exit;
    }

    $_SESSION['last_active'] = $now;
}

header('Content-Type: application/json');

?>