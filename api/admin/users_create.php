<?php
require_once "../utils.php";
require_role("Administrator");

$data = read_json();

$first = trim($data["firstName"] ?? "");
$last  = trim($data["lastName"] ?? "");
$email = trim($data["email"] ?? "");
$phone = trim($data["phone"] ?? "");
$roleName = trim($data["roleName"] ?? "");
$username = trim($data["username"] ?? "");
$password = $data["password"] ?? "";

if ($first==="" || $last==="" || $email==="" || $phone==="" || $roleName==="" || $username==="" || $password==="") {
  http_response_code(400);
  echo json_encode(["error" => "Missing required fields"]);
  exit;
}

$pdo->beginTransaction();

try {
  // Role lookup
  $stmt = $pdo->prepare("SELECT Role_ID FROM Roles WHERE Role_Name=? LIMIT 1");
  $stmt->execute([$roleName]);
  $role = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$role) throw new Exception("Invalid roleName");

  // Insert Users
  $stmt = $pdo->prepare("
    INSERT INTO Users (First_Name, Last_Name, Role_ID, Phone_Number, Email, Is_Disabled)
    VALUES (?, ?, ?, ?, ?, 0)
  ");
  $stmt->execute([$first, $last, $role["Role_ID"], $phone, $email]);
  $newUserId = (int)$pdo->lastInsertId();

  // Insert Login Info
  $hash = password_hash($password, PASSWORD_DEFAULT);
  $stmt = $pdo->prepare("
    INSERT INTO User_Login_Info (User_ID, Username, Password_Hash)
    VALUES (?, ?, ?)
  ");
  $stmt->execute([$newUserId, $username, $hash]);

  $pdo->commit();
  echo json_encode(["success" => true, "userId" => $newUserId]);

} catch (Exception $e) {
  $pdo->rollBack();
  http_response_code(400);
  echo json_encode(["error" => $e->getMessage()]);
}