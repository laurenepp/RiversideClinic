<?php
require_once "../utils.php";
require_role("Receptionist");

// Today's date window
$today = date("Y-m-d");
$fromDT = $today . " 00:00:00";
$toDT   = $today . " 23:59:59";

// Total patients (overall)
$totalPatients = (int)$pdo->query("SELECT COUNT(*) FROM Patient")->fetchColumn();

// Appointments today
$stmt = $pdo->prepare("SELECT COUNT(*) FROM Appointment WHERE Scheduled_Start BETWEEN ? AND ?");
$stmt->execute([$fromDT, $toDT]);
$apptsToday = (int)$stmt->fetchColumn();

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

$scheduledToday = countStatus($pdo, $fromDT, $toDT, "SCHEDULED");
$checkedInToday = countStatus($pdo, $fromDT, $toDT, "CHECKED_IN");
$completedToday = countStatus($pdo, $fromDT, $toDT, "COMPLETED");
$cancelledToday = countStatus($pdo, $fromDT, $toDT, "CANCELLED");
$rescheduledToday = countStatus($pdo, $fromDT, $toDT, "RESCHEDULED");

// Next 5 appointments (from now through end of day)
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
  FROM Appointment a
  JOIN Patient p ON a.Patient_Patient_ID = p.Patient_ID
  JOIN Users u ON a.Provider_User_ID = u.User_ID
  WHERE a.Scheduled_Start BETWEEN ? AND ?
    AND a.Scheduled_Start >= ?
    AND a.Status IN ('SCHEDULED','CHECKED_IN','RESCHEDULED')
  ORDER BY a.Scheduled_Start ASC
  LIMIT 5
");
$stmt->execute([$fromDT, $toDT, $now]);

echo json_encode([
  "today" => $today,
  "totalPatients" => $totalPatients,
  "appointmentsToday" => $apptsToday,
  "scheduledToday" => $scheduledToday,
  "checkedInToday" => $checkedInToday,
  "completedToday" => $completedToday,
  "cancelledToday" => $cancelledToday,
  "rescheduledToday" => $rescheduledToday,
  "nextUp" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);