import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { apiFetch } from '../utils/api'

export default function LaptopQRScanner({ onAttendanceMarked }) {
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState(null) // Scanned text
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [logDetails, setLogDetails] = useState(null)

  const html5QrcodeRef = useRef(null)
  const isProcessingRef = useRef(false)

  // Office Fixed Coordinates
  const OFFICE_LAT = 19.215340
  const OFFICE_LNG = 73.201477

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000
    const toRad = (val) => (val * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  const stopScanner = async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop()
        }
        html5QrcodeRef.current.clear()
      } catch (err) {
        console.error('Error stopping QR scanner:', err)
      }
      html5QrcodeRef.current = null
    }
    setCameraActive(false)
    setScanning(false)
  }

  const startScanner = async () => {
    setError('')
    setSuccess('')
    setScanResult(null)
    setLogDetails(null)
    isProcessingRef.current = false

    try {
      const qrRegionId = 'laptop-qr-reader-viewport'
      
      // Stop existing instance if any
      await stopScanner()

      const html5Qrcode = new Html5Qrcode(qrRegionId)
      html5QrcodeRef.current = html5Qrcode

      setCameraActive(true)

      const config = {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        aspectRatio: 1.0,
      }

      await html5Qrcode.start(
        { facingMode: 'user' },
        config,
        (decodedText) => {
          if (!isProcessingRef.current) {
            isProcessingRef.current = true
            handleQRCodeScanned(decodedText)
          }
        },
        () => {
          // Ignore scanning frame errors
        }
      )

      setScanning(true)
    } catch (err) {
      console.error('Camera QR scanner error:', err)
      setError('Unable to access laptop camera. Please allow camera permissions in your browser.')
      setCameraActive(false)
      setScanning(false)
    }
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  // Process Scanned QR code data
  const handleQRCodeScanned = async (rawScannedText) => {
    setScanResult(rawScannedText)
    await stopScanner()

    setLoading(true)
    setError('')
    setSuccess('')

    // Parse payload from scanned QR
    let token = null
    let employeeId = null

    try {
      if (rawScannedText.includes('token=')) {
        // Formatted scan URL (e.g. http://domain/scan?token=xyz)
        const urlObj = new URL(rawScannedText)
        token = urlObj.searchParams.get('token')
      } else if (rawScannedText.startsWith('{')) {
        // JSON payload (e.g. {"employeeId": "EMP001"})
        const parsed = JSON.parse(rawScannedText)
        employeeId = parsed.employeeId || parsed.token || rawScannedText
        token = parsed.token || null
      } else if (rawScannedText.length >= 32 && !rawScannedText.includes(' ')) {
        // Token hash
        token = rawScannedText
      } else {
        // Plain employee ID string (e.g. EMP001)
        employeeId = rawScannedText.trim()
      }
    } catch (e) {
      employeeId = rawScannedText.trim()
    }

    if (!token && !employeeId) {
      setError('Unrecognized QR code format. Please scan a valid employee QR code.')
      setLoading(false)
      return
    }

    // Obtain Laptop's GPS Location
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords

        try {
          const res = await apiFetch('/api/attendance/mark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: token || undefined,
              employeeId: employeeId || undefined,
              latitude,
              longitude,
            }),
          })

          let data
          try {
            data = await res.json()
          } catch {
            throw new Error(`Server returned status ${res.status}. Please ensure backend is running.`)
          }

          if (!res.ok) {
            throw new Error(data.message || `QR verification failed (status ${res.status})`)
          }

          setSuccess(data.message || '✅ Attendance marked successfully!')
          setLogDetails(data.log)
          if (onAttendanceMarked) onAttendanceMarked(data.log)
        } catch (err) {
          setError(err.message)
        } finally {
          setLoading(false)
        }
      },
      (geoErr) => {
        console.error('GPS error:', geoErr)
        setError('Location verification failed: Please enable Location/GPS access on your device.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      {error && <div className="alert alert-error" style={{ width: '100%' }}>⚠️ {error}</div>}
      {success && <div className="alert alert-success" style={{ width: '100%' }}>✅ {success}</div>}

      {/* Camera Scanner Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          minHeight: '280px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface-2)',
          border: '2px dashed var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          id="laptop-qr-reader-viewport"
          style={{
            width: '100%',
            display: cameraActive ? 'block' : 'none',
          }}
        />

        {!cameraActive && !loading && !logDetails && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>💻 📷</div>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>
              Laptop QR Scanner
            </p>
            <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>
              Hold up an Employee QR Code or Phone Badge to the laptop webcam to scan
            </p>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 14px' }} />
            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Verifying QR Code & GPS Location...</p>
          </div>
        )}

        {/* Live Badge */}
        {scanning && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(6, 214, 160, 0.9)',
              color: '#0b0f1a',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 10,
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0b0f1a' }} />
            SCANNER ACTIVE
          </div>
        )}
      </div>

      {/* Control Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {!cameraActive && !loading && (
          <button onClick={startScanner} className="btn btn-accent" style={{ padding: '12px 24px', fontSize: '0.9rem' }}>
            📷 Start Laptop Camera Scanner
          </button>
        )}

        {cameraActive && (
          <button onClick={stopScanner} className="btn btn-ghost">
            ✕ Stop Scanner
          </button>
        )}

        {logDetails && !cameraActive && (
          <button onClick={startScanner} className="btn btn-primary">
            🔄 Scan Another QR Code
          </button>
        )}
      </div>

      {/* Success / Scanned Log Card */}
      {logDetails && (
        <div
          className="fade-in-up"
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: 'var(--shadow-sm)',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
            <span style={{ fontWeight: 800, color: 'var(--color-text)' }}>
              👤 Employee Verified
            </span>
            <span className="badge badge-success">
              {logDetails.status === 'present' ? '✓ Present (On-Time)' : '⏱️ Half-Day'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Name:</span>
            <strong>{logDetails.employeeName} ({logDetails.employeeId})</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Check-in Time:</span>
            <strong style={{ fontFamily: 'monospace' }}>
              {new Date(logDetails.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Distance from Office:</span>
            <strong style={{ fontFamily: 'monospace' }}>{logDetails.distance} meters</strong>
          </div>
        </div>
      )}
    </div>
  )
}
