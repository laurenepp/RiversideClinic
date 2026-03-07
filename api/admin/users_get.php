<?php
require_once "../utils.php";
require_role("Administrator");

$userId = (int)($_GET["userId"] ?? 0);
if ($userId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "userId required"]);
  exit;
}

$stmt = $pdo->prepare("
  SELECT u.User_ID, u.First_Name, u.Last_Name, u.Email, u.Phone_Number,
         r.Role_Name, u.Is_Disabled
  FROM Users u
  JOIN Roles r ON u.Role_ID = r.Role_ID
  WHERE u.User_ID = ?
  LIMIT 1
");
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
  http_response_code(404);
  echo json_encode(["error" => "User not found"]);
  exit;
}

echo json_encode(["user" => $user]);