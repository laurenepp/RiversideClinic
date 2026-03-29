<?php
require_once "../utils.php";

header('Content-Type: application/json');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_role("Administrator");

$data = read_json();

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "error" => "Invalid request body"
    ]);
    exit;
}

$first = trim($data["firstName"] ?? "");
$last = trim($data["lastName"] ?? "");
$email = trim($data["email"] ?? "");
$phone = trim($data["phone"] ?? "");
$roleName = trim($data["roleName"] ?? "");
$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if (
    $first === "" ||
    $last === "" ||
    $email === "" ||
    $phone === "" ||
    $roleName === "" ||
    $username === "" ||
    $password === ""
) {
    http_response_code(400);
    echo json_encode([
        "error" => "Missing required fields"
    ]);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
        SELECT Role_ID
        FROM Roles
        WHERE Role_Name = ?
        LIMIT 1
    ");
    $stmt->execute([$roleName]);
    $role = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$role) {
        throw new Exception("Invalid role");
    }

    $stmt = $pdo->prepare("
        INSERT INTO Users (
            First_Name,
            Last_Name,
            Role_ID,
            Phone_Number,
            Email,
            Is_Disabled
        )
        VALUES (?, ?, ?, ?, ?, 0)
    ");
    $stmt->execute([
        $first,
        $last,
        $role["Role_ID"],
        $phone,
        $email
    ]);

    $newUserId = (int)$pdo->lastInsertId();

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
    INSERT INTO User_Login_Info (
        User_ID,
        Username,
        Password_Hash,
        Must_Change_Password,
        Password_Changed_At
    )
    VALUES (?, ?, ?, 1, NULL)
");
$stmt->execute([
    $newUserId,
    $username,
    $hash
]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "userId" => $newUserId
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $message = "Unable to create user";

    if ($e instanceof PDOException && (int)$e->getCode() === 23000) {
        $message = "Username or email already exists";
    } elseif ($e->getMessage() === "Invalid role") {
        $message = "Invalid role";
    }

    http_response_code(400);
    echo json_encode([
        "error" => $message
    ]);
}