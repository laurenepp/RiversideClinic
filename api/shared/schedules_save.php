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

$providerId = (int)($data["providerUserId"] ?? 0);
$dayOfWeek  = (int)($data["dayOfWeek"] ?? 0);
$startTime  = trim($data["startTime"] ?? "");
$endTime    = trim($data["endTime"] ?? "");

if ($providerId <= 0 || $dayOfWeek < 1 || $dayOfWeek > 7 || $startTime === "" || $endTime === "") {
    http_response_code(400);
    echo json_encode(["error" => "Missing or invalid fields"]);
    exit;
}

if (strlen($startTime) === 5) $startTime .= ":00";
if (strlen($endTime) === 5) $endTime .= ":00";

if ($startTime >= $endTime) {
    http_response_code(400);
    echo json_encode(["error" => "Start time must be before end time"]);
    exit;
}

$stmt = $pdo->prepare("
  INSERT INTO Provider_Schedule (Provider_User_ID, Day_Of_The_Week, Start_Time, End_Time)
  VALUES (?, ?, ?, ?)
");
$stmt->execute([$providerId, $dayOfWeek, $startTime, $endTime]);

echo json_encode([
    "success" => true,
    "scheduleId" => $pdo->lastInsertId()
]);