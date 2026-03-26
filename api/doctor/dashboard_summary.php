<?php
require_once "../utils.php";

/* NOTE:
   Ensure only doctors can access this endpoint.
*/
$user = require_role("Doctor");

/* NOTE:
   Build today's date range (start → end of day).
*/
$today = date("Y-m-d");
$fromDT = $today . " 00:00:00";
$toDT   = $today . " 23:59:59";

/* NOTE:
   Helper function to count appointments by status.
   FIX: Uses correct table name "Appointment" (not "Appointments").
*/
function countStatusForDoctor($pdo, $doctorId, $fromDT, $toDT, $status) {
  $stmt = $pdo->prepare("
    SELECT COUNT(*)
    FROM Appointment
    WHERE Provider_User_ID = ?
      AND Scheduled_Start BETWEEN ? AND ?
      AND Status = ?
  ");
  $stmt->execute([$doctorId, $fromDT, $toDT, $status]);
  return (int)$stmt->fetchColumn();
}

/* NOTE:
   Total appointments today for this doctor.
*/
$stmt = $pdo->prepare("
  SELECT COUNT(*)
  FROM Appointment
  WHERE Provider_User_ID = ?
    AND Scheduled_Start BETWEEN ? AND ?
");
$stmt->execute([$user["id"], $fromDT, $toDT]);
$totalToday = (int)$stmt->fetchColumn();

/* NOTE:
   Count each status using helper.
*/
$scheduledToday   = countStatusForDoctor($pdo, $user["id"], $fromDT, $toDT, "SCHEDULED");
$checkedInToday   = countStatusForDoctor($pdo, $user["id"], $fromDT, $toDT, "CHECKED_IN");
$completedToday   = countStatusForDoctor($pdo, $user["id"], $fromDT, $toDT, "COMPLETED");
$cancelledToday   = countStatusForDoctor($pdo, $user["id"], $fromDT, $toDT, "CANCELLED");
$rescheduledToday = countStatusForDoctor($pdo, $user["id"], $fromDT, $toDT, "RESCHEDULED");

/* NOTE:
   Get next checked-in patients (queue).
   FIX:
   - Table names corrected: Appointment + Patient
*/
$now = date("Y-m-d H:i:s");

$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    p.First_Name AS Patient_First,
    p.Last_Name  AS Patient_Last
  FROM Appointment a
  JOIN Patient p ON a.Patient_ID = p.Patient_ID
  WHERE a.Provider_User_ID = ?
    AND a.Scheduled_Start BETWEEN ? AND ?
    AND a.Scheduled_Start >= ?
    AND a.Status = 'CHECKED_IN'
  ORDER BY a.Scheduled_Start ASC
  LIMIT 5
");

$stmt->execute([$user["id"], $fromDT, $toDT, $now]);

/* NOTE:
   Return JSON in format expected by doctor.js.
*/
echo json_encode([
  "today" => $today,
  "totalToday" => $totalToday,
  "scheduledToday" => $scheduledToday,
  "checkedInToday" => $checkedInToday,
  "completedToday" => $completedToday,
  "cancelledToday" => $cancelledToday,
  "rescheduledToday" => $rescheduledToday,
  "checkedInQueue" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);