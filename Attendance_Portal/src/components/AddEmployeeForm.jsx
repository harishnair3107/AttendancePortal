import { useState } from 'react'
import { apiFetch } from '../utils/api'

export default function AddEmployeeForm({ onEmployeeAdded }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name || !email || !employeeId || !password) {
      setError('All fields are required.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        throw new Error('Authentication token missing. Please log in again.')
      }

      const res = await apiFetch('/api/employees/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, employeeId, password }),
      })

      let data
      try {
        data = await res.json()
      } catch {
        throw new Error('Server returned an invalid response. Please check if the server is running.')
      }

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expired or token invalid. Please log out and log back in.')
        }
        throw new Error(data.message || `Failed to add employee (status ${res.status})`)
      }

      setSuccess(`Employee "${data.employee.name}" created successfully!`)
      setName('')
      setEmail('')
      setEmployeeId('')
      setPassword('')

      if (onEmployeeAdded) onEmployeeAdded(data.employee)
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to the server. Make sure the backend is running on ' + (import.meta.env.VITE_API_URL || 'http://localhost:5000'))
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-employee-form">
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      <div className="form-group">
        <label>Full Name</label>
        <input
          type="text"
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          placeholder="e.g. john@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Employee ID</label>
        <input
          type="text"
          placeholder="e.g. EMP001"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Initial Password</label>
        <input
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? <div className="spinner"></div> : '➕ Create Employee'}
      </button>
    </form>
  )
}
