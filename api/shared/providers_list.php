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

$stmt = $pdo->prepare("
  SELECT u.User_ID, u.First_Name, u.Last_Name
  FROM Users u
  JOIN Roles r ON u.Role_ID = r.Role_ID
  WHERE r.Role_Name = 'Doctor'
  ORDER BY u.Last_Name, u.First_Name
");
$stmt->execute();

echo json_encode([
  "providers" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);