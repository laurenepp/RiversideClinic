<?php
require_once "../utils.php";
require_role("Nurse");

header("Content-Type: application/json");

$data = read_json();

$appointmentId = (int)($data["appointmentId"] ?? 0);

if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId required"]);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // ---------------------------------
    // 1. Ensure Visit exists
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT Visit_ID
        FROM Visit
        WHERE Appointment_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$appointmentId]);

    $visit = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($visit) {
        $visitId = (int)$visit["Visit_ID"];
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO Visit (Appointment_ID)
            VALUES (?)
        ");
        $stmt->execute([$appointmentId]);
        $visitId = (int)$pdo->lastInsertId();
    }

    // ---------------------------------
    // 2. Upsert Visit_Exam (Vitals + Intake Note)
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT Visit_ID
        FROM Visit_Exam
        WHERE Visit_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$visitId]);

    $existsExam = $stmt->fetch();

    if ($existsExam) {
        $stmt = $pdo->prepare("
            UPDATE Visit_Exam SET
                Nurse_Intake_Note = ?,
                Blood_Pressure = ?,
                Pulse = ?,
                Respiration = ?,
                Temperature = ?,
                Oxygen_Saturation = ?,
                Height = ?,
                Weight = ?,
                Pain_Level = ?
            WHERE Visit_ID = ?
        ");
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO Visit_Exam (
                Visit_ID,
                Nurse_Intake_Note,
                Blood_Pressure,
                Pulse,
                Respiration,
                Temperature,
                Oxygen_Saturation,
                Height,
                Weight,
                Pain_Level
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
    }

    $examParams = [
        $data["nurseNote"] ?? null,
        $data["bloodPressure"] ?? null,
        $data["pulse"] ?? null,
        $data["respiration"] ?? null,
        $data["temperature"] ?? null,
        $data["oxygenSaturation"] ?? null,
        $data["height"] ?? null,
        $data["weight"] ?? null,
        $data["painLevel"] ?? null
    ];

    if ($existsExam) {
        $examParams[] = $visitId;
    } else {
        array_unshift($examParams, $visitId);
    }

    $stmt->execute($examParams);

    // ---------------------------------
    // 3. Upsert Visit_Medication
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT Visit_ID
        FROM Visit_Medication
        WHERE Visit_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$visitId]);

    $existsMed = $stmt->fetch();

    if ($existsMed) {
        $stmt = $pdo->prepare("
            UPDATE Visit_Medication SET
                Current_Medications = ?,
                Medication_Changes = ?,
                Medication_Notes = ?
            WHERE Visit_ID = ?
        ");
        $stmt->execute([
            $data["currentMedications"] ?? null,
            $data["medicationChanges"] ?? null,
            $data["medicationNotes"] ?? null,
            $visitId
        ]);
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO Visit_Medication (
                Visit_ID,
                Current_Medications,
                Medication_Changes,
                Medication_Notes
            ) VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $visitId,
            $data["currentMedications"] ?? null,
            $data["medicationChanges"] ?? null,
            $data["medicationNotes"] ?? null
        ]);
    }

    // ---------------------------------
    // Commit
    // ---------------------------------
    $pdo->commit();

    echo json_encode([
        "success" => true,
        "visitId" => $visitId
    ]);

} catch (Throwable $e) {
    $pdo->rollBack();

    http_response_code(500);
    echo json_encode([
        "error" => "Failed to save intake",
        "details" => $e->getMessage()
    ]);
}