<?php

require_once __DIR__ . '/../utils.php';
$user = require_role('Administrator');

header('Content-Type: application/json');

function mapSeverity(string $actionType): string
{
    $action = strtoupper(trim($actionType));

    $critical = [
        'LOGIN_FAILURE',
        'USER_DISABLED',
        'ACCOUNT_LOCKED',
        'FAILED_LOGIN',
        'CRITICAL_ERROR'
    ];

    $warning = [
        'PASSWORD_RESET',
        'PERMISSION_CHANGE',
        'ROLE_UPDATED',
        'USER_UPDATED',
        'WARNING'
    ];

    if (in_array($action, $critical, true)) {
        return 'Critical';
    }

    if (in_array($action, $warning, true)) {
        return 'Warning';
    }

    return 'Info';
}

function tableExists(PDO $pdo, string $tableName): bool
{
    $sql = "
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()
          AND table_name = ?
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$tableName]);

    return (int)$stmt->fetchColumn() > 0;
}

try {
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        echo json_encode([]);
        exit;
    }

    if (!tableExists($pdo, 'Audit_Log')) {
        echo json_encode([]);
        exit;
    }

    $userTable = null;

    if (tableExists($pdo, 'Users')) {
        $userTable = 'Users';
    } elseif (tableExists($pdo, 'User')) {
        $userTable = 'User';
    }

    if ($userTable) {
        $sql = "
            SELECT
                a.Audit_Log_ID,
                a.Audit_Date,
                a.Action_Type,
                a.Details,
                u.First_Name,
                u.Last_Name
            FROM Audit_Log a
            LEFT JOIN {$userTable} u
                ON a.User_ID = u.User_ID
            ORDER BY a.Audit_Date DESC
            LIMIT 200
        ";
    } else {
        $sql = "
            SELECT
                a.Audit_Log_ID,
                a.Audit_Date,
                a.Action_Type,
                a.Details,
                '' AS First_Name,
                '' AS Last_Name
            FROM Audit_Log a
            ORDER BY a.Audit_Date DESC
            LIMIT 200
        ";
    }

    $stmt = $pdo->query($sql);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $logs = [];

    foreach ($rows as $row) {
        $fullName = trim(($row['First_Name'] ?? '') . ' ' . ($row['Last_Name'] ?? ''));

        if ($fullName === '') {
            $fullName = 'System';
        }

        $logs[] = [
            'id' => (int)($row['Audit_Log_ID'] ?? 0),
            'date' => $row['Audit_Date'] ?? '',
            'actionType' => $row['Action_Type'] ?? '',
            'user' => $fullName,
            'severity' => mapSeverity($row['Action_Type'] ?? ''),
            'details' => $row['Details'] ?? ''
        ];
    }

    echo json_encode($logs);
} catch (Throwable $e) {
    echo json_encode([]);
}