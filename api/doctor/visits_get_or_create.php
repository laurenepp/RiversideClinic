<?php
require_once "../utils.php";

/* NOTE:
   Doctor only. This endpoint creates or reuses the visit record
   tied to the appointment the doctor is opening.
*/
$user = require_role("Doctor");

/* NOTE:
   doctor.js sends POST JSON with { appointmentId }.
*/
$data = read_json();
$appointmentId = (int)($data["appointmentId"] ?? 0);

if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

/* NOTE:
   Make sure the appointment belongs to the logged-in doctor.
*/
$stmt = $pdo->prepare("
  SELECT
    Appointment_ID,
    Patient_ID,
    Provider_User_ID,
    Scheduled_Start
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
   Reuse an existing visit if one is already attached to this appointment.
*/
$stmt = $pdo->prepare("
  SELECT Visit_ID
  FROM Visit
  WHERE Appointment_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existing) {
  echo json_encode([
    "visitId" => (int)$existing["Visit_ID"],
    "created" => false
  ]);
  exit;
}

/* NOTE:
   Create the visit the first time the doctor opens the chart.
   Visit_DateTime is required by the schema.
*/
$stmt = $pdo->prepare("
  INSERT INTO Visit (
    Created_By_User_ID,
    Appointment_ID,
    Patient_ID,
    Provider_User_ID,
    Visit_DateTime
  )
  VALUES (?, ?, ?, ?, ?)
");
$stmt->execute([
  $user["id"],
  $appointmentId,
  $appt["Patient_ID"],
  $appt["Provider_User_ID"],
  $appt["Scheduled_Start"]
]);

echo json_encode([
  "visitId" => (int)$pdo->lastInsertId(),
  "created" => true
]);