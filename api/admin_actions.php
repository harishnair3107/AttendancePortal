<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config/db.php';

// Check admin authentication
if (empty($_SESSION['admin_logged_in'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized admin session. Please log in.']);
    exit;
}

$pdo = getDBConnection();
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?: $_POST;
$action = trim($input['action'] ?? '');

try {
    switch ($action) {
        case 'add_employee':
            $empCode = trim($input['emp_code'] ?? '');
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $department = trim($input['department'] ?? 'General');
            $status = trim($input['status'] ?? 'active');

            if (empty($empCode) || empty($name)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Employee code and name are required.']);
                exit;
            }

            // Check duplicate emp_code
            $chk = $pdo->prepare("SELECT id FROM employees WHERE emp_code = ?");
            $chk->execute([$empCode]);
            if ($chk->fetch()) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Employee Code already exists.']);
                exit;
            }

            $stmt = $pdo->prepare("INSERT INTO employees (emp_code, name, email, department, status) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$empCode, $name, $email, $department, $status]);

            echo json_encode(['success' => true, 'message' => "Employee '{$name}' created successfully!"]);
            break;

        case 'update_employee':
            $id = intval($input['id'] ?? 0);
            $empCode = trim($input['emp_code'] ?? '');
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '');
            $department = trim($input['department'] ?? 'General');
            $status = trim($input['status'] ?? 'active');

            if ($id <= 0 || empty($name) || empty($empCode)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid employee ID or missing details.']);
                exit;
            }

            $stmt = $pdo->prepare("UPDATE employees SET emp_code = ?, name = ?, email = ?, department = ?, status = ? WHERE id = ?");
            $stmt->execute([$empCode, $name, $email, $department, $status, $id]);

            echo json_encode(['success' => true, 'message' => "Employee details updated successfully."]);
            break;

        case 'delete_employee':
            $id = intval($input['id'] ?? 0);
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid employee ID.']);
                exit;
            }

            $stmt = $pdo->prepare("DELETE FROM employees WHERE id = ?");
            $stmt->execute([$id]);

            echo json_encode(['success' => true, 'message' => "Employee deleted successfully."]);
            break;

        case 'update_settings':
            $officeLat = trim($input['office_lat'] ?? '');
            $officeLng = trim($input['office_lng'] ?? '');
            $officeRadius = trim($input['office_radius_meters'] ?? '200');
            $officeName = trim($input['office_name'] ?? 'Main Office HQ');

            if (!is_numeric($officeLat) || !is_numeric($officeLng) || !is_numeric($officeRadius)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Please provide valid numerical coordinates and radius.']);
                exit;
            }

            $settings = [
                'office_lat' => $officeLat,
                'office_lng' => $officeLng,
                'office_radius_meters' => $officeRadius,
                'office_name' => $officeName
            ];

            foreach ($settings as $k => $v) {
                // Upsert settings
                $chk = $pdo->prepare("SELECT setting_key FROM settings WHERE setting_key = ?");
                $chk->execute([$k]);
                if ($chk->fetch()) {
                    $upd = $pdo->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?");
                    $upd->execute([$v, $k]);
                } else {
                    $ins = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
                    $ins->execute([$k, $v]);
                }
            }

            echo json_encode(['success' => true, 'message' => 'Office location and radius configuration updated successfully!']);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action specified.']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
