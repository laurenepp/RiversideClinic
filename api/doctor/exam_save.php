<?php
require_once "../utils.php";
$user = require_role("Doctor");

$appointmentId = (int)($_GET['appointmentId'] ?? 0);
if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'appointmentId required']);
    exit;
}

$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Status,
    a.Scheduled_Start,
    a.Scheduled_End,
    p.Patient_ID,
    p.First_Name AS Patient_First,
    p.Last_Name AS Patient_Last,
    p.Date_Of_Birth,
    p.Phone_Number,
    p.Address_Line1,
    p.Address_Line2,
    p.City,
    p.State,
    p.Postal_Code
  FROM Appointment a
  JOIN Patient p ON p.Patient_ID = a.Patient_ID
  WHERE a.Appointment_ID = ?
    AND a.Provider_User_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId, $user['id']]);
$appointment = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$appointment) {
    http_response_code(404);
    echo json_encode(['error' => 'Appointment not found']);
    exit;
}

$stmt = $pdo->prepare("SELECT Visit_ID, Doctor_Case_Status FROM Visit WHERE Appointment_ID = ? LIMIT 1");
$stmt->execute([$appointmentId]);
$visit = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$visit) {
    http_response_code(404);
    echo json_encode(['error' => 'Visit not found for appointment']);
    exit;
}

$stmt = $pdo->prepare("SELECT Nurse_Intake_Note, Doctor_Exam_Note, Blood_Pressure, Pulse, Respiration, Temperature,
    Oxygen_Saturation, Height, Weight, Pain_Level
    FROM Visit_Exam WHERE Visit_ID = ? LIMIT 1");
$stmt->execute([(int)$visit['Visit_ID']]);
$exam = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

$stmt = $pdo->prepare("SELECT Current_Medications, Medication_Changes, Medication_Notes FROM Visit_Medication WHERE Visit_ID = ? LIMIT 1");
$stmt->execute([(int)$visit['Visit_ID']]);
$meds = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

echo json_encode([
    'appointment' => $appointment,
    'visit' => $visit,
    'exam' => $exam,
    'medication' => $meds
]);
