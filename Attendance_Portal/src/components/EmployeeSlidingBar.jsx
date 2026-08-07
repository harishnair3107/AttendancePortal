import { useState } from 'react'
import UpdatePasswordForm from './UpdatePasswordForm'
import '../styles/slidingBar.css'

export default function EmployeeSlidingBar({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('password') // 'password' | 'rules'

  return (
    <>
      {/* Dark Overlay */}
      <div
        className={`sliding-bar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <aside className={`sliding-bar-panel ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sliding-bar-header">
          <h3>👤 Employee Account Panel</h3>
          <button className="close-drawer-btn" onClick={onClose} title="Close Panel">
            ✕
          </button>
        </div>

        {/* 2 Tabs: Update Password, Rules */}
        <div className="sliding-bar-tabs">
          <button
            className={`sliding-tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            🔐 Update Password
          </button>
          <button
            className={`sliding-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            📜 Rules & Policy
          </button>
        </div>

        {/* Body Content based on Active Tab */}
        <div className="sliding-bar-body">
          {/* TAB 1: UPDATE PASSWORD */}
          {activeTab === 'password' && (
            <div className="fade-in-up">
              <h4 style={{ marginBottom: '14px', fontSize: '0.95rem' }}>🔐 Change Account Password</h4>
              <UpdatePasswordForm />
            </div>
          )}

          {/* TAB 2: RULES & POLICIES */}
          {activeTab === 'rules' && (
            <div className="rules-container fade-in-up">
              <h4 style={{ marginBottom: '4px', fontSize: '0.95rem' }}>📜 Attendance Rules & Guidelines</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                Please adhere to the official location-verified attendance guidelines.
              </p>

              <div className="rule-card">
                <div className="rule-icon">🎯</div>
                <div className="rule-content">
                  <h4>Geo-fenced Location Requirement</h4>
                  <p>
                    Attendance can only be marked when you are physically within <strong>500 meters</strong> of the office location (Lat: 19.215340, Lng: 73.201477).
                  </p>
                </div>
              </div>

              <div className="rule-card">
                <div className="rule-icon">📱</div>
                <div className="rule-content">
                  <h4>QR Code Scanning Procedure</h4>
                  <p>
                    1. Click <strong>"Click to Display Attendance QR Code"</strong> on your portal.<br />
                    2. Scan the generated QR code using your mobile phone camera.<br />
                    3. Grant high-accuracy GPS location permissions when prompted.
                  </p>
                </div>
              </div>

              <div className="rule-card">
                <div className="rule-icon">⏱️</div>
                <div className="rule-content">
                  <h4>QR Token Expiry</h4>
                  <p>
                    Each attendance QR code is valid for <strong>5 minutes</strong>. If expired, click the <em>"Refresh QR Code"</em> button to generate a new scan token.
                  </p>
                </div>
              </div>

              <div className="rule-card">
                <div className="rule-icon">🛡️</div>
                <div className="rule-content">
                  <h4>One Login Per Day Rule</h4>
                  <p>
                    Attendance is logged once per calendar day upon successful GPS verification. Subsequent scans on the same day will display your verified check-in time.
                  </p>
                </div>
              </div>

              <div className="rule-card">
                <div className="rule-icon">🔑</div>
                <div className="rule-content">
                  <h4>Security & Account Safety</h4>
                  <p>
                    Do not share your login credentials or QR codes with others. Periodically update your password using the "Update Password" tab.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
