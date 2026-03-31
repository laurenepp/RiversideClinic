<?php
require_once "../utils.php";
require_role("Receptionist");

$today = date("Y-m-d");
$fromDT = $today . " 00:00:00";
$toDT   = $today . " 23:59:59";

$totalPatients = (int)$pdo->query("SELECT COUNT(*) FROM Patient")->fetchColumn();

$stmt = $pdo->prepare("SELECT COUNT(*) FROM Appointment WHERE Scheduled_Start BETWEEN ? AND ?");
$stmt->execute([$fromDT, $toDT]);
$appointmentsToday = (int)$stmt->fetchColumn();

function rxCountStatus($pdo, $fromDT, $toDT, $status) {
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM Appointment WHERE Scheduled_Start BETWEEN ? AND ? AND Status = ?");
  $stmt->execute([$fromDT, $toDT, $status]);
  return (int)$stmt->fetchColumn();
}

$scheduledToday = rxCountStatus($pdo, $fromDT, $toDT, "SCHEDULED");
$checkedInToday = rxCountStatus($pdo, $fromDT, $toDT, "CHECKED_IN");
$readyToday = rxCountStatus($pdo, $fromDT, $toDT, "READY_FOR_PROVIDER");
$completedToday = rxCountStatus($pdo, $fromDT, $toDT, "COMPLETED");
$cancelledToday = rxCountStatus($pdo, $fromDT, $toDT, "CANCELLED");

$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    p.Patient_ID,
    p.First_Name AS Patient_First,
    p.Last_Name AS Patient_Last,
    p.Date_Of_Birth,
    u.First_Name AS Provider_First,
    u.Last_Name AS Provider_Last
  FROM Appointment a
  JOIN Patient p ON a.Patient_ID = p.Patient_ID
  JOIN Users u ON a.Provider_User_ID = u.User_ID
  WHERE a.Scheduled_Start BETWEEN ? AND ?
    AND a.Status = 'SCHEDULED'
  ORDER BY a.Scheduled_Start ASC
");
$stmt->execute([$fromDT, $toDT]);
$scheduledQueue = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $pdo->query("
  SELECT
    a.Appointment_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    p.Patient_ID,
    p.First_Name AS Patient_First,
    p.Last_Name AS Patient_Last,
    u.First_Name AS Provider_First,
    u.Last_Name AS Provider_Last
  FROM Appointment a
  JOIN Patient p ON a.Patient_ID = p.Patient_ID
  JOIN Users u ON a.Provider_User_ID = u.User_ID
  WHERE a.Status = 'COMPLETED'
  ORDER BY a.Scheduled_Start DESC
  LIMIT 25
");
$checkoutQueue = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
  "today" => $today,
  "totalPatients" => $totalPatients,
  "appointmentsToday" => $appointmentsToday,
  "scheduledToday" => $scheduledToday,
  "checkedInToday" => $checkedInToday,
  "readyToday" => $readyToday,
  "completedToday" => $completedToday,
  "cancelledToday" => $cancelledToday,
  "scheduledQueue" => $scheduledQueue,
  "checkoutQueue" => $checkoutQueue
]);
