<?php
require_once "../utils.php";
require_role("Receptionist");

$data = read_json();

$appointmentId = (int)($data["appointmentId"] ?? 0);
$providerId    = (int)($data["providerUserId"] ?? 0);
$startDT       = trim($data["startDateTime"] ?? "");
$endDT         = trim($data["endDateTime"] ?? "");

if ($appointmentId<=0 || $providerId<=0 || $startDT==="" || $endDT==="") {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing fields"]);
    exit;
}

$startDT = str_replace("T", " ", $startDT) . ":00";
$endDT   = str_replace("T", " ", $endDT)   . ":00";

$stmt = $pdo->prepare("
  UPDATE Appointment
  SET Provider_User_ID=?, Scheduled_Start=?, Scheduled_End=?, Status='RESCHEDULED'
  WHERE Appointment_ID=?
");
$stmt->execute([$providerId, $startDT, $endDT, $appointmentId]);

echo json_encode(["success" => true]);