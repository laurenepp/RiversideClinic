<?php
require_once "../utils.php";
require_role("Doctor");

$data = read_json();
$appointmentId = (int)($data["appointmentId"] ?? 0);
$status = strtoupper(trim($data["status"] ?? ""));

$allowed = ["SCHEDULED","CHECKED_IN","CANCELLED","RESCHEDULED","NO_SHOW","COMPLETED","IN_PROGRESS"];
if (!in_array($status, $allowed, true)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid status"]);
  exit;
}
if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

$stmt = $pdo->prepare("UPDATE Appointments SET Status=? WHERE Appointment_ID=?");
$stmt->execute([$status, $appointmentId]);

echo json_encode(["success" => true]);