<?php
require_once "../utils.php";
require_role("Administrator");

$stmt = $pdo->prepare("
  SELECT u.User_ID, u.First_Name, u.Last_Name, u.Email, u.Phone_Number,
         r.Role_Name, u.Is_Disabled
  FROM Users u
  JOIN Roles r ON u.Role_ID = r.Role_ID
  ORDER BY u.Last_Name, u.First_Name
");
$stmt->execute();

echo json_encode(["users" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);