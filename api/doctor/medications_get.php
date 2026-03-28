<?php
require_once "../utils.php";

/* NOTE:
   Doctor only.
   Load the editable medication sheet for a visit.
*/
$user = require_role("Doctor");

$visitId = (int)($_GET["visitId"] ?? 0);
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
  SELECT
    Visit_ID,
    Current_Medications,
    Medication_Changes,
    Medication_Notes,
    Updated_At
  FROM VisitMedication
  WHERE Visit_ID = ?
  LIMIT 1
");
$stmt->execute([$visitId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
  echo json_encode([
    "medications" => [
      "Visit_ID" => $visitId,
      "Current_Medications" => "",
      "Medication_Changes" => "",
      "Medication_Notes" => "",
      "Updated_At" => null
    ]
  ]);
  exit;
}

echo json_encode([
  "medications" => $row
]);