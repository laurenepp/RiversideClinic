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