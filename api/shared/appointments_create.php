<?php
require_once "../utils.php";

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$allowedRoles = ["Administrator", "Doctor", "Nurse", "Receptionist"];
$userRole = $_SESSION["user"]["role"] ?? "";

if (!in_array($userRole, $allowedRoles, true)) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
}

$data = read_json();

$patientId  = (int)($data["patientId"] ?? 0);
$providerId = (int)($data["providerUserId"] ?? 0);
$startDT    = trim($data["startDateTime"] ?? "");
$endDT      = trim($data["endDateTime"] ?? "");

if ($patientId <= 0 || $providerId <= 0 || $startDT === "" || $endDT === "") {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit;
}

$startDT = str_replace("T", " ", $startDT) . ":00";
$endDT   = str_replace("T", " ", $endDT) . ":00";

$stmt = $pdo->prepare("
  INSERT INTO Appointment (Patient_ID, Provider_User_ID, Scheduled_Start, Scheduled_End, Status)
  VALUES (?, ?, ?, ?, 'SCHEDULED')
");
$stmt->execute([$patientId, $providerId, $startDT, $endDT]);

echo json_encode([
    "success" => true,
    "appointmentId" => $pdo->lastInsertId()
]);