<?php
require_once "../utils.php";
require_role("Nurse");

$visitId = (int)($_GET["visitId"] ?? 0);
if ($visitId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "visitId required"]);
  exit;
}

$stmt = $pdo->prepare("
  SELECT n.Note_ID, n.Visit_ID, n.Visit_Note, n.Note_DateTime,
         u.First_Name, u.Last_Name
  FROM Visit_Notes n
  JOIN Users u ON n.Created_By_User_ID = u.User_ID
  WHERE n.Visit_ID = ?
  ORDER BY n.Note_DateTime DESC
");
$stmt->execute([$visitId]);

echo json_encode(["notes" => $stmt->fetchAll(PDO::FETCH_ASSOC)]);