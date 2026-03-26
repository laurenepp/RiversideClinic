<?php
require_once "../utils.php";

/* NOTE:
   Keep doctor-only access.
*/
$user = require_role("Doctor");

/* NOTE:
   Support both POST body and query string so either call style works.
*/
$data = json_decode(file_get_contents("php://input"), true);

$appointmentId = 0;
if (is_array($data) && isset($data["appointmentId"])) {
    $appointmentId = (int)$data["appointmentId"];
} elseif (isset($_GET["appointmentId"])) {
    $appointmentId = (int)$_GET["appointmentId"];
}

/* NOTE:
   Stop early if no appointment id was sent.
*/
if ($appointmentId <= 0) {
    http_response_code(400);
    echo json_encode(["error" => "appointmentId required"]);
    exit;
}

/* NOTE:
   Make sure this appointment belongs to the logged-in doctor.
*/
$stmt = $pdo->prepare("
    SELECT Appointment_ID, Patient_ID, Provider_User_ID
    FROM Appointment
    WHERE Appointment_ID = ?
      AND Provider_User_ID = ?
    LIMIT 1
");
$stmt->execute([$appointmentId, $user["id"]]);
$appointment = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$appointment) {
    http_response_code(404);
    echo json_encode(["error" => "Appointment not found"]);
    exit;
}

/* NOTE:
   Return existing visit if already created.
*/
$stmt = $pdo->prepare("
    SELECT Visit_ID
    FROM Visit
    WHERE Appointment_ID = ?
    LIMIT 1
");
$stmt->execute([$appointmentId]);
$existingVisit = $stmt->fetch(PDO::FETCH_ASSOC);

if ($existingVisit) {
    echo json_encode([
        "visitId" => (int)$existingVisit["Visit_ID"]
    ]);
    exit;
}

/* NOTE:
   IMPORTANT CHANGE:
   Removed Visit_DateTime from the INSERT so this matches the simpler
   Visit insert pattern and does not fail if that column is not present.
*/
$stmt = $pdo->prepare("
    INSERT INTO Visit
        (Appointment_ID, Patient_ID, Provider_User_ID, Created_By_User_ID)
    VALUES
        (?, ?, ?, ?)
");
$stmt->execute([
    $appointment["Appointment_ID"],
    $appointment["Patient_ID"],
    $appointment["Provider_User_ID"],
    $user["id"]
]);

echo json_encode([
    "visitId" => (int)$pdo->lastInsertId()
]);