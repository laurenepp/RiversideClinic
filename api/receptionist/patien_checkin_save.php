<?php
require_once "../utils.php";
require_role("Receptionist");

$data = read_json();
$appointmentId = (int)($data['appointmentId'] ?? 0);
$patientId = (int)($data['patientId'] ?? 0);
$address1 = trim($data['addressLine1'] ?? '');
$address2 = trim($data['addressLine2'] ?? '');
$city = trim($data['city'] ?? '');
$state = trim($data['state'] ?? '');
$postalCode = trim($data['postalCode'] ?? '');
$phone = trim($data['phoneNumber'] ?? '');
$insuranceProvider = trim($data['insuranceProvider'] ?? '');
$policyNumber = trim($data['policyNumber'] ?? '');
$policyHolder = trim($data['policyHolder'] ?? '');

if ($appointmentId <= 0 || $patientId <= 0 || $phone === '') {
    http_response_code(400);
    echo json_encode(["error" => "Missing required check-in fields"]);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("UPDATE Patient
        SET Phone_Number = ?, Address_Line1 = ?, Address_Line2 = ?, City = ?, State = ?, Postal_Code = ?
        WHERE Patient_ID = ?");
    $stmt->execute([
        $phone,
        ($address1 === '' ? null : $address1),
        ($address2 === '' ? null : $address2),
        ($city === '' ? null : $city),
        ($state === '' ? null : $state),
        ($postalCode === '' ? null : $postalCode),
        $patientId
    ]);

    if ($insuranceProvider !== '' || $policyNumber !== '' || $policyHolder !== '') {
        $stmt = $pdo->prepare("SELECT Insurance_ID FROM Insurance_Info WHERE Patient_ID = ? ORDER BY Updated_At DESC, Insurance_ID DESC LIMIT 1");
        $stmt->execute([$patientId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE Insurance_Info
                SET Insurance_Provider = ?, Policy_Number = ?, Policy_Holder = ?
                WHERE Insurance_ID = ?");
            $stmt->execute([
                ($insuranceProvider === '' ? 'Self Pay' : $insuranceProvider),
                ($policyNumber === '' ? null : $policyNumber),
                ($policyHolder === '' ? null : $policyHolder),
                (int)$existing['Insurance_ID']
            ]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO Insurance_Info
                (Patient_ID, Insurance_Provider, Policy_Number, Policy_Holder, Payment_Status, Date_Sent)
                VALUES (?, ?, ?, ?, 'PENDING', CURDATE())");
            $stmt->execute([
                $patientId,
                ($insuranceProvider === '' ? 'Self Pay' : $insuranceProvider),
                ($policyNumber === '' ? null : $policyNumber),
                ($policyHolder === '' ? null : $policyHolder)
            ]);
        }
    }

    $stmt = $pdo->prepare("UPDATE Appointment SET Status = 'CHECKED_IN' WHERE Appointment_ID = ?");
    $stmt->execute([$appointmentId]);

    $pdo->commit();
    echo json_encode(["success" => true]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Failed to complete check in", "details" => $e->getMessage()]);
}
