<?php
require_once "../utils.php";
$user = require_role("Doctor");

$data = read_json();
$appointmentId = (int)($data["appointmentId"] ?? ($_GET["appointmentId"] ?? 0));
if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId required"]);
    exit;
}

$stmt = $pdo->prepare("SELECT Visit_ID FROM Visit WHERE Appointment_ID = ? LIMIT 1");
$stmt->execute([$appointmentId]);
$visit = $stmt->fetch(PDO::FETCH_ASSOC);
if ($visit) {
    echo json_encode(["visitId" => (int)$visit["Visit_ID"]]);
    exit;
}

$stmt = $pdo->prepare("SELECT Patient_ID, Provider_User_ID FROM Appointment WHERE Appointment_ID = ? LIMIT 1");
$stmt->execute([$appointmentId]);
$appt = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$appt) {
    http_response_code(404);
    echo json_encode(["error" => "Appointment not found"]);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO Visit (Appointment_ID, Patient_ID, Provider_User_ID, Created_By_User_ID, Visit_Date_Time, Doctor_Case_Status)
  VALUES (?, ?, ?, ?, NOW(), 'IN_PROGRESS')");
$stmt->execute([$appointmentId, $appt["Patient_ID"], $appt["Provider_User_ID"], $user["id"]]);

echo json_encode(["visitId" => (int)$pdo->lastInsertId()]);
