<?php
require_once "../utils.php";
$user = require_role("Nurse");

$appointmentId = isset($_GET["appointmentId"]) ? (int)$_GET["appointmentId"] : 0;
if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

// Check if visit already exists
$stmt = $pdo->prepare("
  SELECT Visit_ID
  FROM Visit
  WHERE Appointment_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId]);
$visit = $stmt->fetch(PDO::FETCH_ASSOC);

if ($visit) {
  echo json_encode([
    "visitId" => $visit["Visit_ID"]
  ]);
  exit;
}

// Get appointment info
$stmt = $pdo->prepare("
  SELECT Patient_ID, Provider_User_ID
  FROM Appointment
  WHERE Appointment_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId]);
$appt = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$appt) {
  http_response_code(404);
  echo json_encode(["error" => "Appointment not found"]);
  exit;
}

// Create visit
$stmt = $pdo->prepare("
  INSERT INTO Visit (Appointment_ID, Patient_ID, Provider_User_ID, Created_By_User_ID)
  VALUES (?, ?, ?, ?)
");
$stmt->execute([
  $appointmentId,
  $appt["Patient_ID"],
  $appt["Provider_User_ID"],
  $user["id"]
]);

$visitId = $pdo->lastInsertId();

echo json_encode([
  "visitId" => $visitId
]);