<?php
require_once "../utils.php";

header("Content-Type: application/json");

$user = require_role("Doctor");

$appointmentId = (int)($_GET["appointmentId"] ?? 0);

if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId required"]);
    exit;
}

try {
    // ---------------------------------
    // 1. Load appointment + patient
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT
            a.Appointment_ID,
            a.Scheduled_Start,
            a.Scheduled_End,
            a.Status,
            a.Patient_ID,
            a.Provider_User_ID,
            p.First_Name AS Patient_First,
            p.Last_Name AS Patient_Last,
            p.Date_Of_Birth,
            p.Phone_Number,
            p.Email
        FROM Appointment a
        JOIN Patient p
            ON a.Patient_ID = p.Patient_ID
        WHERE a.Appointment_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$appointmentId]);

    $appointment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appointment) {
        http_response_code(404);
        echo json_encode(["error" => "Appointment not found"]);
        exit;
    }

    // Optional safety: only allow the assigned doctor to open it
    if ((int)$appointment["Provider_User_ID"] !== (int)$user["id"]) {
        http_response_code(403);
        echo json_encode(["error" => "Forbidden"]);
        exit;
    }

    // ---------------------------------
    // 2. Load or create Visit
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT
            Visit_ID,
            Appointment_ID,
            Patient_ID,
            Provider_User_ID,
            Created_By_User_ID,
            Visit_Date_Time,
            Doctor_Case_Status
        FROM Visit
        WHERE Appointment_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$appointmentId]);

    $visit = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$visit) {
        $stmt = $pdo->prepare("
            INSERT INTO Visit (
                Appointment_ID,
                Patient_ID,
                Provider_User_ID,
                Created_By_User_ID,
                Visit_Date_Time,
                Doctor_Case_Status
            )
            VALUES (?, ?, ?, ?, NOW(), 'IN_PROGRESS')
        ");
        $stmt->execute([
            $appointmentId,
            $appointment["Patient_ID"],
            $appointment["Provider_User_ID"],
            $user["id"]
        ]);

        $visitId = (int)$pdo->lastInsertId();

        $stmt = $pdo->prepare("
            SELECT
                Visit_ID,
                Appointment_ID,
                Patient_ID,
                Provider_User_ID,
                Created_By_User_ID,
                Visit_Date_Time,
                Doctor_Case_Status
            FROM Visit
            WHERE Visit_ID = ?
            LIMIT 1
        ");
        $stmt->execute([$visitId]);
        $visit = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    $visitId = (int)$visit["Visit_ID"];

    // ---------------------------------
    // 3. Load exam data
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT
            Visit_ID,
            Nurse_Intake_Note,
            Blood_Pressure,
            Pulse,
            Respiration,
            Temperature,
            Oxygen_Saturation,
            Height,
            Weight,
            Pain_Level,
            Doctor_Exam_Note
        FROM Visit_Exam
        WHERE Visit_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$visitId]);

    $exam = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$exam) {
        $exam = new stdClass();
    }

    // ---------------------------------
    // 4. Load medication data
    // ---------------------------------
    $stmt = $pdo->prepare("
        SELECT
            Visit_ID,
            Current_Medications,
            Medication_Changes,
            Medication_Notes
        FROM Visit_Medication
        WHERE Visit_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$visitId]);

    $medication = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$medication) {
        $medication = new stdClass();
    }

    echo json_encode([
        "appointment" => $appointment,
        "visit" => $visit,
        "exam" => $exam,
        "medication" => $medication
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Failed to load exam information",
        "details" => $e->getMessage()
    ]);
}