<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once __DIR__ . '/../config/db.php';

// Haversine Distance Formula in Meters
function haversineGreatCircleDistance($latitudeFrom, $longitudeFrom, $latitudeTo, $longitudeTo, $earthRadius = 6371000) {
    $latFrom = deg2rad($latitudeFrom);
    $lonFrom = deg2rad($longitudeFrom);
    $latTo = deg2rad($latitudeTo);
    $lonTo = deg2rad($longitudeTo);

    $latDelta = $latTo - $latFrom;
    $lonDelta = $lonTo - $lonFrom;

    $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
        cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
    return $angle * $earthRadius;
}

try {
    $pdo = getDBConnection();

    // Support both JSON body and standard POST form data
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    $employeeId = intval($input['employee_id'] ?? 0);
    $status = trim($input['status'] ?? 'Present');
    $latitude = isset($input['latitude']) && $input['latitude'] !== '' ? floatval($input['latitude']) : null;
    $longitude = isset($input['longitude']) && $input['longitude'] !== '' ? floatval($input['longitude']) : null;
    $accuracy = isset($input['accuracy']) && $input['accuracy'] !== '' ? floatval($input['accuracy']) : null;
    $qrData = trim($input['qr_data'] ?? '');
    $deviceInfo = isset($input['device_info']) ? (is_array($input['device_info']) ? json_encode($input['device_info']) : $input['device_info']) : null;

    if ($employeeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Please select an employee name from the list.']);
        exit;
    }

    // Verify employee exists
    $stmtEmp = $pdo->prepare("SELECT name FROM employees WHERE id = ? AND status = 'active'");
    $stmtEmp->execute([$employeeId]);
    $employee = $stmtEmp->fetch();
    if (!$employee) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Selected employee not found or inactive.']);
        exit;
    }

    // Fetch office settings
    $stmtSettings = $pdo->query("SELECT setting_key, setting_value FROM settings");
    $settingsRaw = $stmtSettings->fetchAll();
    $settings = [];
    foreach ($settingsRaw as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    $officeLat = floatval($settings['office_lat'] ?? 19.076090);
    $officeLng = floatval($settings['office_lng'] ?? 72.877426);
    $officeRadius = floatval($settings['office_radius_meters'] ?? 200);

    $distanceMeters = null;
    $isWithinRadius = 0;

    if ($latitude !== null && $longitude !== null) {
        $distanceMeters = round(haversineGreatCircleDistance($latitude, $longitude, $officeLat, $officeLng), 2);
        if ($distanceMeters <= $officeRadius) {
            $isWithinRadius = 1;
        } else {
            $isWithinRadius = 0;
        }
    }

    $currentDate = date('Y-m-d');
    $currentTime = date('H:i:s');

    // Append client IP address to device_info if not provided
    if ($deviceInfo) {
        $devData = json_decode($deviceInfo, true) ?: [];
        $devData['ip'] = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
        $devData['user_agent_header'] = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
        $deviceInfo = json_encode($devData);
    } else {
        $deviceInfo = json_encode([
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
            'user_agent_header' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown'
        ]);
    }

    // Insert attendance record
    $stmt = $pdo->prepare("INSERT INTO attendance 
        (employee_id, attendance_date, attendance_time, status, latitude, longitude, location_accuracy, distance_meters, is_within_radius, qr_data, device_info)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $employeeId,
        $currentDate,
        $currentTime,
        $status,
        $latitude,
        $longitude,
        $accuracy,
        $distanceMeters,
        $isWithinRadius,
        $qrData,
        $deviceInfo
    ]);

    $attendanceId = $pdo->lastInsertId();

    $locationStatusMsg = $isWithinRadius 
        ? "Within Office Radius ({$distanceMeters}m from Office)"
        : ($distanceMeters !== null ? "Outside Office Radius ({$distanceMeters}m from Office, Limit: {$officeRadius}m)" : "Location unavailable");

    echo json_encode([
        'success' => true,
        'message' => "Attendance recorded successfully for {$employee['name']}!",
        'attendance_id' => $attendanceId,
        'employee_name' => $employee['name'],
        'date' => $currentDate,
        'time' => $currentTime,
        'status' => $status,
        'distance_meters' => $distanceMeters,
        'office_radius' => $officeRadius,
        'is_within_radius' => (bool)$isWithinRadius,
        'location_status' => $locationStatusMsg
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to record attendance: ' . $e->getMessage()
    ]);
}
