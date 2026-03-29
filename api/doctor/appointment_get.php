<?php
require_once "../utils.php";

/* NOTE:
   Doctor only. This returns patient identity details plus the shared
   appointment status and the separate doctor case status.
*/
$user = require_role("Doctor");

$appointmentId = (int)($_GET["appointmentId"] ?? 0);
if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

/* NOTE:
   Gender may not exist in every copy of the database yet,
   so detect it first and safely return NULL if missing.
*/
$genderExists = false;

try {
  $colStmt = $pdo->prepare("
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Patient'
      AND COLUMN_NAME = 'Gender'
  ");
  $colStmt->execute();
  $genderExists = ((int)$colStmt->fetchColumn() > 0);
} catch (Throwable $e) {
  $genderExists = false;
}

$genderSelect = $genderExists ? "p.Gender AS Gender" : "NULL AS Gender";

$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Patient_ID,
    a.Provider_User_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    v.Doctor_Case_Status,
    p.First_Name AS Patient_First,
    p.Last_Name AS Patient_Last,
    p.Date_Of_Birth,
    $genderSelect,
    p.Phone_Number,
    p.Email
  FROM Appointment a
  JOIN Patient p
    ON a.Patient_ID = p.Patient_ID
  LEFT JOIN Visit v
    ON v.Appointment_ID = a.Appointment_ID
   AND v.Provider_User_ID = a.Provider_User_ID
  WHERE a.Appointment_ID = ?
    AND a.Provider_User_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId, $user["id"]]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
  http_response_code(404);
  echo json_encode(["error" => "Appointment not found"]);
  exit;
}

echo json_encode(["appointment" => $row]);