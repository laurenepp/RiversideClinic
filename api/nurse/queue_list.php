<?php
require_once "../utils.php";
$user = require_role("Nurse");

// Today's date window
$today = date("Y-m-d");
$fromDT = $today . " 00:00:00";
$toDT   = $today . " 23:59:59";

$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID,
    a.Scheduled_Start,
    a.Status,
    p.Patient_ID,
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
  "queue" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);