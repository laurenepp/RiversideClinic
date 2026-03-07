<?php
require_once "../utils.php";
require_role("Receptionist");

$data = read_json();

$first = trim($data["firstName"] ?? "");
$last  = trim($data["lastName"] ?? "");
$phone = trim($data["phone"] ?? "");
$email = trim($data["email"] ?? "");
$dob   = trim($data["dob"] ?? ""); // YYYY-MM-DD

if ($first === "" || $last === "" || $phone === "" || $dob === "") {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit;
}

$stmt = $pdo->prepare("
  INSERT INTO Patients (First_Name, Last_Name, Phone_Number, Email, Date_Of_Birth)
  VALUES (?, ?, ?, ?, ?)
");
$stmt->execute([$first, $last, $phone, ($email === "" ? null : $email), $dob]);

echo json_encode([
  "success" => true,
  "patientId" => $pdo->lastInsertId()
]);