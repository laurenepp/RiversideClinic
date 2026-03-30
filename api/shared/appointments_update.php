<?php
require_once "../utils.php";

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$allowedRoles = ["Administrator", "Doctor", "Nurse", "Receptionist"];
$userRole = $_SESSION["user"]["role"] ?? "";

if (!in_array($userRole, $allowedRoles, true)) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
}

$data = read_json();

$appointmentId = (int)($data["appointmentId"] ?? 0);
$startDT       = trim($data["startDateTime"] ?? "");
$endDT         = trim($data["endDateTime"] ?? "");
$status        = trim($data["status"] ?? "");

$allowedStatuses = ["SCHEDULED", "CHECKED_IN", "COMPLETED", "RESCHEDULED", "CANCELLED"];

if ($appointmentId <= 0 || $startDT === "" || $endDT === "" || $status === "") {
    http_response_code(400);
    echo json_encode(["error" => "Invalid or missing fields"]);
    exit;
}

if (!in_array($status, $allowedStatuses, true)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid status"]);
    exit;
}

/* get provider from existing appointment */
$stmt = $pdo->prepare("
  SELECT Provider_User_ID
  FROM Appointment
  WHERE Appointment_ID = ?
  LIMIT 1
");
$stmt->execute([$appointmentId]);
$appt = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$appt) {
    http_response_code(404);
    echo json_encode(["error" => "Appointment not found"]);
    exit;
}

$providerId = (int)$appt["Provider_User_ID"];

$startObj = new DateTime($startDT);
$endObj   = new DateTime($endDT);

if ($startObj >= $endObj) {
    http_response_code(400);
    echo json_encode(["error" => "Start time must be before end time"]);
    exit;
}

$dayOfWeek = (int)$startObj->format("w") + 1;
$startTime = $startObj->format("H:i:s");
$endTime   = $endObj->format("H:i:s");

/* =========================
   Validate clinic hours
========================= */
$stmt = $pdo->prepare("
  SELECT Is_Open, Open_Time, Close_Time
  FROM Clinic_Hours
  WHERE Day_Of_Week = ?
  LIMIT 1
");
$stmt->execute([$dayOfWeek]);
$clinicHours = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$clinicHours) {
    http_response_code(400);
    echo json_encode(["error" => "Clinic hours are not configured for this day"]);
    exit;
}

if ((int)$clinicHours["Is_Open"] !== 1) {
    http_response_code(400);
    echo json_encode(["error" => "The clinic is closed on that day"]);
    exit;
}

$openTime = $clinicHours["Open_Time"];
$closeTime = $clinicHours["Close_Time"];

if ($startTime < $openTime || $endTime > $closeTime) {
    http_response_code(400);
    echo json_encode([
        "error" => "Appointment is outside clinic hours",
        "clinicOpen" => $openTime,
        "clinicClose" => $closeTime
    ]);
    exit;
}

/* =========================
   Validate provider schedule
========================= */
$stmt = $pdo->prepare("
  SELECT Schedule_ID, Start_Time, End_Time
  FROM Provider_Schedule
  WHERE Provider_User_ID = ?
    AND Day_Of_The_Week = ?
  ORDER BY Start_Time
");
$stmt->execute([$providerId, $dayOfWeek]);
$scheduleBlocks = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!$scheduleBlocks) {
    http_response_code(400);
    echo json_encode([
        "error" => "Provider is not scheduled to work on that day"
    ]);
    exit;
}

$fitsProviderSchedule = false;
foreach ($scheduleBlocks as $block) {
    if ($startTime >= $block["Start_Time"] && $endTime <= $block["End_Time"]) {
        $fitsProviderSchedule = true;
        break;
    }
}

if (!$fitsProviderSchedule) {
    http_response_code(400);
    echo json_encode([
        "error" => "Appointment is outside provider schedule"
    ]);
    exit;
}

/* =========================
   Update appointment
========================= */
$startSQL = $startObj->format("Y-m-d H:i:s");
$endSQL   = $endObj->format("Y-m-d H:i:s");

$stmt = $pdo->prepare("
  UPDATE Appointment
  SET Scheduled_Start = ?, Scheduled_End = ?, Status = ?
  WHERE Appointment_ID = ?
");
$stmt->execute([$startSQL, $endSQL, $status, $appointmentId]);

echo json_encode(["success" => true]);