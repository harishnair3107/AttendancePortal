<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = getDBConnection();

    // Fetch active employees
    $stmt = $pdo->query("SELECT id, emp_code, name, department FROM employees WHERE status = 'active' ORDER BY name ASC");
    $employees = $stmt->fetchAll();

    // Fetch office geolocation settings
    $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM settings");
    $settingsRaw = $stmtSettings->fetchAll();
    $settings = [];
    foreach ($settingsRaw as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    echo json_encode([
        'success' => true,
        'employees' => $employees,
        'office' => [
            'lat' => floatval($settings['office_lat'] ?? 19.076090),
            'lng' => floatval($settings['office_lng'] ?? 72.877426),
            'radius_meters' => floatval($settings['office_radius_meters'] ?? 200),
            'name' => $settings['office_name'] ?? 'Office HQ'
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching data: ' . $e->getMessage()
    ]);
}
