import { useState } from 'react'

export default function AttendanceTable({ logs, loading }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  if (loading) {
    return (
      <div className="empty-state">
        <div className="spinner" style={{ width: '28px', height: '28px' }}></div>
        <p>Loading attendance details...</p>
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>No attendance records found for this date.</p>
      </div>
    )
  }

  return (
    <div className="attendance-table-wrap fade-in-up">
      <table className="attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Employee Name</th>
            <th>Employee ID</th>
            <th>Check-in Time</th>
            <th>Verification Method</th>
            <th>GPS Coordinates & Radius</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, index) => {
            const timeFormatted = new Date(log.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })

            return (
              <tr key={log._id || index}>
                <td>{index + 1}</td>
                <td className="employee-name-cell">{log.employeeName}</td>
                <td className="employee-id-cell">{log.employeeId}</td>
                <td className="time-cell">{timeFormatted}</td>
                
                {/* Verification Method */}
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        background: log.verificationMethod === 'selfie' ? 'rgba(67, 97, 238, 0.08)' : 'rgba(6, 214, 160, 0.08)',
                        color: log.verificationMethod === 'selfie' ? 'var(--color-primary)' : 'var(--color-accent)',
                        border: `1px solid ${log.verificationMethod === 'selfie' ? 'rgba(67, 97, 238, 0.2)' : 'rgba(6, 214, 160, 0.2)'}`,
                      }}
                    >
                      {log.verificationMethod === 'selfie' ? '📷 Selfie' : '📲 QR Code'}
                    </span>
                    {log.verificationMethod === 'selfie' && log.photoData && (
                      <button
                        onClick={() => setSelectedPhoto(log.photoData)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          width: '40px',
                          height: '40px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transition: 'transform 0.2s',
                        }}
                        title="Click to view full image"
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <img
                          src={log.photoData}
                          alt="Selfie"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    )}
                  </div>
                </td>

                {/* Location & Distance */}
                <td style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  {log.latitude ? (
                    <div>
                      <div>{log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}</div>
                      {log.distanceMeters !== undefined && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)' }}>
                          ({log.distanceMeters}m from office)
                        </span>
                      )}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </td>

                {/* Status: Present vs Half-Day */}
                <td>
                  {log.status === 'half-day' ? (
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(244, 140, 6, 0.12)',
                        color: '#d97706',
                        border: '1px solid rgba(244, 140, 6, 0.25)',
                      }}
                    >
                      ⏱️ Half-Day
                    </span>
                  ) : log.status === 'rejected' ? (
                    <span className="badge badge-danger">
                      ❌ Rejected
                    </span>
                  ) : (
                    <span className="badge badge-success">
                      ✓ Present (On-Time)
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Lightbox Modal for Selfie Verification */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              border: '2px solid rgba(255,255,255,0.1)',
            }}
          >
            <img
              src={selectedPhoto}
              alt="Verification Selfie"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                display: 'block',
                objectFit: 'contain',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '12px',
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              📷 Live Captures Selfie Verification
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
