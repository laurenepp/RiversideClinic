<?php
require_once "../utils.php";

/* NOTE:
   Doctor only.
   Save or update the editable exam sheet for a visit.
   The doctor can update both vitals and note text here.
*/
$user = require_role("Doctor");
$data = read_json();

$visitId = (int)($data["visitId"] ?? 0);

$nurseIntakeNote   = trim((string)($data["nurseIntakeNote"] ?? ""));
$doctorExamNote    = trim((string)($data["doctorExamNote"] ?? ""));
$bloodPressure     = trim((string)($data["bloodPressure"] ?? ""));
$pulse             = trim((string)($data["pulse"] ?? ""));
$respiration       = trim((string)($data["respiration"] ?? ""));
$temperature       = trim((string)($data["temperature"] ?? ""));
$oxygenSaturation  = trim((string)($data["oxygenSaturation"] ?? ""));
$height            = trim((string)($data["height"] ?? ""));
$weight            = trim((string)($data["weight"] ?? ""));
$painLevel         = trim((string)($data["painLevel"] ?? ""));

if ($visitId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "visitId required"]);
  exit;
}

/* NOTE:
   Make sure the visit belongs to an appointment for this doctor.
*/
$stmt = $pdo->prepare("
  SELECT
    v.Visit_ID
  FROM Visit v
  JOIN Appointment a
    ON a.Appointment_ID = v.Appointment_ID
  WHERE v.Visit_ID = ?
    AND a.Provider_User_ID = ?
  LIMIT 1
");
$stmt->execute([$visitId, $user["id"]]);
$ok = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$ok) {
  http_response_code(404);
  echo json_encode(["error" => "Visit not found"]);
  exit;
}

/* NOTE:
   Upsert one editable row per visit.
*/
$stmt = $pdo->prepare("
  INSERT INTO VisitExam (
    Visit_ID,
    Nurse_Intake_Note,
    Doctor_Exam_Note,
    Blood_Pressure,
    Pulse,
    Respiration,
    Temperature,
    Oxygen_Saturation,
    Height,
    Weight,
    Pain_Level,
    Updated_By_User_ID
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    Nurse_Intake_Note = VALUES(Nurse_Intake_Note),
    Doctor_Exam_Note = VALUES(Doctor_Exam_Note),
    Blood_Pressure = VALUES(Blood_Pressure),
    Pulse = VALUES(Pulse),
    Respiration = VALUES(Respiration),
    Temperature = VALUES(Temperature),
    Oxygen_Saturation = VALUES(Oxygen_Saturation),
    Height = VALUES(Height),
    Weight = VALUES(Weight),
    Pain_Level = VALUES(Pain_Level),
    Updated_By_User_ID = VALUES(Updated_By_User_ID),
    Updated_At = CURRENT_TIMESTAMP
");
$stmt->execute([
  $visitId,
  $nurseIntakeNote,
  $doctorExamNote,
  $bloodPressure,
  $pulse,
  $respiration,
  $temperature,
  $oxygenSaturation,
  $height,
  $weight,
  $painLevel,
  $user["id"]
]);

echo json_encode(["success" => true]);