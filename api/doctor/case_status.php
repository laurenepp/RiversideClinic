<?php
require_once "../utils.php";

/* NOTE:
   Doctor only.
   This updates the doctor-only case status without changing the
   receptionist-facing appointment status.
*/
$user = require_role("Doctor");
$data = read_json();

$appointmentId = (int)($data["appointmentId"] ?? 0);
$caseStatus = strtoupper(trim((string)($data["caseStatus"] ?? "")));

if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

$allowed = ["OPEN", "IN_PROGRESS", "FINISHED"];
if (!in_array($caseStatus, $allowed, true)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid caseStatus"]);
  exit;
}

/* NOTE:
   Update only the logged-in doctor's appointment.
*/
$stmt = $pdo->prepare("
  UPDATE Appointment
  SET Doctor_Case_Status = ?
  WHERE Appointment_ID = ?
    AND Provider_User_ID = ?
");
$stmt->execute([$caseStatus, $appointmentId, $user["id"]]);

if ($stmt->rowCount() < 1) {
  http_response_code(404);
  echo json_encode(["error" => "Appointment not found or not allowed"]);
  exit;
}

echo json_encode([
  "success" => true,
  "appointmentId" => $appointmentId,
  "caseStatus" => $caseStatus
]);