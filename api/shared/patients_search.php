<?php
require_once "../utils.php";

if (!isset($_SESSION["user"])) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$allowedRoles = ["Administrator", "Doctor", "Nurse", "Receptionist"];
$userRole = $_SESSION["user"]["role"] ?? "";

if (!in_array($userRole, $allowedRoles, true)) {
    http_response_code(403);
    echo json_encode(["error" => "Forbidden"]);
    exit;
}

$search = trim($_GET["search"] ?? "");

if ($search === "") {
    http_response_code(400);
    echo json_encode(["error" => "search required"]);
    exit;
}

$q = "%" . $search . "%";

$stmt = $pdo->prepare("
  SELECT
    Patient_ID,
    First_Name,
    Last_Name,
    Phone_Number,
    Email,
    Date_Of_Birth
  FROM Patient
  WHERE
    First_Name LIKE ?
    OR Last_Name LIKE ?
    OR Phone_Number LIKE ?
    OR Email LIKE ?
  ORDER BY Last_Name, First_Name
  LIMIT 25
");

$stmt->execute([$q, $q, $q, $q]);

echo json_encode([
  "patients" => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);