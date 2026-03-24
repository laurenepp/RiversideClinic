<?php
require_once "../utils.php";
require_role("Receptionist");

$search = $_GET['search'] ?? '';
$search = trim($search);

if ($search === '') {
    echo json_encode(["patients" => []]);
    exit;
}

$like = "%" . $search . "%";

$stmt = $pdo->prepare("
  SELECT Patient_ID, First_Name, Last_Name, Phone_Number, Email, Date_Of_Birth
  FROM Patient
  WHERE First_Name LIKE ? OR Last_Name LIKE ? OR Phone_Number LIKE ? OR Email LIKE ?
  ORDER BY Last_Name, First_Name
  LIMIT 50
");
$stmt->execute([$like, $like, $like, $like]);

echo json_encode(["patients" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);