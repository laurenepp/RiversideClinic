<?php
require_once "../utils.php";
$user = require_role("Nurse");

$data = read_json();
$appointmentId = (int)($data["appointmentId"] ?? 0);

$vitals = trim($data["vitals"] ?? "");
$chief  = trim($data["chiefComplaint"] ?? "");
$allergies = trim($data["allergies"] ?? "");
$meds = trim($data["medications"] ?? "");

if ($appointmentId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "appointmentId required"]);
  exit;
}

$stmt = $pdo->prepare("SELECT Intake_ID FROM Intakes WHERE Appointment_ID=? LIMIT 1");
$stmt->execute([$appointmentId]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existing) {
  $pdo->prepare("
    UPDATE Intakes
    SET Vitals=?, Chief_Complaint=?, Allergies=?, Medications=?
    WHERE Appointment_ID=?
  ")->execute([$vitals, $chief, $allergies, $meds, $appointmentId]);

  echo json_encode(["success" => true, "updated" => true, "intakeId" => (int)$existing["Intake_ID"]]);
  exit;
}

$pdo->prepare("
  INSERT INTO Intakes (Appointment_ID, Created_By_User_ID, Vitals, Chief_Complaint, Allergies, Medications)
  VALUES (?, ?, ?, ?, ?, ?)
")->execute([$appointmentId, $user["id"], $vitals, $chief, $allergies, $meds]);

echo json_encode(["success" => true, "updated" => false, "intakeId" => (int)$pdo->lastInsertId()]);