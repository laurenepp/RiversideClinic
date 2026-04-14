<?php
// api/utils.php

require_once __DIR__ . "/config.php";

function require_login() {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(["error" => "Not logged in"]);
        exit;
    }

    return $_SESSION['user'];
}

function require_role($roleName) {
    $user = require_login();

    if (($user['role'] ?? '') !== $roleName) {
        http_response_code(403);
        echo json_encode(["error" => "Forbidden: role required: $roleName"]);
        exit;
    }

    return $user;
}

function read_json() {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Write a schema-free audit log entry to /logs.
 * One JSON object per line for safe append-only logging.
 */
function audit_log(string $event, array $details = [], string $severity = 'info'): void {
    $severity = strtolower(trim($severity));

    $allowedSeverities = ['info', 'warning', 'critical'];
    if (!in_array($severity, $allowedSeverities, true)) {
        $severity = 'info';
    }

    $user = $_SESSION['user'] ?? [];

    $userId = null;
    if (isset($user['id']) && is_numeric($user['id'])) {
        $userId = (int)$user['id'];
    } elseif (isset($user['User_ID']) && is_numeric($user['User_ID'])) {
        $userId = (int)$user['User_ID'];
    }

    $userName = trim(
        (string)($user['name'] ?? '')
    );

    if ($userName === '') {
        $first = trim((string)($user['firstName'] ?? ($user['First_Name'] ?? '')));
        $last  = trim((string)($user['lastName'] ?? ($user['Last_Name'] ?? '')));
        $userName = trim($first . ' ' . $last);
    }

    if ($userName === '') {
        $userName = 'System';
    }

    $record = [
        'id' => uniqid('audit_', true),
        'timestamp' => date('Y-m-d H:i:s'),
        'actionType' => $event,
        'userId' => $userId,
        'user' => $userName,
        'severity' => $severity,
        'details' => $details,
        'ipAddress' => $_SERVER['REMOTE_ADDR'] ?? '',
        'requestUri' => $_SERVER['REQUEST_URI'] ?? '',
        'requestMethod' => $_SERVER['REQUEST_METHOD'] ?? '',
        'sessionId' => session_id()
    ];

    $logsDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'logs';

    if (!is_dir($logsDir)) {
        @mkdir($logsDir, 0775, true);
    }

    if (!is_dir($logsDir) || !is_writable($logsDir)) {
        return;
    }

    $filePath = $logsDir . DIRECTORY_SEPARATOR . 'audit-' . date('Y-m-d') . '.log';

    @file_put_contents(
        $filePath,
        json_encode($record, JSON_UNESCAPED_SLASHES) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}