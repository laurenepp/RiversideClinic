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

$appointmentId = (int)($data["appointmentId"] ?? 0);
$startDT       = trim($data["startDateTime"] ?? "");
$endDT         = trim($data["endDateTime"] ?? "");
$status        = trim($data["status"] ?? "");

$allowedStatuses = ["SCHEDULED", "CHECKED_IN", "COMPLETED", "RESCHEDULED", "CANCELLED"];

if ($appointmentId <= 0 || $startDT === "" || $endDT === "" || $status === "") {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing fields"]);
    exit;
}

if (!in_array($status, $allowedStatuses, true)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid status"]);
    exit;
}

$startDT = str_replace("T", " ", $startDT) . ":00";
$endDT   = str_replace("T", " ", $endDT) . ":00";

$stmt = $pdo->prepare("
  UPDATE Appointment
  SET Scheduled_Start = ?, Scheduled_End = ?, Status = ?
  WHERE Appointment_ID = ?
");
$stmt->execute([$startDT, $endDT, $status, $appointmentId]);

echo json_encode(["success" => true]);