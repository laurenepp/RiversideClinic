<?php
require_once "../utils.php";
require_role("Nurse");

$from = $_GET["from"] ?? "";
$to   = $_GET["to"] ?? "";
$status = strtoupper(trim($_GET["status"] ?? "CHECKED_IN"));

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
    p.Patient_ID, p.First_Name AS Patient_First, p.Last_Name AS Patient_Last,
    u.First_Name AS Provider_First, u.Last_Name AS Provider_Last
  FROM Appointments a
  JOIN Patients p ON a.Patient_ID = p.Patient_ID
  JOIN Users u ON a.Provider_User_ID = u.User_ID
  WHERE a.Scheduled_Start BETWEEN ? AND ?
    AND a.Status = ?
  ORDER BY a.Scheduled_Start ASC
");
$stmt->execute([$fromDT, $toDT, $status]);

echo json_encode(["queue" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);