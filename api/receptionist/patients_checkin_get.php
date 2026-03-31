<?php
require_once "../utils.php";
require_role("Receptionist");

$appointmentId = (int)($_GET["appointmentId"] ?? 0);
if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId required"]);
    exit;
}

$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Status,
    a.Scheduled_Start,
    a.Scheduled_End,
    p.Patient_ID,
    p.First_Name,
    p.Last_Name,
    p.Date_Of_Birth,
    p.Phone_Number,
    p.Email,
    p.Address_Line1,
    p.Address_Line2,
    p.City,
    p.State,
    p.Postal_Code,
    u.First_Name AS Provider_First,
    u.Last_Name AS Provider_Last
  FROM Appointment a
  JOIN Patient p ON p.Patient_ID = a.Patient_ID
  JOIN Users u ON u.User_ID = a.Provider_User_ID
  WHERE a.Appointment_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId]);
$appointment = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$appointment) {
    http_response_code(404);
    echo json_encode(["error" => "Appointment not found"]);
    exit;
}

$stmt = $pdo->prepare("
  SELECT Insurance_ID, Insurance_Provider, Policy_Number, Policy_Holder, Payment_Status, Date_Sent
  FROM Insurance_Info
  WHERE Patient_ID = ?
  ORDER BY Updated_At DESC, Insurance_ID DESC
  LIMIT 1
");
$stmt->execute([(int)$appointment['Patient_ID']]);
$insurance = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

echo json_encode([
    "appointment" => $appointment,
    "insurance" => $insurance
]);
