<?php
require_once "../utils.php";
require_role("Nurse");

$appointmentId = (int)($_GET["appointmentId"] ?? 0);
if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

$stmt = $pdo->prepare("SELECT Visit_ID FROM Visit WHERE Appointment_ID = ? LIMIT 1");
$stmt->execute([$appointmentId]);
$visit = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$visit) {
  echo json_encode(["intake" => null]);
  exit;
}

$visitId = (int)$visit['Visit_ID'];

$stmt = $pdo->prepare("SELECT Nurse_Intake_Note, Blood_Pressure, Pulse, Respiration, Temperature,
  Oxygen_Saturation, Height, Weight, Pain_Level FROM Visit_Exam WHERE Visit_ID = ? LIMIT 1");
$stmt->execute([$visitId]);
$exam = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

$stmt = $pdo->prepare("SELECT Current_Medications, Medication_Changes, Medication_Notes FROM Visit_Medication WHERE Visit_ID = ? LIMIT 1");
$stmt->execute([$visitId]);
$meds = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

echo json_encode(["intake" => array_merge($exam, $meds, ['Visit_ID' => $visitId])]);
