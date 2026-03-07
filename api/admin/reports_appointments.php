<?php
require_once "../utils.php";
require_role("Administrator");

$from = $_GET["from"] ?? "";
$to   = $_GET["to"] ?? "";

if ($from === "" || $to === "") {
  http_response_code(400);
  echo json_encode(["error" => "from/to required (YYYY-MM-DD)"]);
  exit;
}

$fromDT = $from . " 00:00:00";
$toDT   = $to   . " 23:59:59";

$stmt = $pdo->prepare("
  SELECT
    a.Appointment_ID, a.Scheduled_Start, a.Scheduled_End, a.Status,
    p.Last_Name AS Patient_Last, p.First_Name AS Patient_First,
    u.Last_Name AS Provider_Last, u.First_Name AS Provider_First
  FROM Appointments a
  JOIN Patients p ON a.Patient_ID = p.Patient_ID
  JOIN Users u ON a.Provider_User_ID = u.User_ID
  WHERE a.Scheduled_Start BETWEEN ? AND ?
  ORDER BY a.Scheduled_Start ASC
");
$stmt->execute([$fromDT, $toDT]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Totals by status
$stmt2 = $pdo->prepare("
  SELECT Status, COUNT(*) AS Count
  FROM Appointments
  WHERE Scheduled_Start BETWEEN ? AND ?
  GROUP BY Status
");
$stmt2->execute([$fromDT, $toDT]);

echo json_encode([
  "appointments" => $rows,
  "totalsByStatus" => $stmt2->fetchAll(PDO::FETCH_ASSOC)
]);