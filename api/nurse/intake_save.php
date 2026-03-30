<?php
require_once "../utils.php";
$user = require_role("Nurse");

$data = read_json();

$appointmentId = (int)($data["appointmentId"] ?? 0);

$bloodPressure = trim($data["bloodPressure"] ?? "");
$pulse = trim($data["pulse"] ?? "");
$respiration = trim($data["respiration"] ?? "");
$temperature = trim($data["temperature"] ?? "");
$oxygenSaturation = trim($data["oxygenSaturation"] ?? "");
$height = trim($data["height"] ?? "");
$weight = trim($data["weight"] ?? "");
$painLevel = trim($data["painLevel"] ?? "");

$nurseIntakeNote = trim($data["nurseIntakeNote"] ?? "");

$currentMedications = trim($data["currentMedications"] ?? "");
$medicationChanges = trim($data["medicationChanges"] ?? "");
$medicationNotes = trim($data["medicationNotes"] ?? "");

if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId required"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Load appointment so we know patient/provider
    $stmt = $pdo->prepare("
      SELECT Appointment_ID, Patient_ID, Provider_User_ID
      FROM Appointment
      WHERE Appointment_ID = ?
    ");
    $stmt->execute([$appointmentId]);
    $appt = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$appt) {
        throw new Exception("Appointment not found");
    }

    $patientId = (int)$appt["Patient_ID"];
    $providerUserId = (int)$appt["Provider_User_ID"];
    $nurseUserId = (int)$user["id"];

    // 2. Find existing visit for this appointment
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

        $stmt = $pdo->prepare("
          UPDATE Visit
          SET Doctor_Case_Status = 'READY_FOR_PROVIDER'
          WHERE Visit_ID = ?
        ");
        $stmt->execute([$visitId]);
    } else {
        $stmt = $pdo->prepare("
          INSERT INTO Visit
          (Created_By_User_ID, Appointment_ID, Patient_ID, Provider_User_ID, Visit_DateTime, Doctor_Case_Status)
          VALUES (?, ?, ?, ?, NOW(), 'READY_FOR_PROVIDER')
        ");
        $stmt->execute([$nurseUserId, $appointmentId, $patientId, $providerUserId]);
        $visitId = (int)$pdo->lastInsertId();
    }

    // 3. Upsert VisitExam
    $stmt = $pdo->prepare("
      INSERT INTO VisitExam
      (
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
        Updated_By_User_ID
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Nurse_Intake_Note = VALUES(Nurse_Intake_Note),
        Blood_Pressure = VALUES(Blood_Pressure),
        Pulse = VALUES(Pulse),
        Respiration = VALUES(Respiration),
        Temperature = VALUES(Temperature),
        Oxygen_Saturation = VALUES(Oxygen_Saturation),
        Height = VALUES(Height),
        Weight = VALUES(Weight),
        Pain_Level = VALUES(Pain_Level),
        Updated_By_User_ID = VALUES(Updated_By_User_ID)
    ");
    $stmt->execute([
        $visitId,
        ($nurseIntakeNote === "" ? null : $nurseIntakeNote),
        ($bloodPressure === "" ? null : $bloodPressure),
        ($pulse === "" ? null : $pulse),
        ($respiration === "" ? null : $respiration),
        ($temperature === "" ? null : $temperature),
        ($oxygenSaturation === "" ? null : $oxygenSaturation),
        ($height === "" ? null : $height),
        ($weight === "" ? null : $weight),
        ($painLevel === "" ? null : $painLevel),
        $nurseUserId
    ]);

    // 4. Upsert VisitMedication
    $stmt = $pdo->prepare("
      INSERT INTO VisitMedication
      (
        Visit_ID,
        Current_Medications,
        Medication_Changes,
        Medication_Notes,
        Updated_By_User_ID
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Current_Medications = VALUES(Current_Medications),
        Medication_Changes = VALUES(Medication_Changes),
        Medication_Notes = VALUES(Medication_Notes),
        Updated_By_User_ID = VALUES(Updated_By_User_ID)
    ");
    $stmt->execute([
        $visitId,
        ($currentMedications === "" ? null : $currentMedications),
        ($medicationChanges === "" ? null : $medicationChanges),
        ($medicationNotes === "" ? null : $medicationNotes),
        $nurseUserId
    ]);

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "visitId" => $visitId
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