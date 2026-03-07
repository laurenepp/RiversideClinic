<?php
require_once "../utils.php";
require_role("Receptionist");

$data = read_json();

$patientId = (int)($data["patientId"] ?? 0);
$first = trim($data["firstName"] ?? "");
$last  = trim($data["lastName"] ?? "");
$phone = trim($data["phone"] ?? "");
$email = trim($data["email"] ?? "");
$dob   = trim($data["dob"] ?? "");

if ($patientId <= 0 || $first === "" || $last === "" || $phone === "" || $dob === "") {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing fields"]);
    exit;
}

$stmt = $pdo->prepare("
  UPDATE Patients
  SET First_Name=?, Last_Name=?, Phone_Number=?, Email=?, Date_Of_Birth=?
  WHERE Patient_ID=?
");
$stmt->execute([$first, $last, $phone, ($email === "" ? null : $email), $dob, $patientId]);

echo json_encode(["success" => true]);