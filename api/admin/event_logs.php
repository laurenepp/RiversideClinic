<?php
require_once "../utils.php";

header('Content-Type: application/json');
require_role("Administrator");

/*
  Schema-free audit/event log endpoint.

  Priority:
  1. Read file-based audit logs from /logs/audit-*.log
  2. If Audit_Log table exists, include DB-based logs too
  3. Return a normalized array that supports BOTH:
     - old frontend keys: Audit_Date, Action_Type, Details, Severity
     - new frontend keys: date, actionType, details, severity, user, id
*/

function admin_event_logs_stringify_details($details): string
{
    if (is_string($details)) {
        return trim($details);
    }

    if (!is_array($details)) {
        return "";
    }

    $parts = [];

    foreach ($details as $key => $value) {
        if (is_array($value)) {
            $value = json_encode($value, JSON_UNESCAPED_SLASHES);
        } elseif (is_bool($value)) {
            $value = $value ? "true" : "false";
        } elseif ($value === null) {
            $value = "null";
        }

        $parts[] = $key . "=" . $value;
    }

    return implode(" | ", $parts);
}

function admin_event_logs_normalize_severity($severity): string
{
    $s = strtolower(trim((string)$severity));

    if ($s === "critical") return "Critical";
    if ($s === "warning" || $s === "warn") return "Warning";
    return "Info";
}

function admin_event_logs_make_row(
    $id,
    $date,
    $user,
    $actionType,
    $severity,
    $details
): array {
    $severity = admin_event_logs_normalize_severity($severity);
    $details = trim((string)$details);
    $user = trim((string)$user);
    $actionType = trim((string)$actionType);
    $date = trim((string)$date);

    if ($user === "") {
        $user = "System";
    }

    if ($actionType === "") {
        $actionType = "Activity";
    }

    return [
        // New keys used by Event Logs page / filters / system alerts
        "id" => (string)$id,
        "date" => $date,
        "user" => $user,
        "actionType" => $actionType,
        "severity" => $severity,
        "details" => $details,

        // Old keys still used by Recent Activity
        "Audit_Log_ID" => (string)$id,
        "Audit_Date" => $date,
        "User_Name" => $user,
        "Action_Type" => $actionType,
        "Severity" => $severity,
        "Details" => $details
    ];
}

function admin_event_logs_read_file_logs(): array
{
    $rows = [];
    $logsDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . "logs";

    if (!is_dir($logsDir)) {
        return $rows;
    }

    $files = glob($logsDir . DIRECTORY_SEPARATOR . "audit-*.log");
    if (!$files) {
        return $rows;
    }

    rsort($files, SORT_NATURAL);

    foreach ($files as $filePath) {
        $lines = @file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) {
            continue;
        }

        foreach ($lines as $lineNumber => $line) {
            $decoded = json_decode($line, true);
            if (!is_array($decoded)) {
                continue;
            }

            $id = $decoded["id"] ?? ("file-" . basename($filePath) . "-" . ($lineNumber + 1));
            $date = $decoded["timestamp"] ?? "";
            $user = $decoded["user"] ?? "System";
            $actionType = $decoded["actionType"] ?? "Activity";
            $severity = $decoded["severity"] ?? "Info";
            $details = admin_event_logs_stringify_details($decoded["details"] ?? "");

            $rows[] = admin_event_logs_make_row(
                $id,
                $date,
                $user,
                $actionType,
                $severity,
                $details
            );
        }
    }

    return $rows;
}

function admin_event_logs_db_table_exists(PDO $pdo, string $tableName): bool
{
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) AS cnt
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
              AND table_name = ?
        ");
        $stmt->execute([$tableName]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return ((int)($row["cnt"] ?? 0) > 0);
    } catch (Throwable $e) {
        return false;
    }
}

function admin_event_logs_read_db_logs(PDO $pdo): array
{
    $rows = [];

    if (!admin_event_logs_db_table_exists($pdo, "Audit_Log")) {
        return $rows;
    }

    try {
        $stmt = $pdo->query("
            SELECT
                Audit_Log_ID,
                Audit_Date,
                User_Name,
                Action_Type,
                Severity,
                Details
            FROM Audit_Log
            ORDER BY Audit_Date DESC, Audit_Log_ID DESC
        ");

        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($data as $row) {
            $rows[] = admin_event_logs_make_row(
                $row["Audit_Log_ID"] ?? "",
                $row["Audit_Date"] ?? "",
                $row["User_Name"] ?? "System",
                $row["Action_Type"] ?? "Activity",
                $row["Severity"] ?? "Info",
                $row["Details"] ?? ""
            );
        }
    } catch (Throwable $e) {
        // Fail quietly so file-based logs still work.
    }

    return $rows;
}

function admin_event_logs_sort_desc(array $rows): array
{
    usort($rows, function ($a, $b) {
        $timeA = strtotime($a["date"] ?? "") ?: 0;
        $timeB = strtotime($b["date"] ?? "") ?: 0;

        if ($timeA === $timeB) {
            return strcmp((string)($b["id"] ?? ""), (string)($a["id"] ?? ""));
        }

        return $timeB <=> $timeA;
    });

    return $rows;
}

try {
    $fileLogs = admin_event_logs_read_file_logs();
    $dbLogs = admin_event_logs_read_db_logs($pdo);

    $allLogs = array_merge($fileLogs, $dbLogs);
    $allLogs = admin_event_logs_sort_desc($allLogs);

    $hours = isset($_GET["hours"]) ? (int)$_GET["hours"] : 0;
if ($hours > 0) {
    $cutoff = time() - ($hours * 3600);

    $allLogs = array_values(array_filter($allLogs, function ($row) use ($cutoff) {
        $rowTime = strtotime($row["date"] ?? "");
        return $rowTime !== false && $rowTime >= $cutoff;
    }));
}

    echo json_encode($allLogs);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Unable to load event logs"
    ]);
}