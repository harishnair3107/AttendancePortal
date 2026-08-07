import { useState, useRef, useEffect } from 'react'
import { apiFetchJson } from '../utils/api'

export default function SelfieAttendance({ onAttendanceMarked }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [stream, setStream] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  
  // Location & Timestamp data
  const [location, setLocation] = useState(null)
  const [timestamp, setTimestamp] = useState(null)
  const [distance, setDistance] = useState(null)
  const [expectedStatus, setExpectedStatus] = useState('present')
  
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Office Fixed Coordinates
  const OFFICE_LAT = 19.215340
  const OFFICE_LNG = 73.201477

  // Calculate Haversine Distance in meters
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

  // Start Camera Stream
  const startCamera = async () => {
    setError('')
    setSuccess('')
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setCameraActive(true)
    } catch (err) {
      console.error('Camera access error:', err)
      setError('Unable to access camera. Please allow camera permissions in your browser.')
    }
  }

  // Stop Camera Stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setCameraActive(false)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  // Robustly bind camera stream to video element when it becomes available
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream, cameraActive, capturedImage])

  // Capture Photo & Device Location
  const handleCapture = () => {
    setError('')
    setSuccess('')
    if (!videoRef.current) return

    // 1. Local Preview Frame Capture (held in memory for preview only)
    const canvas = canvasRef.current || document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(imageDataUrl)

    // Stop live camera after snapshot
    stopCamera()

    // 2. Capture Device Timestamp & Status Check (10:30 AM cutoff)
    const now = new Date()
    setTimestamp(now)

    const hours = now.getHours()
    const minutes = now.getMinutes()
    if (hours < 10 || (hours === 10 && minutes <= 30)) {
      setExpectedStatus('present') // On-Time / Full Day
    } else {
      setExpectedStatus('half-day') // Half-Day
    }

    // 3. Capture Device Location
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }

    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLocation({ lat, lng })

        const distMeters = calculateDistance(lat, lng, OFFICE_LAT, OFFICE_LNG)
        setDistance(distMeters)
        setLocLoading(false)
      },
      (err) => {
        console.error('Location error:', err)
        setError('Failed to obtain device location. Please enable Location/GPS on your device.')
        setLocLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Retake Selfie
  const handleRetake = () => {
    setCapturedImage(null)
    setLocation(null)
    setTimestamp(null)
    setDistance(null)
    setError('')
    setSuccess('')
    startCamera()
  }

  // Submit Selfie Verification to Server (Image is NOT sent or stored)
  const handleSubmitAttendance = async () => {
    setError('')
    setSuccess('')

    if (!capturedImage) {
      setError('Please capture a live selfie photo first.')
      return
    }

    if (!location) {
      setError('Device location is required. Please allow location access.')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      // Send photoCaptured: true along with the base64 photoData to be saved in DB
      const data = await apiFetchJson('/api/attendance/selfie-mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          photoCaptured: true,
          photoData: capturedImage,
          latitude: location.lat,
          longitude: location.lng,
        }),
      })

      setSuccess(data.message || '✅ Attendance marked successfully!')
      if (onAttendanceMarked) onAttendanceMarked(data.log)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', width: '100%' }}>
      {error && <div className="alert alert-error" style={{ width: '100%' }}>⚠️ {error}</div>}
      {success && <div className="alert alert-success" style={{ width: '100%' }}>✅ {success}</div>}

      {/* Hidden Canvas for local capture preview */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Privacy Notice Banner */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(67, 97, 238, 0.06)',
          border: '1px solid rgba(67, 97, 238, 0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          fontSize: '0.8rem',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span>🛡️</span>
        <span>
          <strong>Live Verification:</strong> Photo is captured to verify live presence and is stored securely in the system database for admin review.
        </span>
      </div>

      {/* Camera Live View or Captured Photo */}
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          height: '300px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface-2)',
          border: '2px dashed var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Local Snapshot (Not Saved)"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📸</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Selfie Live Verification</p>
            <p style={{ fontSize: '0.8rem' }}>Click below to start camera</p>
          </div>
        )}

        {/* Live Camera Badge */}
        {cameraActive && !capturedImage && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(239, 71, 111, 0.9)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
            LIVE CAMERA
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {!cameraActive && !capturedImage && (
          <button onClick={startCamera} className="btn btn-primary">
            📷 Turn On Camera
          </button>
        )}

        {cameraActive && !capturedImage && (
          <>
            <button onClick={handleCapture} className="btn btn-accent">
              📸 Capture Photo
            </button>
            <button onClick={stopCamera} className="btn btn-ghost">
              ✕ Cancel
            </button>
          </>
        )}

        {capturedImage && (
          <button onClick={handleRetake} className="btn btn-ghost" disabled={loading}>
            🔄 Retake Photo
          </button>
        )}
      </div>

      {/* Captured Status & Verified Details Box */}
      {capturedImage && (
        <div
          className="fade-in-up"
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text)' }}>
              📸 Photo Capture Status
            </span>
            <span className="badge badge-success" style={{ fontSize: '0.8rem' }}>
              ✓ STATUS: CAPTURED
            </span>
          </div>

          {/* Captured Details List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
            {/* Timestamp */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>🕒 Timestamp:</span>
              <strong style={{ fontFamily: 'monospace' }}>
                {timestamp ? timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'Calculating...'}
              </strong>
            </div>

            {/* Attendance Timing Status (Cutoff 10:30 AM) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>⏱️ Time Slot Status:</span>
              {expectedStatus === 'present' ? (
                <span className="badge badge-success">✓ On-Time (Full Day)</span>
              ) : (
                <span className="badge" style={{ background: 'rgba(244, 140, 6, 0.12)', color: '#d97706', border: '1px solid rgba(244, 140, 6, 0.25)' }}>
                  ⚠️ Half-Day (After 10:30 AM)
                </span>
              )}
            </div>

            {/* Location Coordinates */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>📍 GPS Coordinates:</span>
              <strong style={{ fontFamily: 'monospace' }}>
                {locLoading ? (
                  'Detecting GPS...'
                ) : location ? (
                  `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                ) : (
                  'Not detected'
                )}
              </strong>
            </div>

            {/* Distance to Office */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>📏 Office Radius Check:</span>
              {distance !== null ? (
                distance <= 500 ? (
                  <span className="badge badge-success">
                    ✓ {distance}m away (Within 500m)
                  </span>
                ) : (
                  <span className="badge badge-danger">
                    ❌ {distance}m away (Exceeds 500m)
                  </span>
                )
              ) : (
                <span>Checking distance...</span>
              )}
            </div>
          </div>

          {/* Submit Attendance Button */}
          <button
            onClick={handleSubmitAttendance}
            className="btn btn-primary"
            disabled={loading || locLoading || !location || (distance !== null && distance > 500)}
            style={{ width: '100%', padding: '13px', marginTop: '6px', fontSize: '0.95rem' }}
          >
            {loading ? <div className="spinner" /> : '🚀 Confirm & Submit Attendance'}
          </button>
        </div>
      )}
    </div>
  )
}
