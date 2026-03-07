<?php
require_once "../utils.php";
$user = require_role("Doctor");

$data = read_json();
$appointmentId = (int)($data["appointmentId"] ?? 0);

if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

$stmt = $pdo->prepare("SELECT Visit_ID FROM Visits WHERE Appointment_ID = ? LIMIT 1");
$stmt->execute([$appointmentId]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existing) {
  echo json_encode(["visitId" => (int)$existing["Visit_ID"], "created" => false]);
  exit;
}

$stmt = $pdo->prepare("
  SELECT Patient_ID, Provider_User_ID
  FROM Appointments
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

$pdo->prepare("
  INSERT INTO Visits (Appointment_ID, Patient_ID, Provider_User_ID, Created_By_User_ID)
  VALUES (?, ?, ?, ?)
")->execute([$appointmentId, $appt["Patient_ID"], $appt["Provider_User_ID"], $user["id"]]);

echo json_encode(["visitId" => (int)$pdo->lastInsertId(), "created" => true]);