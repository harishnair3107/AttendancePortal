import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetchJson } from '../utils/api'
import '../styles/login.css'

export default function EmployeeLogin() {
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!employeeId || !password) {
      setError('Please enter both Employee ID and password.')
      return
    }

    setLoading(true)

    try {
      const data = await apiFetchJson('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
      })

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.employee))
      localStorage.setItem('role', 'employee')

      navigate('/employee/dashboard')
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
          <div className="login-icon-wrap">👤</div>
          <h1>Employee Login</h1>
          <p>Access your attendance dashboard</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              placeholder="e.g. EMP001"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
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
            {loading ? <div className="spinner"></div> : '🚀 Sign In'}
          </button>
        </form>

        <div className="login-footer">
          Are you an administrator? <Link to="/admin">Admin Login</Link>
        </div>
      </div>
    </div>
  )
}
