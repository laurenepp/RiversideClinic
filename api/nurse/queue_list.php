<?php
require_once "../utils.php";
$user = require_role("Nurse");

$stmt = $pdo->query("
  SELECT
    a.Appointment_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    p.Patient_ID,
    p.First_Name AS Patient_First,
    p.Last_Name  AS Patient_Last,
    p.Date_Of_Birth
  FROM Appointment a
  JOIN Patient p ON a.Patient_ID = p.Patient_ID
  WHERE a.Status = 'CHECKED_IN'
  ORDER BY a.Scheduled_Start ASC, a.Appointment_ID ASC
");

echo json_encode([
  "queue" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);