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

$stmt = $pdo->prepare("UPDATE Appointments SET Status='CANCELLED' WHERE Appointment_ID=?");
$stmt->execute([$appointmentId]);

echo json_encode(["success" => true]);