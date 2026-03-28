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

if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId required"]);
    exit;
}

$stmt = $pdo->prepare("
  UPDATE Appointment
  SET Status = 'CANCELLED'
  WHERE Appointment_ID = ?
");
$stmt->execute([$appointmentId]);

echo json_encode(["success" => true]);