<?php
require_once "../utils.php";
require_role("Receptionist");

$data = read_json();

$patientId  = (int)($data["patientId"] ?? 0);
$providerId = (int)($data["providerUserId"] ?? 0);
$startDT    = trim($data["startDateTime"] ?? ""); // YYYY-MM-DDTHH:MM
$endDT      = trim($data["endDateTime"] ?? "");

if ($patientId<=0 || $providerId<=0 || $startDT==="" || $endDT==="") {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit;
}

$startDT = str_replace("T", " ", $startDT) . ":00";
$endDT   = str_replace("T", " ", $endDT)   . ":00";

$stmt = $pdo->prepare("
  INSERT INTO Appointments (Patient_ID, Provider_User_ID, Scheduled_Start, Scheduled_End, Status)
  VALUES (?, ?, ?, ?, 'SCHEDULED')
");
$stmt->execute([$patientId, $providerId, $startDT, $endDT]);

echo json_encode(["success" => true, "appointmentId" => $pdo->lastInsertId()]);