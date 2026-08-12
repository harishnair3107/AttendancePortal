document.addEventListener('DOMContentLoaded', () => {

    // 1. Telemetry Modal Handler
    const telemetryModal = document.getElementById('telemetry-modal');
    const telemetryJson = document.getElementById('telemetry-json');
    const btnCloseTelemetry = document.getElementById('btn-close-telemetry');

    document.querySelectorAll('.btn-telemetry').forEach(btn => {
        btn.addEventListener('click', () => {
            const rawJson = btn.getAttribute('data-info');
            try {
                const parsed = JSON.parse(rawJson);
                telemetryJson.textContent = JSON.stringify(parsed, null, 2);
            } catch (e) {
                telemetryJson.textContent = rawJson || 'No telemetry data recorded.';
            }
            telemetryModal.classList.add('active');
        });
    });

    if (btnCloseTelemetry) {
        btnCloseTelemetry.addEventListener('click', () => {
            telemetryModal.classList.remove('active');
        });
    }

    // 2. CSV Export Handler
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', exportTableToCSV);
    }

    function exportTableToCSV() {
        const table = document.getElementById('attendance-table');
        if (!table) return;

        let csv = [];
        const rows = table.querySelectorAll('tr');

        for (let i = 0; i < rows.length; i++) {
            const row = [], cols = rows[i].querySelectorAll('td, th');

            for (let j = 0; j < cols.length - 1; j++) { // Skip actions/telemetry col
                let text = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, ' ').trim();
                text = text.replace(/"/g, '""');
                row.push('"' + text + '"');
            }
            csv.push(row.join(','));
        }

        const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
        const downloadLink = document.createElement('a');
        downloadLink.download = `attendance_log_${new Date().toISOString().split('T')[0]}.csv`;
        downloadLink.href = window.URL.createObjectURL(csvFile);
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    // 3. Employee Modal & CRUD Handlers
    const empModal = document.getElementById('emp-modal');
    const btnOpenAddEmp = document.getElementById('btn-open-add-emp');
    const btnCloseEmpModal = document.getElementById('btn-close-emp-modal');
    const empForm = document.getElementById('emp-form');

    if (btnOpenAddEmp) {
        btnOpenAddEmp.addEventListener('click', () => {
            document.getElementById('modal-emp-title').textContent = 'Add New Employee';
            document.getElementById('emp-action').value = 'add_employee';
            document.getElementById('emp-id').value = '';
            document.getElementById('emp-code').value = '';
            document.getElementById('emp-name').value = '';
            document.getElementById('emp-email').value = '';
            document.getElementById('emp-dept').value = 'General';
            document.getElementById('emp-status').value = 'active';
            empModal.classList.add('active');
        });
    }

    if (btnCloseEmpModal) {
        btnCloseEmpModal.addEventListener('click', () => {
            empModal.classList.remove('active');
        });
    }

    // Edit employee
    document.querySelectorAll('.btn-edit-emp').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('modal-emp-title').textContent = 'Edit Employee Details';
            document.getElementById('emp-action').value = 'update_employee';
            document.getElementById('emp-id').value = btn.getAttribute('data-id');
            document.getElementById('emp-code').value = btn.getAttribute('data-code');
            document.getElementById('emp-name').value = btn.getAttribute('data-name');
            document.getElementById('emp-email').value = btn.getAttribute('data-email');
            document.getElementById('emp-dept').value = btn.getAttribute('data-dept');
            document.getElementById('emp-status').value = btn.getAttribute('data-status');
            empModal.classList.add('active');
        });
    });

    // Delete employee
    document.querySelectorAll('.btn-delete-emp').forEach(btn => {
        btn.addEventListener('click', () => {
            const empId = btn.getAttribute('data-id');
            const empName = btn.getAttribute('data-name');

            if (confirm(`Are you sure you want to delete employee '${empName}'?`)) {
                fetch('../api/admin_actions.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete_employee', id: empId })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert(data.message);
                        window.location.reload();
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(err => alert('Failed to delete employee.'));
            }
        });
    });

    // Submit employee form
    if (empForm) {
        empForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(empForm);
            const payload = {};
            formData.forEach((val, key) => payload[key] = val);

            fetch('../api/admin_actions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    window.location.reload();
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(err => alert('Failed to save employee.'));
        });
    }

    // 4. Settings Form & GPS Autofill
    const settingsForm = document.getElementById('settings-form');
    const btnDetectLoc = document.getElementById('btn-detect-loc');

    if (btnDetectLoc) {
        btnDetectLoc.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by your browser.');
                return;
            }

            btnDetectLoc.textContent = 'Detecting GPS...';
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    document.getElementById('office_lat').value = pos.coords.latitude.toFixed(6);
                    document.getElementById('office_lng').value = pos.coords.longitude.toFixed(6);
                    btnDetectLoc.textContent = '📍 Use My Current Device GPS Location';
                    alert('Office location updated to your current device GPS coordinates!');
                },
                (err) => {
                    btnDetectLoc.textContent = '📍 Use My Current Device GPS Location';
                    alert('Could not acquire GPS position: ' + err.message);
                },
                { enableHighAccuracy: true }
            );
        });
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(settingsForm);
            const payload = {};
            formData.forEach((val, key) => payload[key] = val);

            fetch('../api/admin_actions.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    window.location.reload();
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(err => alert('Failed to update settings.'));
        });
    }
});
