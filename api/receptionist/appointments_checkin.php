<?php
require_once "../utils.php";
require_role("Receptionist");

$data = read_json();
$appointmentId = (int)($data["appointmentId"] ?? 0);

if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId required"]);
    exit;
}

// Simple check-in = set status to SCHEDULED -> (we'll use a status value "CHECKED_IN")
$stmt = $pdo->prepare("UPDATE Appointment SET Status='CHECKED_IN' WHERE Appointment_ID=?");
$stmt->execute([$appointmentId]);

echo json_encode(["success" => true]);