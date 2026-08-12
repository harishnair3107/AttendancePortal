<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    header('Location: login.php');
    exit;
}

require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

// Fetch current settings
$stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
$rows = $stmt->fetchAll();
$settings = [];
foreach ($rows as $r) {
    $settings[$r['setting_key']] = $r['setting_value'];
}

$officeLat = $settings['office_lat'] ?? '19.076090';
$officeLng = $settings['office_lng'] ?? '72.877426';
$officeRadius = $settings['office_radius_meters'] ?? '200';
$officeName = $settings['office_name'] ?? 'Main Office HQ';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Office Geolocation Settings - Admin Portal</title>
    <link rel="stylesheet" href="../assets/css/admin.css">
</head>
<body>

    <!-- Sidebar -->
    <aside class="admin-sidebar">
        <div class="sidebar-brand">Attendance Admin</div>
        <ul class="sidebar-menu">
            <li><a href="dashboard.php">📅 Attendance Logs</a></li>
            <li><a href="employees.php">👥 Employee Manager</a></li>
            <li><a href="settings.php" class="active">⚙️ Office Location Settings</a></li>
            <li><a href="../index.php" target="_blank">📱 Mobile Scanner View</a></li>
            <li><a href="logout.php">🚪 Log Out</a></li>
        </ul>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
        <header class="admin-header">
            <h1 class="admin-title">Office Location & Geofence Settings</h1>
        </header>

        <div class="admin-content">
            <div class="card-panel" style="max-width: 650px;">
                <h2 style="margin-bottom: 8px;">Geofence Configuration</h2>
                <p style="color: var(--admin-muted); font-size: 0.85rem; margin-bottom: 24px;">
                    Set the exact GPS coordinates and radius for your office building. Mobile attendance submissions will compare user distance against these coordinates.
                </p>

                <form id="settings-form">
                    <input type="hidden" name="action" value="update_settings">

                    <div class="form-group-admin">
                        <label for="office_name">Office Building / Location Name</label>
                        <input type="text" id="office_name" name="office_name" value="<?= htmlspecialchars($officeName) ?>" required>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group-admin">
                            <label for="office_lat">Office Latitude</label>
                            <input type="text" id="office_lat" name="office_lat" value="<?= htmlspecialchars($officeLat) ?>" required>
                        </div>
                        <div class="form-group-admin">
                            <label for="office_lng">Office Longitude</label>
                            <input type="text" id="office_lng" name="office_lng" value="<?= htmlspecialchars($officeLng) ?>" required>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <button type="button" class="btn-admin" id="btn-detect-loc" style="background-color: var(--admin-muted); padding: 8px 14px; font-size: 0.85rem;">
                            📍 Use My Current Device GPS Location
                        </button>
                    </div>

                    <div class="form-group-admin">
                        <label for="office_radius_meters">Allowed Attendance Radius (Meters)</label>
                        <input type="number" id="office_radius_meters" name="office_radius_meters" value="<?= htmlspecialchars($officeRadius) ?>" min="10" max="10000" required>
                        <span style="font-size: 0.78rem; color: var(--admin-muted);">Default radius requirement is <b>200 meters</b>.</span>
                    </div>

                    <div style="margin-top: 28px;">
                        <button type="submit" class="btn-admin btn-success" style="padding: 14px 28px; font-size: 1rem;">
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </main>

    <script src="../assets/js/admin.js"></script>
</body>
</html>
