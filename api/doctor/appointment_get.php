<?php
require_once "../utils.php";
$user = require_role("Doctor");

$appointmentId = isset($_GET["appointmentId"]) ? (int)$_GET["appointmentId"] : 0;
if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

/* NOTE:
   Keep the main version layout, but preserve the richer patient fields
   already present there so the appointment drawer can show more detail.
*/
$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Patient_ID,
    a.Provider_User_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    p.First_Name AS Patient_First,
    p.Last_Name AS Patient_Last,
    p.Date_Of_Birth,
    p.Gender,
    p.Phone_Number,
    p.Email
  FROM Appointment a
  JOIN Patient p ON a.Patient_ID = p.Patient_ID
  WHERE a.Appointment_ID = ?
    AND a.Provider_User_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId, $user["id"]]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

/* NOTE:
   Only allow the logged-in doctor to open appointments assigned to them.
*/
if (!$row) {
  http_response_code(404);
  echo json_encode(["error" => "Appointment not found"]);
  exit;
}
 /* NOTE:
   doctor.js expects JSON in this exact shape:
   { appointment: {...} }
*/
echo json_encode([
  "appointment" => $row
]);