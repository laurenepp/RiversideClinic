<?php
session_start();
require_once "../config.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

$stmt = $pdo->prepare("
  SELECT u.User_ID, u.First_Name, u.Last_Name, r.Role_Name, li.Password_Hash, u.Is_Disabled
  FROM users u
  JOIN user_login_info li ON u.User_ID = li.User_ID
  JOIN roles r ON u.Role_ID = r.Role_ID
  WHERE li.Username = ?
");

$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if(!$user || $password !== $user['Password_Hash']){
  http_response_code(401);
  echo json_encode(["error"=>"Invalid login"]);
  exit;
}

if ((int)$user['Is_Disabled'] === 1) {
    http_response_code(403);
    echo json_encode(["error" => "Account disabled"]);
    exit;
}

$_SESSION['user'] = [
    "id"=>$user['User_ID'],
    "name"=>$user['First_Name']." ".$user['Last_Name'],
    "role"=>$user['Role_Name']
];

echo json_encode($_SESSION['user']);