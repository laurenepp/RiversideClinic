<?php
require_once "../utils.php";
require_role("Receptionist");

$data = read_json();

$first = trim($data["firstName"] ?? "");
$last  = trim($data["lastName"] ?? "");
$phone = trim($data["phone"] ?? "");
$email = trim($data["email"] ?? "");
$dob   = trim($data["dob"] ?? "");

$ecFirst = trim($data["emergencyFirstName"] ?? "");
$ecLast  = trim($data["emergencyLastName"] ?? "");
$ecPhone = trim($data["emergencyPhone"] ?? "");
$ecRel   = trim($data["emergencyRelationship"] ?? "");

$insProvider = trim($data["insuranceProvider"] ?? "");
$insStatus   = trim($data["insuranceStatus"] ?? "");
$insDateSent = trim($data["insuranceDateSent"] ?? "");

if ($first === "" || $last === "" || $phone === "" || $dob === "") {
    http_response_code(400);
    echo json_encode(["error" => "Missing required patient fields"]);
    exit;
}

try {
    $pdo->beginTransaction();

    // Create patient
    $stmt = $pdo->prepare("
      INSERT INTO Patient (First_Name, Last_Name, Phone_Number, Email, Date_Of_Birth)
      VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$first, $last, $phone, ($email === "" ? null : $email), $dob]);

    $patientId = $pdo->lastInsertId();

    // Optional emergency contact
    $hasEmergency = ($ecFirst !== "" && $ecLast !== "" && $ecPhone !== "" && $ecRel !== "");

    if ($hasEmergency) {
        $stmt = $pdo->prepare("
          INSERT INTO Emergency_Contact (First_Name, Last_Name, Phone_Number)
          VALUES (?, ?, ?)
        ");
        $stmt->execute([$ecFirst, $ecLast, $ecPhone]);

        $emergencyContactId = $pdo->lastInsertId();

        $stmt = $pdo->prepare("
          INSERT INTO Patient_Emergency_Contacts
          (Patient_ID, Emergency_Contact_ID, Relationship_To_Patient, Emergency_Contact_Emergency_Contact_ID)
          VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$patientId, $emergencyContactId, $ecRel, $emergencyContactId]);
    }

    // Optional insurance
    $hasInsurance = ($insProvider !== "" && $insStatus !== "" && $insDateSent !== "");

    if ($hasInsurance) {
        $stmt = $pdo->prepare("
          INSERT INTO Insurance_Info
          (Patient_ID, Insurance_Provider, Payment_Status, Date_Sent, Patient_Patient_ID)
          VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$patientId, $insProvider, $insStatus, $insDateSent, $patientId]);
    }

    $pdo->commit();

    echo json_encode([
      "success" => true,
      "patientId" => $patientId
    ]);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
      "error" => "Failed to create patient record",
      "details" => $e->getMessage()
    ]);
}