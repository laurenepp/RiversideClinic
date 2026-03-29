<?php
require_once "../utils.php";

/* NOTE:
   Doctor only.
   This builds the Patients tab list using receptionist appointment status
   plus the separate doctor case status.
*/
$user = require_role("Doctor");

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

/* NOTE:
   The Patients tab is still based on Appointment + Patient so seeded
   appointments appear even before a visit is opened.
   Doctor-facing workflow status is pulled from Visit when available.
*/
$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Patient_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    v.Doctor_Case_Status,
    p.First_Name AS Patient_First,
    p.Last_Name AS Patient_Last,
    p.Date_Of_Birth,
    {$genderSelect},

    (
      SELECT MAX(a2.Scheduled_Start)
      FROM Appointment a2
      WHERE a2.Patient_ID = a.Patient_ID
        AND a2.Provider_User_ID = a.Provider_User_ID
        AND a2.Scheduled_Start < a.Scheduled_Start
    ) AS Last_Appointment,

    (
      SELECT MIN(a3.Scheduled_Start)
      FROM Appointment a3
      WHERE a3.Patient_ID = a.Patient_ID
        AND a3.Provider_User_ID = a.Provider_User_ID
        AND a3.Scheduled_Start > a.Scheduled_Start
    ) AS Next_Appointment

  FROM Appointment a
  JOIN Patient p
    ON p.Patient_ID = a.Patient_ID

  /* IMPORTANT: this line makes sure missing Visit does NOT break list */
  LEFT JOIN Visit v
    ON v.Appointment_ID = a.Appointment_ID
   AND v.Provider_User_ID = a.Provider_User_ID

  WHERE a.Provider_User_ID = ?
  ORDER BY a.Scheduled_Start DESC
");
$stmt->execute([$user["id"]]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$rows = array_map(function ($row) {
  $apptStatus = strtoupper((string)($row["Status"] ?? ""));
  $caseStatus = strtoupper((string)($row["Doctor_Case_Status"] ?? ""));

  /* NOTE:
     Show doctor-facing chart state as Open / Closed.
     - IN_PROGRESS = OPEN
     - FINISHED = CLOSED
     - otherwise fall back to receptionist CHECKED_IN status
  */
  if ($caseStatus === "IN_PROGRESS") {
    $row["Open_Closed"] = "OPENED";
  } elseif ($caseStatus === "FINISHED") {
    $row["Open_Closed"] = "CLOSED";
  } elseif ($apptStatus === "CHECKED_IN") {
    $row["Open_Closed"] = "OPENED";
  } else {
    $row["Open_Closed"] = "CLOSED";
  }

  return $row;
}, $rows);

echo json_encode([
  "patients" => $rows
]);