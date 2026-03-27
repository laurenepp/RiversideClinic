<?php
require_once "../utils.php";
$user = require_role("Nurse");

// Today's date window
$today = date("Y-m-d");
$fromDT = $today . " 00:00:00";
$toDT   = $today . " 23:59:59";

// Total appointments today
$stmt = $pdo->prepare("
  SELECT COUNT(*)
  FROM Appointment
  WHERE Scheduled_Start BETWEEN ? AND ?
");
$stmt->execute([$fromDT, $toDT]);
$totalToday = (int)$stmt->fetchColumn();

// Status counts
function countStatus($pdo, $fromDT, $toDT, $status) {
  $stmt = $pdo->prepare("
    SELECT COUNT(*)
    FROM Appointment
    WHERE Scheduled_Start BETWEEN ? AND ?
      AND Status = ?
  ");
  $stmt->execute([$fromDT, $toDT, $status]);
  return (int)$stmt->fetchColumn();
}

$scheduledToday   = countStatus($pdo, $fromDT, $toDT, "SCHEDULED");
$checkedInToday   = countStatus($pdo, $fromDT, $toDT, "CHECKED_IN");
$completedToday   = countStatus($pdo, $fromDT, $toDT, "COMPLETED");
$cancelledToday   = countStatus($pdo, $fromDT, $toDT, "CANCELLED");
$rescheduledToday = countStatus($pdo, $fromDT, $toDT, "RESCHEDULED");

// Queue: checked-in patients
$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Scheduled_Start,
    a.Status,
    p.First_Name AS Patient_First,
    p.Last_Name  AS Patient_Last
  FROM Appointment a
  JOIN Patient p ON a.Patient_ID = p.Patient_ID
  WHERE a.Status = 'CHECKED_IN'
    AND a.Scheduled_Start BETWEEN ? AND ?
  ORDER BY a.Scheduled_Start ASC
");
$stmt->execute([$fromDT, $toDT]);

echo json_encode([
  "today" => $today,
  "totalToday" => $totalToday,
  "scheduledToday" => $scheduledToday,
  "checkedInToday" => $checkedInToday,
  "completedToday" => $completedToday,
  "cancelledToday" => $cancelledToday,
  "rescheduledToday" => $rescheduledToday,
  "queue" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);