import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '../utils/api'
import '../styles/scanPage.css'

export default function ScanPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('Obtaining your GPS location...')
  const [logDetails, setLogDetails] = useState(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid scan link. No QR token provided.')
      return
    }

    if (!navigator.geolocation) {
      setStatus('error')
      setMessage('Geolocation is not supported by your mobile browser.')
      return
    }

    // Request GPS location from phone
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setStatus('loading')
        setMessage('Verifying your location with office coordinates...')

        try {
          const res = await apiFetch('/api/attendance/mark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, latitude, longitude }),
          })

          // Validate JSON — ngrok HTML pages cause parse errors
          const contentType = res.headers.get('content-type') || ''
          if (!contentType.includes('application/json')) {
            const text = await res.text()
            console.error('Non-JSON response:', text.slice(0, 300))
            throw new Error('Server returned an unexpected response. Check that the backend is reachable.')
          }

          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.message || 'Attendance verification failed')
          }

          setStatus('success')
          setMessage(data.message)
          setLogDetails(data.log)
        } catch (err) {
          setStatus('error')
          setMessage(err.message || 'An unexpected error occurred.')
          console.error('Scan attendance error:', err)
        }
      },
      (geoError) => {
        setStatus('error')
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setMessage('Location permission denied. Please allow location access on your phone to mark attendance.')
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setMessage('Location information unavailable. Please check your phone GPS settings.')
        } else if (geoError.code === geoError.TIMEOUT) {
          setMessage('Location request timed out. Please try scanning again.')
        } else {
          setMessage('Failed to acquire GPS location: ' + geoError.message)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [token])

  return (
    <div className="scan-page">
      <div className="scan-card">
        <div className="scan-header">
          <h1>Location Verification</h1>
          <p>Attendance Portal — Geo-Fence Check</p>
        </div>

        <div className="scan-icon-wrap">
          {status === 'loading' && '📍'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>

        <div className={`scan-status-box ${status}`}>
          {status === 'loading' && <div className="spinner" style={{ width: '28px', height: '28px' }}></div>}
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            {status === 'loading' ? 'Processing...' : status === 'success' ? 'Attendance Marked!' : 'Verification Failed'}
          </h3>
          <p style={{ fontSize: '0.875rem' }}>{message}</p>
        </div>

        {logDetails && (
          <div className="scan-details">
            <p>Employee: <strong>{logDetails.employeeName}</strong> ({logDetails.employeeId})</p>
            <p>Distance from Office: <strong>{logDetails.distance} meters</strong></p>
            <p>Timestamp: <strong>{new Date(logDetails.timestamp).toLocaleTimeString()}</strong></p>
          </div>
        )}

        <div style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>
          Fixed Office Location: Lat 19.215340, Lng 73.201477 (500m radius)
        </div>
      </div>
    </div>
  )
}
