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

$providerId = (int)($_GET["providerId"] ?? 0);

$sql = "
  SELECT
    ps.Schedule_ID,
    ps.Provider_User_ID,
    ps.Day_Of_The_Week,
    ps.Start_Time,
    ps.End_Time,
    u.First_Name,
    u.Last_Name
  FROM Provider_Schedule ps
  JOIN Users u ON ps.Provider_User_ID = u.User_ID
";
$params = [];

if ($providerId > 0) {
    $sql .= " WHERE ps.Provider_User_ID = ? ";
    $params[] = $providerId;
}

$sql .= " ORDER BY ps.Provider_User_ID, ps.Day_Of_The_Week, ps.Start_Time";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode([
    "schedules" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);