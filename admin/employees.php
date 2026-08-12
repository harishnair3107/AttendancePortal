<?php
session_start();
if (empty($_SESSION['admin_logged_in'])) {
    header('Location: login.php');
    exit;
}

require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();

// Fetch employees
$employees = $pdo->query("SELECT * FROM employees ORDER BY id DESC")->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Employee Management - Admin Portal</title>
    <link rel="stylesheet" href="../assets/css/admin.css">
</head>
<body>

    <!-- Sidebar -->
    <aside class="admin-sidebar">
        <div class="sidebar-brand">Attendance Admin</div>
        <ul class="sidebar-menu">
            <li><a href="dashboard.php">📅 Attendance Logs</a></li>
            <li><a href="employees.php" class="active">👥 Employee Manager</a></li>
            <li><a href="settings.php">⚙️ Office Location Settings</a></li>
            <li><a href="../index.php" target="_blank">📱 Mobile Scanner View</a></li>
            <li><a href="logout.php">🚪 Log Out</a></li>
        </ul>
    </aside>

    <!-- Main Content -->
    <main class="admin-main">
        <header class="admin-header">
            <h1 class="admin-title">Employee Management</h1>
            <button type="button" class="btn-admin btn-success" id="btn-open-add-emp">+ Add New Employee</button>
        </header>

        <div class="admin-content">
            <div class="card-panel">
                <div class="panel-header">
                    <h2>All Registered Employees</h2>
                    <p style="font-size: 0.85rem; color: var(--admin-muted);">Employees created here will instantly appear in the mobile scanner dropdown.</p>
                </div>

                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Emp Code</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($employees)): ?>
                            <tr>
                                <td colspan="8" style="text-align: center; color: var(--admin-muted); padding: 20px;">
                                    No employees found. Click "+ Add New Employee" to create one.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($employees as $emp): ?>
                                <tr>
                                    <td>#<?= $emp['id'] ?></td>
                                    <td><b><?= htmlspecialchars($emp['emp_code']) ?></b></td>
                                    <td><?= htmlspecialchars($emp['name']) ?></td>
                                    <td><?= htmlspecialchars($emp['email'] ?: 'N/A') ?></td>
                                    <td><?= htmlspecialchars($emp['department']) ?></td>
                                    <td>
                                        <?php if ($emp['status'] === 'active'): ?>
                                            <span class="badge badge-success">Active</span>
                                        <?php else: ?>
                                            <span class="badge badge-danger">Inactive</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><?= htmlspecialchars($emp['created_at']) ?></td>
                                    <td>
                                        <button type="button" class="btn-admin btn-edit-emp" 
                                                data-id="<?= $emp['id'] ?>"
                                                data-code="<?= htmlspecialchars($emp['emp_code']) ?>"
                                                data-name="<?= htmlspecialchars($emp['name']) ?>"
                                                data-email="<?= htmlspecialchars($emp['email']) ?>"
                                                data-dept="<?= htmlspecialchars($emp['department']) ?>"
                                                data-status="<?= $emp['status'] ?>"
                                                style="padding: 4px 10px; font-size: 0.78rem;">
                                            Edit
                                        </button>
                                        <button type="button" class="btn-admin btn-danger btn-delete-emp" data-id="<?= $emp['id'] ?>" data-name="<?= htmlspecialchars($emp['name']) ?>" style="padding: 4px 10px; font-size: 0.78rem;">
                                            Delete
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

    <!-- Add/Edit Employee Modal -->
    <div class="admin-modal" id="emp-modal">
        <div class="admin-modal-box">
            <h3 id="modal-emp-title" style="margin-bottom: 18px;">Add New Employee</h3>
            
            <form id="emp-form">
                <input type="hidden" id="emp-id" name="id" value="">
                <input type="hidden" id="emp-action" name="action" value="add_employee">

                <div class="form-group-admin">
                    <label for="emp-code">Employee Code / ID</label>
                    <input type="text" id="emp-code" name="emp_code" placeholder="e.g. EMP006" required>
                </div>

                <div class="form-group-admin">
                    <label for="emp-name">Full Name</label>
                    <input type="text" id="emp-name" name="name" placeholder="e.g. Sarah Jenkins" required>
                </div>

                <div class="form-group-admin">
                    <label for="emp-email">Email Address</label>
                    <input type="email" id="emp-email" name="email" placeholder="sarah@company.com">
                </div>

                <div class="form-group-admin">
                    <label for="emp-dept">Department</label>
                    <input type="text" id="emp-dept" name="department" placeholder="e.g. Engineering" value="General">
                </div>

                <div class="form-group-admin">
                    <label for="emp-status">Status</label>
                    <select id="emp-status" name="status" class="form-control" style="width: 100%;">
                        <option value="active">Active (Appears in dropdown)</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px;">
                    <button type="button" class="btn-admin" id="btn-close-emp-modal" style="background: var(--admin-muted);">Cancel</button>
                    <button type="submit" class="btn-admin btn-success">Save Employee</button>
                </div>
            </form>
        </div>
    </div>

    <script src="../assets/js/admin.js"></script>
</body>
</html>
