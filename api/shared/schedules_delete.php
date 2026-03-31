<?php
require_once "../utils.php";

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$allowedRoles = ["Administrator"];
$userRole = $_SESSION["user"]["role"] ?? "";

if (!in_array($userRole, $allowedRoles, true)) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
}

$data = read_json();
$scheduleId = (int)($data["scheduleId"] ?? 0);

if ($scheduleId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "scheduleId required"]);
    exit;
}

$stmt = $pdo->prepare("DELETE FROM Provider_Schedule WHERE Schedule_ID = ?");
$stmt->execute([$scheduleId]);

echo json_encode(["success" => true]);