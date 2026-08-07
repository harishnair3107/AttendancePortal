import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import AdminSlidingBar from '../components/AdminSlidingBar'
import AttendanceTable from '../components/AttendanceTable'
import LaptopQRScanner from '../components/LaptopQRScanner'
import { apiFetch } from '../utils/api'
import '../styles/adminDashboard.css'

export default function AdminDashboard() {
  const todayStr = (() => {
    try {
      return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  })();
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [attendanceLogs, setAttendanceLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logError, setLogError] = useState('')
  const [employeeCount, setEmployeeCount] = useState(0)
  const [isSlidingBarOpen, setIsSlidingBarOpen] = useState(false)

  // Fetch attendance records when selected date changes
  const fetchAttendance = useCallback(async (date) => {
    setLoadingLogs(true)
    setLogError('')

    try {
      const token = localStorage.getItem('token')

      const path =
        date === todayStr
          ? '/api/attendance/today'
          : `/api/attendance/by-date?date=${date}`

      const res = await apiFetch(path, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch attendance logs')
      }

      setAttendanceLogs(data.logs || [])
    } catch (err) {
      setLogError(err.message)
    } finally {
      setLoadingLogs(false)
    }
  }, [todayStr])

  // Fetch total employee count for stats
  const fetchEmployees = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')

      const res = await apiFetch('/api/employees/list', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()
      if (res.ok) {
        setEmployeeCount(data.count || 0)
      }
    } catch (err) {
      console.error('Error fetching employees:', err)
    }
  }, [])

  useEffect(() => {
    fetchAttendance(selectedDate)
    fetchEmployees()
  }, [selectedDate, fetchAttendance, fetchEmployees])

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  const handleSetToday = () => {
    setSelectedDate(todayStr)
  }

  const isToday = selectedDate === todayStr

  return (
    <div className="admin-dashboard">
      <Navbar
        title="Admin Control Center"
        role="admin"
        userName="harishnair3107@gmail.com"
        onOpenSlidingBar={() => setIsSlidingBarOpen(true)}
      />

      <main className="admin-main">
        {/* Welcome Banner */}
        <section className="admin-welcome">
          <div>
            <h2>Admin Dashboard <span>Control Panel</span> 🛡️</h2>
            <p>Manage employees and monitor real-time location-verified attendance</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsSlidingBarOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              ⚡ Manage Employees (Add / Update / Remove)
            </button>

            <span className="admin-badge-pill">
              Admin: harishnair3107@gmail.com
            </span>
          </div>
        </section>

        {/* Kiosk QR Scanner — always visible at the top for quick access */}
        <section className="admin-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>📷 Laptop Desk QR Scanner</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              Hold up an employee QR pass to the laptop webcam below to mark attendance
            </p>
          </div>
          <LaptopQRScanner onAttendanceMarked={() => fetchAttendance(selectedDate)} />
        </section>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-chip">
            <span className="stat-value">{employeeCount}</span>
            <span className="stat-label">Total Employees</span>
          </div>

          <div className="stat-chip">
            <span className="stat-value" style={{ color: 'var(--color-accent)' }}>
              {attendanceLogs.length}
            </span>
            <span className="stat-label">
              {isToday ? "Today's Logins" : `Logins on ${selectedDate}`}
            </span>
          </div>
        </div>

        {/* Attendance Logs Panel (Full width display with quick action side panel) */}
        <section className="admin-section">
          <div className="admin-section-title" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="section-icon">📅</div>
              <h3>{isToday ? "Today's Employee Logins" : `Employee Logins for ${selectedDate}`}</h3>
            </div>

            {/* Date Selector */}
            <div className="date-controls">
              <label>Date:</label>
              <input
                type="date"
                className="date-input"
                value={selectedDate}
                onChange={handleDateChange}
                max={todayStr}
              />

              {!isToday && (
                <button onClick={handleSetToday} className="btn btn-ghost today-btn">
                  Today
                </button>
              )}
            </div>
          </div>

          {logError && <div className="alert alert-error">⚠️ {logError}</div>}

          {/* Table */}
          <AttendanceTable logs={attendanceLogs} loading={loadingLogs} />
        </section>
      </main>

      {/* Admin Sliding Bar Drawer */}
      <AdminSlidingBar
        isOpen={isSlidingBarOpen}
        onClose={() => setIsSlidingBarOpen(false)}
        onEmployeeChange={fetchEmployees}
      />
    </div>
  )
}
