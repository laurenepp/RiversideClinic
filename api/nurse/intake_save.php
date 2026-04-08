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
    $pdo->beginTransaction();

    // ---------------------------------
    // 1. Load appointment
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT Appointment_ID, Patient_ID, Provider_User_ID
        FROM Appointment
        WHERE Appointment_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$appointmentId]);

    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["error" => "Appointment not found"]);
        exit;
    }

    // ---------------------------------
    // 2. Ensure Visit exists
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
            INSERT INTO Visit (
                Appointment_ID,
                Patient_ID,
                Provider_User_ID,
                Created_By_User_ID,
                Visit_Date_Time,
                Doctor_Case_Status
            )
            VALUES (?, ?, ?, ?, NOW(), ?)
        ");
        $stmt->execute([
            $appointmentId,
            $appointment["Patient_ID"],
            $appointment["Provider_User_ID"],
            $_SESSION["user"]["id"] ?? null,
            "READY_FOR_PROVIDER"
        ]);

        $visitId = (int)$pdo->lastInsertId();
    }

    // ---------------------------------
    // 3. Upsert Visit_Exam
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT Visit_ID
        FROM Visit_Exam
        WHERE Visit_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$visitId]);

    $existsExam = $stmt->fetch(PDO::FETCH_ASSOC);

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
        $stmt->execute([
            $data["nurseNote"] ?? null,
            $data["bloodPressure"] ?? null,
            $data["pulse"] ?? null,
            $data["respiration"] ?? null,
            $data["temperature"] ?? null,
            $data["oxygenSaturation"] ?? null,
            $data["height"] ?? null,
            $data["weight"] ?? null,
            $data["painLevel"] ?? null,
            $visitId
        ]);
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
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $visitId,
            $data["nurseNote"] ?? null,
            $data["bloodPressure"] ?? null,
            $data["pulse"] ?? null,
            $data["respiration"] ?? null,
            $data["temperature"] ?? null,
            $data["oxygenSaturation"] ?? null,
            $data["height"] ?? null,
            $data["weight"] ?? null,
            $data["painLevel"] ?? null
        ]);
    }

    // ---------------------------------
    // 4. Upsert Visit_Medication
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT Visit_ID
        FROM Visit_Medication
        WHERE Visit_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$visitId]);

    $existsMed = $stmt->fetch(PDO::FETCH_ASSOC);

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
            )
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $visitId,
            $data["currentMedications"] ?? null,
            $data["medicationChanges"] ?? null,
            $data["medicationNotes"] ?? null
        ]);
    }

    // ---------------------------------
    // 5. Move patient to Ready for Provider
    // ---------------------------------
    $stmt = $pdo->prepare("
        UPDATE Visit
        SET Doctor_Case_Status = 'READY_FOR_PROVIDER'
        WHERE Visit_ID = ?
    ");
    $stmt->execute([$visitId]);

    $stmt = $pdo->prepare("
        UPDATE Appointment
        SET Status = 'READY_FOR_PROVIDER'
        WHERE Appointment_ID = ?
    ");
    $stmt->execute([$appointmentId]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "visitId" => $visitId,
        "appointmentStatus" => "READY_FOR_PROVIDER"
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "error" => "Failed to save intake",
        "details" => $e->getMessage()
    ]);
}