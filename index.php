<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Mobile QR Attendance Portal</title>
    <meta name="description" content="Quick & Secure Mobile QR Attendance Scanner with Geolocation Verification">
    <link rel="stylesheet" href="assets/css/mobile.css">
</head>
<body>

    <header class="mobile-header">
        <h1>Attendance Portal</h1>
        <p>Scan QR code to mark your attendance</p>
    </header>

    <main class="app-container" id="app-main">
        <!-- Location Status Card -->
        <div class="location-badge">
            <div class="location-icon">📍</div>
            <div class="location-info">
                <div class="location-status-text" id="location-status-text">Detecting Location...</div>
                <div class="location-subtext" id="location-subtext">Office Location Radius: 200m</div>
            </div>
        </div>

        <!-- Scan Button -->
        <div class="scan-btn-container">
            <button type="button" class="btn-scan" id="btn-scan-qr">
                <svg viewBox="0 0 24 24">
                    <path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm13 0h3v3h-3v-3zm0 3h-3v3h3v-3zm3 0v3h-3v-3h3zM7 7h0v0H7V7zm10 0h0v0h0V7zM7 17h0v0H7v0z"/>
                </svg>
                Scan QR Code
            </button>
        </div>
    </main>

    <!-- Success Result Card (Hidden by default) -->
    <main class="app-container success-card" id="result-card" style="display: none;">
        <div class="success-icon">✓</div>
        <h2 class="success-title">Attendance Recorded!</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Your attendance log has been successfully saved.</p>

        <div class="detail-list">
            <div class="detail-row">
                <span class="detail-label">Employee Name</span>
                <span class="detail-value" id="res-emp-name">-</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value" id="res-date-time">-</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Attendance Status</span>
                <span class="detail-value" id="res-status">-</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Office Radius Check</span>
                <span class="detail-value" id="res-location-badge">-</span>
            </div>
        </div>

        <button type="button" class="btn-submit" id="btn-reset-scan" style="margin-top: 10px;">
            Scan Another QR Code
        </button>
    </main>

    <!-- 1. Scanner Viewfinder Modal -->
    <div class="modal-overlay" id="scanner-modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">Scan Any QR Code</div>
                <button type="button" class="btn-close" id="btn-close-scanner">&times;</button>
            </div>
            <div id="qr-reader"></div>
            <p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 12px;">
                Point your mobile camera at any QR Code
            </p>
        </div>
    </div>

    <!-- 2. Employee Selection Dropdown Modal -->
    <div class="modal-overlay" id="employee-modal">
        <div class="modal-content">
            <div class="modal-header">
                <div class="modal-title">Select Employee</div>
                <button type="button" class="btn-close" id="btn-close-employee">&times;</button>
            </div>

            <div class="scanned-info" id="scanned-qr-display">
                QR Code Scanned Successfully!
            </div>

            <form id="attendance-form">
                <div class="form-group">
                    <label class="form-label" for="employee-select">Employee Name</label>
                    <select class="form-select" id="employee-select" required>
                        <option value="">Loading employee names...</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="status-select">Attendance Action</label>
                    <select class="form-select" id="status-select" required>
                        <option value="Check In">Check In</option>
                        <option value="Check Out">Check Out</option>
                        <option value="Present" selected>Present</option>
                    </select>
                </div>

                <button type="submit" class="btn-submit">Submit Attendance</button>
            </form>
        </div>
    </div>

    <footer class="mobile-footer">
        <p>Admin Portal: <a href="admin/login.php">Admin Login</a></p>
    </footer>

    <!-- Libraries & Scripts -->
    <script src="assets/js/html5-qrcode.min.js"></script>
    <script src="assets/js/scanner.js"></script>
</body>
</html>
