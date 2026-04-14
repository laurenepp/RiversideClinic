<?php
session_start();
require_once "../config.php";
require_once "../utils.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "error" => "Invalid request body"
    ]);
    exit;
}

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode([
        "error" => "Username and password are required"
    ]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Is_Disabled,
        r.Role_Name,
        li.Password_Hash,
        li.Must_Change_Password
    FROM users u
    JOIN user_login_info li
        ON u.User_ID = li.User_ID
    JOIN roles r
        ON u.Role_ID = r.Role_ID
    WHERE li.Username = ?
    LIMIT 1
");

$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['Password_Hash'])) {
    audit_log('LOGIN_FAILED', [
        'username' => $username,
        'reason'   => 'invalid_credentials'
    ], 'warning');

    http_response_code(401);
    echo json_encode([
        "error" => "Invalid login"
    ]);
    exit;
}

if ((int)$user['Is_Disabled'] === 1) {
    audit_log('LOGIN_DISABLED', [
        'username' => $username,
        'user_id'  => (int)$user['User_ID'],
        'reason'   => 'account_disabled'
    ], 'warning');

    http_response_code(403);
    echo json_encode([
        "error" => "Account disabled"
    ]);
    exit;
}

session_regenerate_id(true);

$_SESSION['user'] = [
    "id" => (int)$user['User_ID'],
    "name" => trim(($user['First_Name'] ?? '') . ' ' . ($user['Last_Name'] ?? '')),
    "role" => $user['Role_Name'],
    "mustChangePassword" => ((int)$user['Must_Change_Password'] === 1)
];

audit_log('LOGIN_SUCCESS', [
    'username' => $username,
    'must_change_password' => ((int)$user['Must_Change_Password'] === 1)
], 'info');

echo json_encode($_SESSION['user']);
exit;