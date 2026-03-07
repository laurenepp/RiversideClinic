<?php
require_once "../utils.php";
$user = require_role("Nurse");

$data = read_json();
$visitId = (int)($data["visitId"] ?? 0);
$noteText = trim($data["noteText"] ?? "");

if ($visitId <= 0 || $noteText === "") {
  http_response_code(400);
  echo json_encode(["error" => "visitId and noteText required"]);
  exit;
}

$pdo->prepare("
  INSERT INTO Visit_Notes (Visit_ID, Created_By_User_ID, Visit_Note)
  VALUES (?, ?, ?)
")->execute([$visitId, $user["id"], $noteText]);

echo json_encode(["success" => true, "noteId" => (int)$pdo->lastInsertId()]);