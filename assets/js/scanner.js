document.addEventListener('DOMContentLoaded', () => {
    let html5QrCode = null;
    let lastScannedQrData = '';
    let userLocation = { lat: null, lng: null, accuracy: null };
    let officeLocation = { lat: 19.076090, lng: 72.877426, radius: 200 };
    let employeeData = [];

    // DOM Elements
    const btnScanQr = document.getElementById('btn-scan-qr');
    const scannerModal = document.getElementById('scanner-modal');
    const btnCloseScanner = document.getElementById('btn-close-scanner');
    const employeeModal = document.getElementById('employee-modal');
    const btnCloseEmployee = document.getElementById('btn-close-employee');
    const employeeSelect = document.getElementById('employee-select');
    const scannedQrDisplay = document.getElementById('scanned-qr-display');
    const attendanceForm = document.getElementById('attendance-form');
    const locationStatusText = document.getElementById('location-status-text');
    const locationSubtext = document.getElementById('location-subtext');
    const resultCard = document.getElementById('result-card');
    const appMain = document.getElementById('app-main');
    const btnResetScan = document.getElementById('btn-reset-scan');

    // 1. Fetch Employees & Office Settings
    loadInitialData();

    // 2. Request User Location Telemetry
    initGeolocation();

    // Event Listeners
    btnScanQr.addEventListener('click', openScannerModal);
    btnCloseScanner.addEventListener('click', closeScannerModal);
    btnCloseEmployee.addEventListener('click', closeEmployeeModal);
    attendanceForm.addEventListener('submit', handleAttendanceSubmit);
    if (btnResetScan) {
        btnResetScan.addEventListener('click', resetToScanPage);
    }

    function loadInitialData() {
        fetch('api/get_employees.php')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    employeeData = data.employees;
                    if (data.office) {
                        officeLocation = data.office;
                    }
                    populateEmployeeDropdown();
                    updateLocationBadge();
                } else {
                    console.error('Failed to load employee list:', data.message);
                }
            })
            .catch(err => console.error('Error fetching employee list:', err));
    }

    function populateEmployeeDropdown() {
        employeeSelect.innerHTML = '<option value="">-- Select Employee Name --</option>';
        employeeData.forEach(emp => {
            const opt = document.createElement('option');
            opt.value = emp.id;
            opt.textContent = `${emp.name} (${emp.emp_code} - ${emp.department})`;
            employeeSelect.appendChild(opt);
        });
    }

    function initGeolocation() {
        if (!navigator.geolocation) {
            locationStatusText.textContent = 'Geolocation not supported';
            locationStatusText.className = 'location-status-text out-range';
            return;
        }

        locationStatusText.textContent = 'Acquiring GPS location...';

        navigator.geolocation.watchPosition(
            (pos) => {
                userLocation.lat = pos.coords.latitude;
                userLocation.lng = pos.coords.longitude;
                userLocation.accuracy = pos.coords.accuracy;
                updateLocationBadge();
            },
            (err) => {
                console.warn('Geolocation error:', err.message);
                locationStatusText.textContent = 'GPS Permission Required';
                locationStatusText.className = 'location-status-text out-range';
                locationSubtext.textContent = 'Please enable location permissions on your phone.';
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    function updateLocationBadge() {
        if (!userLocation.lat || !userLocation.lng) return;

        const distance = calculateHaversineDistance(
            userLocation.lat, userLocation.lng,
            officeLocation.lat, officeLocation.lng
        );

        const roundedDistance = Math.round(distance);

        if (roundedDistance <= officeLocation.radius_meters) {
            locationStatusText.textContent = `In Office (${roundedDistance}m away)`;
            locationStatusText.className = 'location-status-text in-range';
            locationSubtext.textContent = `Verified within ${officeLocation.radius_meters}m office radius limit.`;
        } else {
            locationStatusText.textContent = `Out of Office (${roundedDistance}m away)`;
            locationStatusText.className = 'location-status-text out-range';
            locationSubtext.textContent = `Office radius limit: ${officeLocation.radius_meters}m`;
        }
    }

    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Radius of Earth in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // 3. Open QR Camera Scanner Modal
    function openScannerModal() {
        scannerModal.classList.add('active');
        startCameraScanner();
    }

    function closeScannerModal() {
        scannerModal.classList.remove('active');
        stopCameraScanner();
    }

    function startCameraScanner() {
        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode("qr-reader");
        }

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start({ facingMode: "environment" }, config, onQrCodeSuccess, onQrCodeError)
            .catch(err => {
                console.warn("Camera start failed, falling back to front camera or file input", err);
                html5QrCode.start({ facingMode: "user" }, config, onQrCodeSuccess, onQrCodeError)
                    .catch(e => {
                        alert("Camera access denied or unreadable. Please check camera permissions.");
                    });
            });
    }

    function stopCameraScanner() {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                console.log("Scanner stopped.");
            }).catch(err => console.error("Error stopping scanner", err));
        }
    }

    function onQrCodeSuccess(decodedText, decodedResult) {
        console.log("QR Code Scanned:", decodedText);
        lastScannedQrData = decodedText;

        // Vibrate mobile device if supported
        if (navigator.vibrate) {
            navigator.vibrate(150);
        }

        // Close camera scanner and open employee dropdown modal
        closeScannerModal();
        openEmployeeModal(decodedText);
    }

    function onQrCodeError(errorMessage) {
        // Scanning in progress... ignore frame scan noise
    }

    // 4. Open Employee Dropdown Modal
    function openEmployeeModal(qrPayload) {
        scannedQrDisplay.textContent = `QR Code: ${qrPayload.substring(0, 40)}${qrPayload.length > 40 ? '...' : ''}`;
        employeeModal.classList.add('active');
    }

    function closeEmployeeModal() {
        employeeModal.classList.remove('active');
    }

    // 5. Gather Mobile Device Telemetry Data
    async function getMobileTelemetry() {
        const telemetry = {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            screen: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            timezone_offset: new Date().getTimezoneOffset(),
            online_status: navigator.onLine ? 'Online' : 'Offline'
        };

        if (navigator.connection) {
            telemetry.connection_type = navigator.connection.effectiveType || navigator.connection.type || 'Unknown';
        }

        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                telemetry.battery_level = Math.round(battery.level * 100) + '%';
                telemetry.battery_charging = battery.charging;
            } catch (e) {}
        }

        return telemetry;
    }

    // 6. Handle Attendance Form Submission
    async function handleAttendanceSubmit(e) {
        e.preventDefault();

        const selectedEmpId = employeeSelect.value;
        const statusType = document.getElementById('status-select').value;

        if (!selectedEmpId) {
            alert('Please select your employee name from the dropdown list.');
            return;
        }

        const telemetryData = await getMobileTelemetry();

        const payload = {
            employee_id: selectedEmpId,
            status: statusType,
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            accuracy: userLocation.accuracy,
            qr_data: lastScannedQrData,
            device_info: telemetryData
        };

        const submitBtn = attendanceForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        fetch('api/submit_attendance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Attendance';

            if (data.success) {
                closeEmployeeModal();
                showSuccessCard(data);
            } else {
                alert('Submission failed: ' + data.message);
            }
        })
        .catch(err => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Attendance';
            alert('Server error while submitting attendance.');
            console.error(err);
        });
    }

    // 7. Show Success Summary View
    function showSuccessCard(data) {
        appMain.style.display = 'none';
        
        document.getElementById('res-emp-name').textContent = data.employee_name;
        document.getElementById('res-date-time').textContent = `${data.date} at ${data.time}`;
        document.getElementById('res-status').textContent = data.status;
        
        const locBadge = document.getElementById('res-location-badge');
        if (data.is_within_radius) {
            locBadge.textContent = `✅ ${data.location_status}`;
            locBadge.style.color = '#10b981';
        } else {
            locBadge.textContent = `⚠️ ${data.location_status}`;
            locBadge.style.color = '#ef4444';
        }

        resultCard.style.display = 'block';
    }

    function resetToScanPage() {
        resultCard.style.display = 'none';
        appMain.style.display = 'block';
        employeeSelect.value = '';
        lastScannedQrData = '';
    }
});
