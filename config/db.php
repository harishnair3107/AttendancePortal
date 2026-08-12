<?php
// Configuration for MySQL Database
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_USER', getenv('DB_USER') ?: 'harish_attendance');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'harish_attendance');

function getDBConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $isSqlite = false;

    try {
        // Try MySQL first
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 2
        ]);
    } catch (Exception $e) {
        // Fallback to local SQLite if MySQL server is not accessible with default credentials
        $sqlitePath = __DIR__ . '/../attendance.db';
        $pdo = new PDO("sqlite:" . $sqlitePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        $isSqlite = true;
    }

    // Auto-create database tables if they do not exist
    initTables($pdo, $isSqlite);

    return $pdo;
}

function initTables($pdo, $isSqlite) {
    if ($isSqlite) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            setting_key TEXT PRIMARY KEY,
            setting_value TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            emp_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            email TEXT,
            department TEXT DEFAULT 'General',
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            attendance_date TEXT NOT NULL,
            attendance_time TEXT NOT NULL,
            status TEXT DEFAULT 'Present',
            latitude REAL,
            longitude REAL,
            location_accuracy REAL,
            distance_meters REAL,
            is_within_radius INTEGER DEFAULT 0,
            qr_data TEXT,
            device_info TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
        )");
    } else {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `admins` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `username` VARCHAR(50) NOT NULL UNIQUE,
            `password` VARCHAR(255) NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS `settings` (
            `setting_key` VARCHAR(50) PRIMARY KEY,
            `setting_value` TEXT NOT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS `employees` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `emp_code` VARCHAR(20) NOT NULL UNIQUE,
            `name` VARCHAR(100) NOT NULL,
            `email` VARCHAR(100) DEFAULT NULL,
            `department` VARCHAR(100) DEFAULT 'General',
            `status` ENUM('active', 'inactive') DEFAULT 'active',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS `attendance` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `employee_id` INT NOT NULL,
            `attendance_date` DATE NOT NULL,
            `attendance_time` TIME NOT NULL,
            `status` VARCHAR(50) DEFAULT 'Present',
            `latitude` DECIMAL(10,8) DEFAULT NULL,
            `longitude` DECIMAL(11,8) DEFAULT NULL,
            `location_accuracy` FLOAT DEFAULT NULL,
            `distance_meters` FLOAT DEFAULT NULL,
            `is_within_radius` TINYINT(1) DEFAULT 0,
            `qr_data` TEXT DEFAULT NULL,
            `device_info` LONGTEXT DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    }

    // Seed Admin default if empty
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM admins");
    $row = $stmt->fetch();
    if ($row['cnt'] == 0) {
        $hash = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO admins (username, password) VALUES (?, ?)");
        $stmt->execute(['admin', $hash]);
    }

    // Seed Settings default if empty
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM settings");
    $row = $stmt->fetch();
    if ($row['cnt'] == 0) {
        $defaults = [
            'office_lat' => '19.076090',
            'office_lng' => '72.877426',
            'office_radius_meters' => '200',
            'office_name' => 'Main Office HQ'
        ];
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
        foreach ($defaults as $k => $v) {
            $stmt->execute([$k, $v]);
        }
    }

    // Seed Employees default if empty
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM employees");
    $row = $stmt->fetch();
    if ($row['cnt'] == 0) {
        $sampleEmps = [
            ['EMP001', 'Rahul Sharma', 'rahul.sharma@company.com', 'Engineering'],
            ['EMP002', 'Priya Nair', 'priya.nair@company.com', 'Human Resources'],
            ['EMP003', 'Vikram Patel', 'vikram.patel@company.com', 'Operations'],
            ['EMP004', 'Ananya Gupta', 'ananya.gupta@company.com', 'Marketing'],
            ['EMP005', 'Rohan Mehta', 'rohan.mehta@company.com', 'Engineering']
        ];
        $stmt = $pdo->prepare("INSERT INTO employees (emp_code, name, email, department, status) VALUES (?, ?, ?, ?, 'active')");
        foreach ($sampleEmps as $emp) {
            $stmt->execute($emp);
        }
    }
}
