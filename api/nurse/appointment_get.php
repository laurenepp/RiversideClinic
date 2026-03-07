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
  SELECT
    a.Appointment_ID, a.Scheduled_Start, a.Scheduled_End, a.Status,
    p.Patient_ID, p.First_Name AS Patient_First, p.Last_Name AS Patient_Last,
    p.Date_Of_Birth, p.Phone_Number, p.Email
  FROM Appointments a
  JOIN Patients p ON a.Patient_ID = p.Patient_ID
  WHERE a.Appointment_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
  http_response_code(404);
  echo json_encode(["error" => "Appointment not found"]);
  exit;
}

echo json_encode(["appointment" => $row]);