<?php
require_once "../utils.php";

header('Content-Type: application/json');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_role("Administrator");

$data = read_json();

$userId   = (int)($data["userId"] ?? 0);
$first    = trim($data["firstName"] ?? "");
$last     = trim($data["lastName"] ?? "");
$email    = trim($data["email"] ?? "");
$phone    = trim($data["phone"] ?? "");
$roleName = trim($data["roleName"] ?? "");
$password = (string)($data["password"] ?? "");

if ($userId <= 0 || $first === "" || $last === "" || $email === "" || $phone === "" || $roleName === "") {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing fields"]);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT Role_ID FROM Roles WHERE Role_Name = ? LIMIT 1");
    $stmt->execute([$roleName]);
    $role = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$role) {
        throw new Exception("Invalid roleName");
    }

    $stmt = $pdo->prepare("
        UPDATE Users
        SET First_Name = ?, Last_Name = ?, Email = ?, Phone_Number = ?, Role_ID = ?
        WHERE User_ID = ?
    ");
    $stmt->execute([$first, $last, $email, $phone, $role["Role_ID"], $userId]);

    $passwordReset = false;

    if ($password !== "") {
        $hash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            UPDATE User_Login_Info
            SET Password_Hash = ?, Must_Change_Password = 1, Password_Changed_At = NULL
            WHERE User_ID = ?
        ");
        $stmt->execute([$hash, $userId]);

        $passwordReset = true;
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "passwordReset" => $passwordReset
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(400);
    echo json_encode([
        "error" => $e->getMessage() ?: "Unable to update user"
    ]);
}