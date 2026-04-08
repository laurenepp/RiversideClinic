<?php
require_once "../utils.php";
require_role("Nurse");

header("Content-Type: application/json");

$appointmentId = isset($_GET["appointmentId"]) ? (int)$_GET["appointmentId"] : 0;

if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT
            v.Visit_ID,
            v.Appointment_ID,
            ve.Nurse_Intake_Note,
            ve.Blood_Pressure,
            ve.Pulse,
            ve.Respiration,
            ve.Temperature,
            ve.Oxygen_Saturation,
            ve.Height,
            ve.Weight,
            ve.Pain_Level,
            vm.Current_Medications,
            vm.Medication_Changes,
            vm.Medication_Notes
        FROM Visit v
        LEFT JOIN Visit_Exam ve
            ON v.Visit_ID = ve.Visit_ID
        LEFT JOIN Visit_Medication vm
            ON v.Visit_ID = vm.Visit_ID
        WHERE v.Appointment_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$appointmentId]);

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        echo json_encode([
            "intake" => null
        ]);
        exit;
    }

    echo json_encode([
        "intake" => $row
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Failed to load intake",
        "details" => $e->getMessage()
    ]);
}