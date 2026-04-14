<?php
session_start();
require_once "../config.php";
require_once "../utils.php";

header('Content-Type: application/json');

require_role("Receptionist");

$patientId = (int)($_GET["patientId"] ?? 0);

if ($patientId <= 0) {
    http_response_code(400);
    echo json_encode([
        "error" => "patientId required"
    ]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT
            p.Patient_ID,
            p.First_Name,
            p.Last_Name,
            p.Phone_Number,
            p.Email,
            p.Date_Of_Birth,
            p.Address_Line1,
            p.Address_Line2,
            p.City,
            p.State,
            p.Postal_Code
        FROM Patient p
        WHERE p.Patient_ID = ?
        LIMIT 1
    ");
    $stmt->execute([$patientId]);
    $patient = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$patient) {
        http_response_code(404);
        echo json_encode([
            "error" => "Patient not found"
        ]);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT
            ec.Emergency_Contact_ID,
            ec.First_Name,
            ec.Last_Name,
            ec.Phone_Number,
            pec.Relationship_To_Patient
        FROM Patient_Emergency_Contacts pec
        JOIN Emergency_Contact ec
            ON ec.Emergency_Contact_ID = pec.Emergency_Contact_ID
        WHERE pec.Patient_ID = ?
        ORDER BY ec.Emergency_Contact_ID DESC
        LIMIT 1
    ");
    $stmt->execute([$patientId]);
    $emergency = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

    $stmt = $pdo->prepare("
        SELECT
            Insurance_ID,
            Insurance_Provider,
            Policy_Number,
            Policy_Holder,
            Payment_Status,
            Date_Sent
        FROM Insurance_Info
        WHERE Patient_ID = ?
        ORDER BY Insurance_ID DESC
        LIMIT 1
    ");
    $stmt->execute([$patientId]);
    $insurance = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

    echo json_encode([
        "patient" => $patient,
        "emergency" => $emergency,
        "insurance" => $insurance
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Failed to load patient info",
        "details" => $e->getMessage()
    ]);
}