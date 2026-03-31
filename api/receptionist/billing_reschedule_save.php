<?php
require_once "../utils.php";
require_role("Receptionist");

$data = read_json();
$appointmentId = (int)($data['appointmentId'] ?? 0);
$amount = isset($data['amount']) ? (float)$data['amount'] : 0.00;
$billingStatus = strtoupper(trim($data['billingStatus'] ?? 'UNPAID'));
$nextStart = trim($data['nextStart'] ?? '');
$nextEnd = trim($data['nextEnd'] ?? '');

if ($appointmentId <= 0 || $nextStart === '' || $nextEnd === '') {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId, nextStart, and nextEnd are required"]);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT Appointment_ID, Patient_ID, Provider_User_ID FROM Appointment WHERE Appointment_ID = ? LIMIT 1");
    $stmt->execute([$appointmentId]);
    $appt = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$appt) throw new Exception('Appointment not found');

    $stmt = $pdo->prepare("SELECT Visit_ID FROM Visit WHERE Appointment_ID = ? LIMIT 1");
    $stmt->execute([$appointmentId]);
    $visit = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$visit) throw new Exception('Visit not found for billing');
    $visitId = (int)$visit['Visit_ID'];

    $stmt = $pdo->prepare("INSERT INTO Billing (Visit_ID, Amount, Status)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE Amount = VALUES(Amount), Status = VALUES(Status)");
    $stmt->execute([$visitId, $amount, $billingStatus]);

    $stmt = $pdo->prepare("UPDATE Appointment SET Status = 'COMPLETED' WHERE Appointment_ID = ?");
    $stmt->execute([$appointmentId]);

    $stmt = $pdo->prepare("INSERT INTO Appointment (Patient_ID, Provider_User_ID, Scheduled_Start, Scheduled_End, Status)
        VALUES (?, ?, ?, ?, 'SCHEDULED')");
    $stmt->execute([
        (int)$appt['Patient_ID'],
        (int)$appt['Provider_User_ID'],
        $nextStart,
        $nextEnd
    ]);

    $pdo->commit();
    echo json_encode(["success" => true, "nextAppointmentId" => (int)$pdo->lastInsertId()]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Failed to bill and reschedule", "details" => $e->getMessage()]);
}
