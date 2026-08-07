import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import QRCodeDisplay from '../components/QRCodeDisplay'
import SelfieAttendance from '../components/SelfieAttendance'
import LaptopQRScanner from '../components/LaptopQRScanner'
import EmployeeSlidingBar from '../components/EmployeeSlidingBar'
import { apiFetchJson } from '../utils/api'
import '../styles/employeeDashboard.css'

export default function EmployeeDashboard() {
  const [user] = useState(() => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })

  // Mode: 'selfie' | 'qr'
  const [attendanceMode, setAttendanceMode] = useState('selfie')

  // QR Mode states
  const [showQR, setShowQR] = useState(false)
  const [scanUrl, setScanUrl] = useState('')
  const [loadingQR, setLoadingQR] = useState(false)
  const [qrError, setQrError] = useState('')
  const [isSlidingBarOpen, setIsSlidingBarOpen] = useState(false)

  // Today status tracking
  const [todayLog, setTodayLog] = useState(null)
  const [alreadyMarked, setAlreadyMarked] = useState(false)

  const checkTodayStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const data = await apiFetchJson('/api/attendance/my-today-status', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (data.marked && data.log) {
        setAlreadyMarked(true)
        setTodayLog(data.log)
      } else {
        setAlreadyMarked(false)
        setTodayLog(null)
      }
    } catch (err) {
      console.error('Error checking today status:', err)
    }
  }, [])

  useEffect(() => {
    checkTodayStatus()
  }, [checkTodayStatus])

  const fetchScanToken = useCallback(async () => {
    setLoadingQR(true)
    setQrError('')

    try {
      const token = localStorage.getItem('token')

      const data = await apiFetchJson('/api/attendance/generate-token', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })

      setScanUrl(data.scanUrl)
      setShowQR(true)
    } catch (err) {
      setQrError(err.message)
    } finally {
      setLoadingQR(false)
    }
  }, [])

  // Auto-generate QR token whenever employee switches to QR mode
  useEffect(() => {
    if (attendanceMode === 'qr' && !alreadyMarked) {
      fetchScanToken()
    }
  }, [attendanceMode, alreadyMarked, fetchScanToken])

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="emp-dashboard">
      <Navbar
        title="Employee Portal"
        role="employee"
        userName={user?.name}
        onOpenSlidingBar={() => setIsSlidingBarOpen(true)}
      />

      <main className="emp-main">
        {/* Welcome Banner */}
        <section className="emp-welcome">
          <div className="emp-welcome-text">
            <h2>Welcome back, <span>{user?.name || 'Employee'}</span> 👋</h2>
            <p>Mark your daily attendance using Selfie Camera or QR Code (10:30 AM cutoff for On-Time)</p>
          </div>
          <div className="emp-welcome-meta">
            <span className="emp-id-badge">ID: {user?.employeeId || 'N/A'}</span>
            <span className="emp-date-time">📅 {currentDate}</span>
            <button
              onClick={() => setIsSlidingBarOpen(true)}
              className="btn btn-ghost"
              style={{ padding: '6px 12px', fontSize: '0.78rem', marginTop: '6px' }}
            >
              ⚙️ Account Options & Rules
            </button>
          </div>
        </section>

        {/* Attendance Marking Section or Locked Card */}
        {alreadyMarked && todayLog ? (
          <section className="emp-section fade-in-up" style={{ textAlign: 'center', padding: '28px' }}>
            <div style={{ fontSize: '52px', marginBottom: '10px' }}>
              {todayLog.status === 'present' ? '🎉' : todayLog.status === 'half-day' ? '⏱️' : '🚫'}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
              Attendance Already Marked for Today
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '18px' }}>
              You have completed your daily check-in verification for today.
            </p>

            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                gap: '10px',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px 24px',
                textAlign: 'left',
                minWidth: '280px',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Status:</span>
                {todayLog.status === 'present' ? (
                  <span className="badge badge-success">✓ Present (On-Time)</span>
                ) : todayLog.status === 'half-day' ? (
                  <span className="badge" style={{ background: 'rgba(244, 140, 6, 0.12)', color: '#d97706', border: '1px solid rgba(244, 140, 6, 0.25)' }}>
                    ⏱️ Half-Day
                  </span>
                ) : (
                  <span className="badge badge-danger">🚫 Rejected (After 7 PM)</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Check-in Time:</span>
                <strong style={{ fontFamily: 'monospace' }}>
                  {new Date(todayLog.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Verification Method:</span>
                <strong style={{ textTransform: 'uppercase' }}>{todayLog.verificationMethod || 'selfie'}</strong>
              </div>

              {todayLog.distanceMeters !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Office Distance:</span>
                  <span>{todayLog.distanceMeters}m</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
              🔒 Action Locked: Only 1 attendance check-in is allowed per day. Resets tomorrow!
            </div>
          </section>
        ) : (
          <section className="emp-section qr-section">
            <div className="emp-section-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="section-icon">📍</div>
                <div>
                  <h3>Mark Daily Attendance</h3>
                  <p style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>
                    Location verified within 500m office radius. 10:30 AM cutoff for On-Time, 7:00 PM cutoff for Rejection.
                  </p>
                </div>
              </div>

              {/* Switch Mode Tabs */}
              <div style={{ display: 'flex', background: 'var(--color-surface-2)', padding: '4px', borderRadius: 'var(--radius-md)', gap: '4px' }}>
                <button
                  className={`btn ${attendanceMode === 'selfie' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setAttendanceMode('selfie')}
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  📷 Selfie Camera
                </button>
                <button
                  className={`btn ${attendanceMode === 'qr' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setAttendanceMode('qr')}
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  📲 QR Code
                </button>
              </div>
            </div>

            <div className="qr-content" style={{ marginTop: '10px' }}>
              {/* MODE 1: SELFIE CAMERA */}
              {attendanceMode === 'selfie' && (
                <SelfieAttendance onAttendanceMarked={checkTodayStatus} />
              )}

              {/* MODE 2: QR — Laptop webcam scanner + personal QR pass */}
              {attendanceMode === 'qr' && (
                <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%' }}>

                  {/* Laptop Camera Scanner */}
                  <div style={{ width: '100%' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: '10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      📷 Scan an Employee QR Pass
                    </p>
                    <LaptopQRScanner onAttendanceMarked={checkTodayStatus} />
                  </div>

                  {/* Divider */}
                  <div style={{ width: '100%', maxWidth: '420px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                    <span>or show your QR pass to a kiosk</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                  </div>

                  {/* Personal QR Pass */}
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      🪪 My Personal QR Pass
                    </p>
                    {qrError && <div className="alert alert-error">⚠️ {qrError}</div>}
                    <QRCodeDisplay
                      value={scanUrl}
                      employeeName={user?.name}
                      employeeId={user?.employeeId}
                      loading={loadingQR}
                      onRegenerate={fetchScanToken}
                    />
                  </div>

                </div>
              )}
            </div>
          </section>
        )}

        {/* Quick Access Info Grid */}
        <div className="emp-grid">
          {/* Quick Rules Summary */}
          <section className="emp-section">
            <div className="emp-section-title" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="section-icon">⏱️</div>
                <h3>Shift Timing & Policy</h3>
              </div>
              <button
                onClick={() => setIsSlidingBarOpen(true)}
                className="btn btn-ghost"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                View Rules 📜
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-success">✓ Before 10:30 AM</span>
                <span style={{ fontSize: '0.82rem' }}>Marked as <strong>Present / On-Time</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{ background: 'rgba(244, 140, 6, 0.12)', color: '#d97706', border: '1px solid rgba(244, 140, 6, 0.25)' }}>
                  ⏱️ After 10:30 AM
                </span>
                <span style={{ fontSize: '0.82rem' }}>Marked as <strong>Half-Day</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-danger">🚫 After 7:00 PM</span>
                <span style={{ fontSize: '0.82rem' }}>Attendance <strong>Rejected</strong> (Closed after 7 PM)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge badge-danger">📍 Beyond 500m</span>
                <span style={{ fontSize: '0.82rem' }}>Attendance <strong>Rejected</strong> (Outside Radius)</span>
              </div>
            </div>
          </section>

          {/* Account Security */}
          <section className="emp-section">
            <div className="emp-section-title" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="section-icon">🔐</div>
                <h3>Account Security</h3>
              </div>
              <button
                onClick={() => setIsSlidingBarOpen(true)}
                className="btn btn-ghost"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Options ⚙️
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Change your password or view full policy guidelines inside the sliding options drawer.
            </p>
          </section>
        </div>
      </main>

      {/* Employee Sliding Bar Drawer */}
      <EmployeeSlidingBar
        isOpen={isSlidingBarOpen}
        onClose={() => setIsSlidingBarOpen(false)}
      />
    </div>
  )
}
