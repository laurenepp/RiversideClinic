<?php
require_once "../utils.php";
require_role("Administrator");

$data = read_json();
$userId = (int)($data["userId"] ?? 0);
$isDisabled = (int)($data["isDisabled"] ?? 0);

if ($userId <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "userId required"]);
  exit;
}

$stmt = $pdo->prepare("UPDATE Users SET Is_Disabled=? WHERE User_ID=?");
$stmt->execute([$isDisabled ? 1 : 0, $userId]);

echo json_encode(["success" => true]);