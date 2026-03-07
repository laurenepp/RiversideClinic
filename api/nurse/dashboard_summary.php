<?php
require_once "../utils.php";
require_role("Nurse");

$today = date("Y-m-d");
$fromDT = $today . " 00:00:00";
$toDT   = $today . " 23:59:59";

// Appointments today (all)
$stmt = $pdo->prepare("SELECT COUNT(*) FROM Appointments WHERE Scheduled_Start BETWEEN ? AND ?");
$stmt->execute([$fromDT, $toDT]);
$apptsToday = (int)$stmt->fetchColumn();

function countStatus($pdo, $fromDT, $toDT, $status) {
  $stmt = $pdo->prepare("
    SELECT COUNT(*)
    FROM Appointments
    WHERE Scheduled_Start BETWEEN ? AND ?
      AND Status = ?
  ");
  $stmt->execute([$fromDT, $toDT, $status]);
  return (int)$stmt->fetchColumn();
}

$checkedInToday = countStatus($pdo, $fromDT, $toDT, "CHECKED_IN");
$scheduledToday = countStatus($pdo, $fromDT, $toDT, "SCHEDULED");
$completedToday = countStatus($pdo, $fromDT, $toDT, "COMPLETED");

// Intakes completed today
$stmt = $pdo->prepare("SELECT COUNT(*) FROM Intakes WHERE Created_At BETWEEN ? AND ?");
$stmt->execute([$fromDT, $toDT]);
$intakesToday = (int)$stmt->fetchColumn();

// Notes written today (all staff notes; nurse notes are included)
$stmt = $pdo->prepare("SELECT COUNT(*) FROM Visit_Notes WHERE Note_DateTime BETWEEN ? AND ?");
$stmt->execute([$fromDT, $toDT]);
$notesToday = (int)$stmt->fetchColumn();

// Next up: next 8 appointments today that are checked-in (priority), then scheduled
$now = date("Y-m-d H:i:s");

$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    p.First_Name AS Patient_First,
    p.Last_Name  AS Patient_Last,
    u.First_Name AS Provider_First,
    u.Last_Name  AS Provider_Last
  FROM Appointments a
  JOIN Patients p ON a.Patient_ID = p.Patient_ID
  JOIN Users u ON a.Provider_User_ID = u.User_ID
  WHERE a.Scheduled_Start BETWEEN ? AND ?
    AND a.Scheduled_Start >= ?
    AND a.Status IN ('CHECKED_IN','SCHEDULED','RESCHEDULED')
  ORDER BY
    CASE a.Status
      WHEN 'CHECKED_IN' THEN 0
      WHEN 'SCHEDULED' THEN 1
      WHEN 'RESCHEDULED' THEN 2
      ELSE 9
    END,
    a.Scheduled_Start ASC
  LIMIT 8
");
$stmt->execute([$fromDT, $toDT, $now]);

echo json_encode([
  "today" => $today,
  "appointmentsToday" => $apptsToday,
  "checkedInToday" => $checkedInToday,
  "scheduledToday" => $scheduledToday,
  "completedToday" => $completedToday,
  "intakesToday" => $intakesToday,
  "notesToday" => $notesToday,
  "nextUp" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);