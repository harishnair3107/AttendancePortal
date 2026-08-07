import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetchJson } from '../utils/api'
import '../styles/login.css'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setError('')

    // Client side check for admin email
    if (email.toLowerCase().trim() !== 'harishnair3107@gmail.com') {
      setError('Access Denied. Only harishnair3107@gmail.com is authorized as Admin.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    try {
      const data = await apiFetchJson('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.admin))
      localStorage.setItem('role', 'admin')

      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--color-warning), #e67e22)' }}>
            🛡️
          </div>
          <h1>Admin Portal</h1>
          <p>Restricted access area</p>
        </div>

        <div className="admin-badge">
          🔒 Only authorized admin (harishnair3107@gmail.com) can log in
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleAdminLogin} className="login-form">
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              placeholder="harishnair3107@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
            {loading ? <div className="spinner"></div> : '🔐 Admin Sign In'}
          </button>
        </form>

        <div className="login-footer">
          Are you an employee? <Link to="/login">Employee Login</Link>
        </div>
      </div>
    </div>
  )
}
