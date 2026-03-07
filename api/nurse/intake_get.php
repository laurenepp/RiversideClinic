<?php
require_once "../utils.php";
require_role("Nurse");

$appointmentId = (int)($_GET["appointmentId"] ?? 0);
if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

$stmt = $pdo->prepare("
  SELECT Intake_ID, Appointment_ID, Created_By_User_ID, Created_At,
         Vitals, Chief_Complaint, Allergies, Medications
  FROM Intakes
  WHERE Appointment_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId]);
$intake = $stmt->fetch(PDO::FETCH_ASSOC);

echo json_encode(["intake" => $intake ?: null]);