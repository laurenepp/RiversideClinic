<?php
require_once "../utils.php";
require_role("Administrator");

// Optional filters
$from = $_GET['from'] ?? null;
$to   = $_GET['to'] ?? null;
$status = $_GET['status'] ?? null;

$params = [];
$where = [];

if ($from && $to) {
  $where[] = "a.Scheduled_Start BETWEEN ? AND ?";
  $params[] = $from . " 00:00:00";
  $params[] = $to . " 23:59:59";
}

if ($status) {
  $where[] = "a.Status = ?";
  $params[] = $status;
}

$whereSQL = "";
if (!empty($where)) {
  $whereSQL = "WHERE " . implode(" AND ", $where);
}

$sql = "
SELECT
  a.Appointment_ID,
  a.Scheduled_Start,
  a.Status,
  p.First_Name,
  p.Last_Name,
  u.First_Name AS Provider_First,
  u.Last_Name AS Provider_Last
FROM Appointment a
JOIN Patient p ON a.Patient_ID = p.Patient_ID
JOIN Users u ON a.Provider_User_ID = u.User_ID
$whereSQL
ORDER BY a.Scheduled_Start DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode($stmt->fetchAll());