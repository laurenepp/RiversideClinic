<?php
require_once "../utils.php";
require_role("Receptionist");

$data = read_json();

$appointmentId = (int)($data['appointmentId'] ?? 0);
$amount = isset($data['amount']) ? (float)$data['amount'] : 0.00;
$billingStatus = strtoupper(trim($data['billingStatus'] ?? 'UNPAID'));
$nextStart = trim($data['nextStart'] ?? '');
$nextEnd = trim($data['nextEnd'] ?? '');

// -------------------------
// BASIC VALIDATION
// -------------------------
if ($appointmentId <= 0 || $nextStart === '' || $nextEnd === '') {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId, nextStart, and nextEnd are required"]);
    exit;
}

// Fix datetime format (HTML -> MySQL)
$nextStart = str_replace('T', ' ', $nextStart);
$nextEnd = str_replace('T', ' ', $nextEnd);

// Validate datetime
if (strtotime($nextStart) === false || strtotime($nextEnd) === false) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid next appointment date/time"]);
    exit;
}

if (strtotime($nextStart) >= strtotime($nextEnd)) {
    http_response_code(400);
    echo json_encode(["error" => "Next appointment start must be before end"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // -------------------------
    // GET CURRENT APPOINTMENT
    // -------------------------
    $stmt = $pdo->prepare("
        SELECT Appointment_ID, Patient_ID, Provider_User_ID 
        FROM Appointment 
        WHERE Appointment_ID = ? 
        LIMIT 1
    ");
    $stmt->execute([$appointmentId]);
    $appt = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appt) {
        throw new Exception('Appointment not found');
    }

    $patientId = (int)$appt['Patient_ID'];
    $providerUserId = (int)$appt['Provider_User_ID'];

    // -------------------------
    // GET OR CREATE VISIT
    // -------------------------
    $stmt = $pdo->prepare("
        SELECT Visit_ID 
        FROM Visit 
        WHERE Appointment_ID = ? 
        LIMIT 1
    ");
    $stmt->execute([$appointmentId]);
    $visit = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($visit) {
        $visitId = (int)$visit['Visit_ID'];
    } else {
        // Safe fallback for demo/project
        $createdByUserId = (int)($_SESSION['user']['id'] ?? 1);

        $stmt = $pdo->prepare("
            INSERT INTO Visit 
            (Created_By_User_ID, Appointment_ID, Patient_ID, Provider_User_ID, Visit_Date_Time, Doctor_Case_Status)
            VALUES (?, ?, ?, ?, NOW(), 'COMPLETED')
        ");
        $stmt->execute([
            $createdByUserId,
            $appointmentId,
            $patientId,
            $providerUserId
        ]);

        $visitId = (int)$pdo->lastInsertId();
    }

    // -------------------------
    // SAVE BILLING
    // -------------------------
    $stmt = $pdo->prepare("
        INSERT INTO Billing (Visit_ID, Amount, Status)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            Amount = VALUES(Amount), 
            Status = VALUES(Status)
    ");
    $stmt->execute([$visitId, $amount, $billingStatus]);

    // -------------------------
    // COMPLETE CURRENT APPOINTMENT
    // -------------------------
    $stmt = $pdo->prepare("
        UPDATE Appointment 
        SET Status = 'COMPLETED' 
        WHERE Appointment_ID = ?
    ");
    $stmt->execute([$appointmentId]);

    // -------------------------
    // CREATE NEW APPOINTMENT
    // -------------------------
    $stmt = $pdo->prepare("
        INSERT INTO Appointment 
        (Patient_ID, Provider_User_ID, Scheduled_Start, Scheduled_End, Status)
        VALUES (?, ?, ?, ?, 'SCHEDULED')
    ");
    $stmt->execute([
        $patientId,
        $providerUserId,
        $nextStart,
        $nextEnd
    ]);

    $nextAppointmentId = (int)$pdo->lastInsertId();

    // -------------------------
    // COMMIT
    // -------------------------
    $pdo->commit();

    echo json_encode([
        "success" => true,
        "nextAppointmentId" => $nextAppointmentId
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);

    echo json_encode([
        "error" => "Failed to bill and reschedule",
        "details" => $e->getMessage()
    ]);
}