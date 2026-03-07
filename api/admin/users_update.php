<?php
require_once "../utils.php";
require_role("Administrator");

$data = read_json();

$userId = (int)($data["userId"] ?? 0);
$first = trim($data["firstName"] ?? "");
$last  = trim($data["lastName"] ?? "");
$email = trim($data["email"] ?? "");
$phone = trim($data["phone"] ?? "");
$roleName = trim($data["roleName"] ?? "");

if ($userId<=0 || $first==="" || $last==="" || $email==="" || $phone==="" || $roleName==="") {
  http_response_code(400);
  echo json_encode(["error" => "Invalid or missing fields"]);
  exit;
}

$stmt = $pdo->prepare("SELECT Role_ID FROM Roles WHERE Role_Name=? LIMIT 1");
$stmt->execute([$roleName]);
$role = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$role) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid roleName"]);
  exit;
}

$stmt = $pdo->prepare("
  UPDATE Users
  SET First_Name=?, Last_Name=?, Email=?, Phone_Number=?, Role_ID=?
  WHERE User_ID=?
");
$stmt->execute([$first, $last, $email, $phone, $role["Role_ID"], $userId]);

echo json_encode(["success" => true]);