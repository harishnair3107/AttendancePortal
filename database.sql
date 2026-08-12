-- Database Schema for Attendance Portal

CREATE DATABASE IF NOT EXISTS `harish_attendance` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `harish_attendance`;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default admin: admin / admin123
INSERT INTO `admins` (`username`, `password`) 
VALUES ('admin', '$2y$10$4.aN9X4fXf7p9aG8X7.K1.7m7hL0x3cW/v41b/B1Q7G6K5X5y7W2S')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- 2. Settings Table (Office Geolocation & Config)
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` VARCHAR(50) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default office location (Sample Coords & 200m Radius)
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('office_lat', '19.076090'),
('office_lng', '72.877426'),
('office_radius_meters', '200'),
('office_name', 'Main Office HQ')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- 3. Employees Table
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `emp_code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `department` VARCHAR(100) DEFAULT 'General',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial active employees
INSERT INTO `employees` (`emp_code`, `name`, `email`, `department`, `status`) VALUES
('EMP001', 'Rahul Sharma', 'rahul.sharma@company.com', 'Engineering', 'active'),
('EMP002', 'Priya Nair', 'priya.nair@company.com', 'Human Resources', 'active'),
('EMP003', 'Vikram Patel', 'vikram.patel@company.com', 'Operations', 'active'),
('EMP004', 'Ananya Gupta', 'ananya.gupta@company.com', 'Marketing', 'active'),
('EMP005', 'Rohan Mehta', 'rohan.mehta@company.com', 'Engineering', 'active')
ON DUPLICATE KEY UPDATE `emp_code`=`emp_code`;

-- 4. Attendance Table
CREATE TABLE IF NOT EXISTS `attendance` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
