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

/*
|--------------------------------------------------------------------------
| Brute-force protection settings for F-10
|--------------------------------------------------------------------------
*/
$maxFailedAttempts = 5;
$lockoutMinutes = 15;

$stmt = $pdo->prepare("
    SELECT
        u.User_ID,
        u.First_Name,
        u.Last_Name,
        u.Is_Disabled,
        r.Role_Name,
        li.Password_Hash,
        li.Must_Change_Password,
        li.Failed_Attempts,
        li.Locked_Until
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

/*
|--------------------------------------------------------------------------
| If username exists and is currently locked, stop here
|--------------------------------------------------------------------------
*/
if ($user && !empty($user['Locked_Until'])) {
    $lockedUntilTs = strtotime((string)$user['Locked_Until']);

    if ($lockedUntilTs !== false && $lockedUntilTs > time()) {
        audit_log('LOGIN_BLOCKED_LOCKOUT', [
            'username' => $username,
            'user_id' => (int)$user['User_ID'],
            'locked_until' => $user['Locked_Until']
        ], 'warning');

        http_response_code(429);
        echo json_encode([
            "error" => "Account temporarily locked. Try again later."
        ]);
        exit;
    }
}

/*
|--------------------------------------------------------------------------
| Invalid login handling
|--------------------------------------------------------------------------
*/
if (!$user || !password_verify($password, $user['Password_Hash'])) {
    if ($user) {
        $newFailedAttempts = ((int)$user['Failed_Attempts']) + 1;
        $shouldLock = ($newFailedAttempts >= $maxFailedAttempts);

        if ($shouldLock) {
            $lockStmt = $pdo->prepare("
                UPDATE user_login_info
                SET Failed_Attempts = 0,
                    Locked_Until = DATE_ADD(NOW(), INTERVAL ? MINUTE)
                WHERE User_ID = ?
            ");
            $lockStmt->execute([$lockoutMinutes, (int)$user['User_ID']]);

            audit_log('LOGIN_LOCKED', [
                'username' => $username,
                'user_id' => (int)$user['User_ID'],
                'failed_attempts' => $newFailedAttempts,
                'lockout_minutes' => $lockoutMinutes
            ], 'warning');

            http_response_code(429);
            echo json_encode([
                "error" => "Account temporarily locked. Try again later."
            ]);
            exit;
        } else {
            $failStmt = $pdo->prepare("
                UPDATE user_login_info
                SET Failed_Attempts = ?,
                    Locked_Until = NULL
                WHERE User_ID = ?
            ");
            $failStmt->execute([$newFailedAttempts, (int)$user['User_ID']]);

            audit_log('LOGIN_FAILED', [
                'username' => $username,
                'user_id' => (int)$user['User_ID'],
                'reason' => 'invalid_credentials',
                'failed_attempts' => $newFailedAttempts,
                'attempts_remaining' => max(0, $maxFailedAttempts - $newFailedAttempts)
            ], 'warning');
        }
    } else {
        // Unknown usernames still get logged, but no DB update is possible
        audit_log('LOGIN_FAILED', [
            'username' => $username,
            'reason' => 'invalid_credentials',
            'failed_attempts' => null
        ], 'warning');
    }

    http_response_code(401);
    echo json_encode([
        "error" => "Invalid login"
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| Disabled account check
|--------------------------------------------------------------------------
*/
if ((int)$user['Is_Disabled'] === 1) {
    audit_log('LOGIN_DISABLED', [
        'username' => $username,
        'user_id' => (int)$user['User_ID'],
        'reason' => 'account_disabled'
    ], 'warning');

    http_response_code(403);
    echo json_encode([
        "error" => "Account disabled"
    ]);
    exit;
}

/*
|--------------------------------------------------------------------------
| Successful login:
| - reset brute-force counters
| - regenerate session
| - set session timestamps
|--------------------------------------------------------------------------
*/
$resetStmt = $pdo->prepare("
    UPDATE user_login_info
    SET Failed_Attempts = 0,
        Locked_Until = NULL
    WHERE User_ID = ?
");
$resetStmt->execute([(int)$user['User_ID']]);

session_regenerate_id(true);

$_SESSION['created_at'] = time();
$_SESSION['last_active'] = time();

$_SESSION['user'] = [
    "id" => (int)$user['User_ID'],
    "name" => trim(($user['First_Name'] ?? '') . ' ' . ($user['Last_Name'] ?? '')),
    "role" => $user['Role_Name'],
    "mustChangePassword" => ((int)$user['Must_Change_Password'] === 1)
];

audit_log('LOGIN_SUCCESS', [
    'username' => $username,
    'user_id' => (int)$user['User_ID'],
    'must_change_password' => ((int)$user['Must_Change_Password'] === 1)
], 'info');

echo json_encode($_SESSION['user']);
exit;