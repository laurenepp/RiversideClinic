<?php
require_once "../utils.php";

header('Content-Type: application/json');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$user = require_login();
$data = read_json();

$newPassword = $data["newPassword"] ?? "";
$confirmPassword = $data["confirmPassword"] ?? "";

if ($newPassword === "" || $confirmPassword === "") {
    http_response_code(400);
    echo json_encode([
        "error" => "Both password fields are required"
    ]);
    exit;
}

if ($newPassword !== $confirmPassword) {
    http_response_code(400);
    echo json_encode([
        "error" => "Passwords do not match"
    ]);
    exit;
}

$pattern = '/^(?=.*[A-Z])(?=.*[a-z])(?=.*[^A-Za-z0-9]).{8,}$/';

if (!preg_match($pattern, $newPassword)) {
    http_response_code(400);
    echo json_encode([
        "error" => "Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 special character"
    ]);
    exit;
}

try {
    $hash = password_hash($newPassword, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        UPDATE User_Login_Info
        SET
            Password_Hash = ?,
            Must_Change_Password = 0,
            Password_Changed_At = NOW()
        WHERE User_ID = ?
        LIMIT 1
    ");
    $stmt->execute([
        $hash,
        (int)$user["id"]
    ]);

    $_SESSION["user"]["mustChangePassword"] = false;

    echo json_encode([
        "success" => true
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Unable to update password"
    ]);
}