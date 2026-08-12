<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    header('Location: login.php');
    exit;
}

require_once __DIR__ . '/../config/db.php';

$pdo = getDBConnection();

// Fetch filter parameters
$filterDate = trim($_GET['date'] ?? '');
$filterEmp = trim($_GET['emp_id'] ?? '');
$filterStatus = trim($_GET['status_range'] ?? '');

// Build Query
$sql = "SELECT a.*, e.name as emp_name, e.emp_code, e.department 
        FROM attendance a 
        JOIN employees e ON a.employee_id = e.id 
        WHERE 1=1";

$params = [];

if (!empty($filterDate)) {
    $sql .= " AND a.attendance_date = ?";
    $params[] = $filterDate;
}

if (!empty($filterEmp)) {
    $sql .= " AND a.employee_id = ?";
    $params[] = $filterEmp;
}

if ($filterStatus === 'within') {
    $sql .= " AND a.is_within_radius = 1";
} elseif ($filterStatus === 'outside') {
    $sql .= " AND a.is_within_radius = 0";
}

$sql .= " ORDER BY a.attendance_date DESC, a.attendance_time DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$attendanceRecords = $stmt->fetchAll();

// Fetch all employees for filter dropdown
$employees = $pdo->query("SELECT id, name, emp_code FROM employees ORDER BY name ASC")->fetchAll();

// Fetch summary metrics
$todayDate = date('Y-m-d');
$totalToday = $pdo->query("SELECT COUNT(*) FROM attendance WHERE attendance_date = '$todayDate'")->fetchColumn();
$insideToday = $pdo->query("SELECT COUNT(*) FROM attendance WHERE attendance_date = '$todayDate' AND is_within_radius = 1")->fetchColumn();
$outsideToday = $pdo->query("SELECT COUNT(*) FROM attendance WHERE attendance_date = '$todayDate' AND is_within_radius = 0")->fetchColumn();
$totalEmployees = $pdo->query("SELECT COUNT(*) FROM employees WHERE status = 'active'")->fetchColumn();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Daily Attendance Logs - Admin Dashboard</title>
    <link rel="stylesheet" href="../assets/css/admin.css">
</head>
<body>

    <!-- Sidebar -->
    <aside class="admin-sidebar">
        <div class="sidebar-brand">Attendance Admin</div>
        <ul class="sidebar-menu">
            <li><a href="dashboard.php" class="active">📅 Attendance Logs</a></li>
            <li><a href="employees.php">👥 Employee Manager</a></li>
            <li><a href="settings.php">⚙️ Office Location Settings</a></li>
            <li><a href="../index.php" target="_blank">📱 Mobile Scanner View</a></li>
            <li><a href="logout.php">🚪 Log Out</a></li>
        </ul>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
        <header class="admin-header">
            <h1 class="admin-title">Daily Attendance Logs</h1>
            <div class="admin-user">
                Logged in as <b><?= htmlspecialchars($_SESSION['admin_username']) ?></b>
            </div>
        </header>

        <div class="admin-content">
            <!-- Stats Row -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Today</div>
                    <div class="stat-value"><?= $totalToday ?></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">In Office Radius (200m)</div>
                    <div class="stat-value" style="color: var(--admin-success);"><?= $insideToday ?></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Outside Office</div>
                    <div class="stat-value" style="color: var(--admin-danger);"><?= $outsideToday ?></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Employees</div>
                    <div class="stat-value"><?= $totalEmployees ?></div>
                </div>
            </div>

            <!-- Table & Filters Panel -->
            <div class="card-panel">
                <div class="panel-header">
                    <h2>Attendance Records</h2>

                    <!-- Filter Bar -->
                    <form method="GET" action="dashboard.php" class="filter-bar">
                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; display: block; color: var(--admin-muted);">Filter Date:</label>
                            <input type="date" name="date" class="form-control" value="<?= htmlspecialchars($filterDate) ?>" onchange="this.form.submit()">
                        </div>

                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; display: block; color: var(--admin-muted);">Filter Employee:</label>
                            <select name="emp_id" class="form-control" onchange="this.form.submit()">
                                <option value="">All Employees</option>
                                <?php foreach ($employees as $emp): ?>
                                    <option value="<?= $emp['id'] ?>" <?= $filterEmp == $emp['id'] ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($emp['name']) ?> (<?= htmlspecialchars($emp['emp_code']) ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div>
                            <label style="font-size: 0.8rem; font-weight: 600; display: block; color: var(--admin-muted);">Location Check:</label>
                            <select name="status_range" class="form-control" onchange="this.form.submit()">
                                <option value="">All Locations</option>
                                <option value="within" <?= $filterStatus === 'within' ? 'selected' : '' ?>>In Office (<= 200m)</option>
                                <option value="outside" <?= $filterStatus === 'outside' ? 'selected' : '' ?>>Outside Office (> 200m)</option>
                            </select>
                        </div>

                        <div style="margin-top: 18px;">
                            <a href="dashboard.php" class="btn-admin" style="background-color: var(--admin-muted); text-decoration: none;">Reset Filters</a>
                            <button type="button" class="btn-admin btn-success" id="btn-export-csv">Export CSV</button>
                        </div>
                    </form>
                </div>

                <!-- Data Table -->
                <table class="admin-table" id="attendance-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date & Time</th>
                            <th>Employee</th>
                            <th>Department</th>
                            <th>Action</th>
                            <th>Location Verification</th>
                            <th>GPS Coordinates</th>
                            <th>Scanned QR Data</th>
                            <th>Device Telemetry</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($attendanceRecords)): ?>
                            <tr>
                                <td colspan="9" style="text-align: center; color: var(--admin-muted); padding: 24px;">
                                    No attendance records found for the selected filter criteria.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($attendanceRecords as $row): ?>
                                <tr>
                                    <td>#<?= $row['id'] ?></td>
                                    <td>
                                        <b><?= htmlspecialchars($row['attendance_date']) ?></b><br>
                                        <span style="font-size: 0.8rem; color: var(--admin-muted);"><?= htmlspecialchars($row['attendance_time']) ?></span>
                                    </td>
                                    <td>
                                        <b><?= htmlspecialchars($row['emp_name']) ?></b><br>
                                        <span style="font-size: 0.8rem; color: var(--admin-muted);"><?= htmlspecialchars($row['emp_code']) ?></span>
                                    </td>
                                    <td><?= htmlspecialchars($row['department']) ?></td>
                                    <td>
                                        <span class="badge badge-secondary"><?= htmlspecialchars($row['status']) ?></span>
                                    </td>
                                    <td>
                                        <?php if ($row['is_within_radius']): ?>
                                            <span class="badge badge-success">✓ In Office (<?= round($row['distance_meters']) ?>m)</span>
                                        <?php else: ?>
                                            <span class="badge badge-danger">⚠️ Out of Range (<?= round($row['distance_meters']) ?>m)</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if ($row['latitude'] && $row['longitude']): ?>
                                            <a href="https://maps.google.com/?q=<?= $row['latitude'] ?>,<?= $row['longitude'] ?>" target="_blank" style="color: var(--admin-primary); text-decoration: underline;">
                                                <?= round($row['latitude'], 5) ?>, <?= round($row['longitude'], 5) ?> ↗
                                            </a>
                                        <?php else: ?>
                                            <span style="color: var(--admin-muted);">N/A</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <code style="font-size: 0.78rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; max-width: 150px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            <?= htmlspecialchars($row['qr_data'] ?: 'None') ?>
                                        </code>
                                    </td>
                                    <td>
                                        <button type="button" class="btn-admin btn-telemetry" data-info='<?= htmlspecialchars($row['device_info'], ENT_QUOTES, 'UTF-8') ?>' style="padding: 4px 10px; font-size: 0.78rem;">
                                            View Data
                                        </button>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Telemetry Data Modal -->
    <div class="admin-modal" id="telemetry-modal">
        <div class="admin-modal-box">
            <h3 style="margin-bottom: 16px;">Mobile Device Telemetry Data</h3>
            <pre id="telemetry-json" style="background: #0f172a; color: #38bdf8; padding: 16px; border-radius: 8px; font-size: 0.85rem; max-height: 350px; overflow-y: auto; white-space: pre-wrap;"></pre>
            <div style="text-align: right; margin-top: 18px;">
                <button type="button" class="btn-admin" id="btn-close-telemetry">Close</button>
            </div>
        </div>
    </div>

    <script src="../assets/js/admin.js"></script>
</body>
</html>
