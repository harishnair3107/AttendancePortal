<?php
session_start();
require_once __DIR__ . '/../config/db.php';

// Redirect if already logged in
if (!empty($_SESSION['admin_logged_in'])) {
    header('Location: dashboard.php');
    exit;
}

$errorMsg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!empty($username) && !empty($password)) {
        try {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
            $stmt->execute([$username]);
            $admin = $stmt->fetch();

            if ($admin && password_verify($password, $admin['password'])) {
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_username'] = $admin['username'];
                $_SESSION['admin_id'] = $admin['id'];

                header('Location: dashboard.php');
                exit;
            } else {
                $errorMsg = 'Invalid username or password.';
            }
        } catch (Exception $e) {
            $errorMsg = 'Database error: ' . $e->getMessage();
        }
    } else {
        $errorMsg = 'Please enter both username and password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Login - Attendance Portal</title>
    <link rel="stylesheet" href="../assets/css/admin.css">
</head>
<body class="login-wrapper">

    <div class="login-card">
        <h2>Admin Authentication</h2>
        <p>Sign in to manage employees & view daily attendance logs</p>

        <?php if ($errorMsg): ?>
            <div style="background-color: #fee2e2; color: #991b1b; padding: 12px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 16px; text-align: center;">
                <?= htmlspecialchars($errorMsg) ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="login.php">
            <div class="form-group-admin">
                <label for="username">Admin Username</label>
                <input type="text" id="username" name="username" placeholder="e.g. admin" required autofocus>
            </div>

            <div class="form-group-admin">
                <label for="password">Password</label>
                <input type="password" id="password" name="password" placeholder="••••••••" required>
            </div>

            <button type="submit" class="btn-admin" style="width: 100%; padding: 14px; margin-top: 10px; font-size: 1rem;">
                Log In to Admin Panel
            </button>
        </form>

        <p style="margin-top: 20px; text-align: center; font-size: 0.8rem; color: #64748b;">
            Default Credentials: <b>admin</b> / <b>admin123</b>
        </p>
    </div>

</body>
</html>
