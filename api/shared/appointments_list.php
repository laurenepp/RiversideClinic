<?php
require_once "../utils.php";

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$allowedRoles = ["Administrator", "Doctor", "Nurse", "Receptionist"];
$userRole = $_SESSION["user"]["role"] ?? "";

if (!in_array($userRole, $allowedRoles, true)) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
}

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
    a.Appointment_ID,
    a.Scheduled_Start,
    a.Scheduled_End,
    a.Status,
    p.Patient_ID,
    p.First_Name AS Patient_First,
    p.Last_Name  AS Patient_Last,
    u.User_ID AS Provider_ID,
    u.First_Name AS Provider_First,
    u.Last_Name  AS Provider_Last
  FROM Appointment a
  JOIN Patient p ON a.Patient_ID = p.Patient_ID
  JOIN Users u ON a.Provider_User_ID = u.User_ID
  WHERE a.Scheduled_Start BETWEEN ? AND ?
  ORDER BY a.Scheduled_Start ASC
");
$stmt->execute([$fromDT, $toDT]);

echo json_encode([
  "appointments" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);