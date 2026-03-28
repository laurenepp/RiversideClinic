<?php
require_once "../utils.php";

/* NOTE:
   Doctor only.
   Save or update the medication sheet for a visit.
*/
$user = require_role("Doctor");
$data = read_json();

$visitId = (int)($data["visitId"] ?? 0);
$currentMedications = trim((string)($data["currentMedications"] ?? ""));
$medicationChanges = trim((string)($data["medicationChanges"] ?? ""));
$medicationNotes = trim((string)($data["medicationNotes"] ?? ""));

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

$stmt = $pdo->prepare("
  INSERT INTO VisitMedication (
    Visit_ID,
    Current_Medications,
    Medication_Changes,
    Medication_Notes,
    Updated_By_User_ID
  )
  VALUES (?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    Current_Medications = VALUES(Current_Medications),
    Medication_Changes = VALUES(Medication_Changes),
    Medication_Notes = VALUES(Medication_Notes),
    Updated_By_User_ID = VALUES(Updated_By_User_ID),
    Updated_At = CURRENT_TIMESTAMP
");
$stmt->execute([
  $visitId,
  $currentMedications,
  $medicationChanges,
  $medicationNotes,
  $user["id"]
]);

echo json_encode(["success" => true]);