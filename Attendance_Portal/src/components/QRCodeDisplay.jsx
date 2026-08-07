import { QRCodeSVG } from 'qrcode.react'

export default function QRCodeDisplay({ value, employeeName, employeeId, onRegenerate, loading }) {
  if (loading) {
    return (
      <div className="qr-display-wrap">
        <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Generating QR Pass...</p>
      </div>
    )
  }

  if (!value) return null

  return (
    <div className="qr-display-wrap fade-in-up" style={{ textAlign: 'center', padding: '16px' }}>
      <div
        className="qr-canvas-wrap"
        style={{
          background: '#ffffff',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          display: 'inline-block',
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
        }}
      >
        <QRCodeSVG
          value={value}
          size={180}
          bgColor="#ffffff"
          fgColor="#0b0f1a"
          level="H"
          includeMargin={true}
        />
        {(employeeName || employeeId) && (
          <div style={{ marginTop: '8px', color: '#0b0f1a', fontWeight: 800, fontSize: '0.85rem' }}>
            {employeeName} {employeeId ? `(${employeeId})` : ''}
          </div>
        )}
      </div>

      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>
        📱 Hold this QR pass in front of the laptop camera scanner
      </div>

      {onRegenerate && (
        <button onClick={onRegenerate} className="btn btn-ghost qr-regenerate-btn" style={{ marginTop: '10px' }}>
          🔄 Refresh QR Pass
        </button>
      )}
    </div>
  )
}
