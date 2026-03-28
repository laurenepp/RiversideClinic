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

$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Patient_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    a.Doctor_Case_Status,
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
  WHERE a.Provider_User_ID = ?
  ORDER BY a.Scheduled_Start DESC
");
$stmt->execute([$user["id"]]);

$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* NOTE:
   Doctor workflow rule:
   - OPEN when appointment is CHECKED_IN and doctor has not finished
   - OPEN when doctor marked IN_PROGRESS
   - CLOSED when doctor marked FINISHED
*/
$rows = array_map(function ($row) {
  $apptStatus = strtoupper((string)($row["Status"] ?? ""));
  $caseStatus = strtoupper((string)($row["Doctor_Case_Status"] ?? ""));

  if ($caseStatus === "FINISHED") {
    $row["Open_Closed"] = "CLOSED";
  } elseif ($caseStatus === "IN_PROGRESS") {
    $row["Open_Closed"] = "OPEN";
  } elseif ($apptStatus === "CHECKED_IN") {
    $row["Open_Closed"] = "OPEN";
  } else {
    $row["Open_Closed"] = "CLOSED";
  }

  return $row;
}, $rows);

echo json_encode([
  "patients" => $rows
]);