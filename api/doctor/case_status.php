<?php
require_once "../utils.php";

/* NOTE:
   Doctor only.
   Update doctor-facing case status on Visit, not Appointment,
   so scheduling stays separate from clinical workflow.
*/
$user = require_role("Doctor");

$data = read_json();

$appointmentId = (int)($data["appointmentId"] ?? 0);
$caseStatus = strtoupper(trim((string)($data["caseStatus"] ?? "")));

if ($appointmentId <= 0 || $caseStatus === "") {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId and caseStatus required"]);
  exit;
}

/* NOTE:
   Allow only the doctor workflow values used by the chart buttons.
*/
$allowed = ["IN_PROGRESS", "FINISHED"];
if (!in_array($caseStatus, $allowed, true)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid caseStatus"]);
  exit;
}

/* NOTE:
   Make sure the appointment belongs to the logged-in doctor.
*/
$stmt = $pdo->prepare("
  SELECT Appointment_ID
  FROM Appointment
  WHERE Appointment_ID = ?
    AND Provider_User_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId, $user["id"]]);
$appt = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$appt) {
  http_response_code(404);
  echo json_encode(["error" => "Appointment not found"]);
  exit;
}

/* NOTE:
   Update the doctor workflow status on the Visit row tied to
   this appointment. The visit should already exist because the
   chart open flow creates or reuses it first.
*/
$stmt = $pdo->prepare("
  UPDATE Visit
  SET Doctor_Case_Status = ?
  WHERE Appointment_ID = ?
    AND Provider_User_ID = ?
");
$stmt->execute([$caseStatus, $appointmentId, $user["id"]]);

if ($stmt->rowCount() < 1) {
  http_response_code(404);
  echo json_encode(["error" => "Visit not found for appointment"]);
  exit;
}

echo json_encode([
  "ok" => true,
  "caseStatus" => $caseStatus
]);