<?php
require_once "../utils.php";
require_role("Receptionist");

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