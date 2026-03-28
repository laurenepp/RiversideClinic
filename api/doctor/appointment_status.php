<?php
require_once "../utils.php";

/* NOTE:
   Doctor only.
   This updates the status of an appointment that belongs to the
   logged-in doctor.
*/
$user = require_role("Doctor");

/* NOTE:
   doctor.js sends POST JSON:
   { appointmentId, status }
*/
$data = read_json();

$appointmentId = (int)($data["appointmentId"] ?? 0);
$status = strtoupper(trim((string)($data["status"] ?? "")));

if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

/* NOTE:
   Allowed statuses for doctor workflow.
   Finished currently maps to COMPLETED from the button.
*/
$allowed = ["CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "RESCHEDULED", "NO_SHOW", "SCHEDULED"];
if (!in_array($status, $allowed, true)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid status"]);
  exit;
}

/* NOTE:
   Update only the logged-in doctor's appointment.
   The real table name is Appointment.
*/
$stmt = $pdo->prepare("
  UPDATE Appointment
  SET Status = ?
  WHERE Appointment_ID = ?
    AND Provider_User_ID = ?
");
$stmt->execute([$status, $appointmentId, $user["id"]]);

if ($stmt->rowCount() < 1) {
  http_response_code(404);
  echo json_encode(["error" => "Appointment not found or not allowed"]);
  exit;
}

echo json_encode([
  "success" => true,
  "appointmentId" => $appointmentId,
  "status" => $status
]);