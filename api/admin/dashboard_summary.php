<?php
require_once "../utils.php";
require_role("Administrator");

// Today's date window
$today = date("Y-m-d");
$fromDT = $today . " 00:00:00";
$toDT   = $today . " 23:59:59";

// Users counts
$totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM Users")->fetchColumn();
$activeUsers = (int)$pdo->query("SELECT COUNT(*) FROM Users WHERE Is_Disabled = 0")->fetchColumn();

// Appointments today
$stmt = $pdo->prepare("SELECT COUNT(*) FROM Appointment WHERE Scheduled_Start BETWEEN ? AND ?");
$stmt->execute([$fromDT, $toDT]);
$apptsToday = (int)$stmt->fetchColumn();

// Status counts today
function countStatus($pdo, $fromDT, $toDT, $status) {
  $stmt = $pdo->prepare("SELECT COUNT(*) FROM Appointment WHERE Scheduled_Start BETWEEN ? AND ? AND Status = ?");
  $stmt->execute([$fromDT, $toDT, $status]);
  return (int)$stmt->fetchColumn();
}

$checkedInToday = countStatus($pdo, $fromDT, $toDT, "CHECKED_IN");
$completedToday = countStatus($pdo, $fromDT, $toDT, "COMPLETED");
$cancelledToday = countStatus($pdo, $fromDT, $toDT, "CANCELLED");

echo json_encode([
  "today" => $today,
  "totalUsers" => $totalUsers,
  "activeUsers" => $activeUsers,
  "appointmentsToday" => $apptsToday,
  "checkedInToday" => $checkedInToday,
  "completedToday" => $completedToday,
  "cancelledToday" => $cancelledToday
]);