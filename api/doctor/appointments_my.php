<?php
require_once "../utils.php";
$user = require_role("Doctor");

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
    p.Patient_ID, p.First_Name AS Patient_First, p.Last_Name AS Patient_Last
  FROM Appointments a
  JOIN Patients p ON a.Patient_ID = p.Patient_ID
  WHERE a.Provider_User_ID = ?
    AND a.Scheduled_Start BETWEEN ? AND ?
  ORDER BY a.Scheduled_Start ASC
");
$stmt->execute([$user["id"], $fromDT, $toDT]);

echo json_encode(["appointments" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);