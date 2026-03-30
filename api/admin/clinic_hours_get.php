<?php
require_once "../utils.php";
require_role("Administrator");

$stmt = $pdo->prepare("
  SELECT Clinic_Hours_ID, Day_Of_Week, Is_Open, Open_Time, Close_Time
  FROM Clinic_Hours
  ORDER BY Day_Of_Week
");
$stmt->execute();

echo json_encode([
  "hours" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);