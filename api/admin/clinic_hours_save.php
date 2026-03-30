<?php
require_once "../utils.php";
require_role("Administrator");

$data = read_json();
$hours = $data["hours"] ?? [];

if (!is_array($hours) || !count($hours)) {
    http_response_code(400);
    echo json_encode(["error" => "hours array required"]);
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("
      INSERT INTO Clinic_Hours (Day_Of_Week, Is_Open, Open_Time, Close_Time)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        Is_Open = VALUES(Is_Open),
        Open_Time = VALUES(Open_Time),
        Close_Time = VALUES(Close_Time)
    ");

    foreach ($hours as $row) {
        $day = (int)($row["dayOfWeek"] ?? 0);
        $isOpen = !empty($row["isOpen"]) ? 1 : 0;
        $openTime = trim($row["openTime"] ?? "");
        $closeTime = trim($row["closeTime"] ?? "");

        if ($day < 1 || $day > 7) {
            throw new Exception("Invalid day of week");
        }

        if ($isOpen) {
            if ($openTime === "" || $closeTime === "") {
                throw new Exception("Open and close times are required for open days");
            }
            if (strlen($openTime) === 5) $openTime .= ":00";
            if (strlen($closeTime) === 5) $closeTime .= ":00";
        } else {
            $openTime = null;
            $closeTime = null;
        }

        $stmt->execute([$day, $isOpen, $openTime, $closeTime]);
    }

    $pdo->commit();

    echo json_encode(["success" => true]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        "error" => "Failed to save clinic hours",
        "details" => $e->getMessage()
    ]);
}