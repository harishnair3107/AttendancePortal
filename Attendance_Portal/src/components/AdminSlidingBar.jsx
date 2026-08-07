import { useState, useEffect, useCallback } from 'react'
import AddEmployeeForm from './AddEmployeeForm'
import { apiFetch } from '../utils/api'
import '../styles/slidingBar.css'

export default function AdminSlidingBar({ isOpen, onClose, onEmployeeChange }) {
  const [activeTab, setActiveTab] = useState('add') // 'add' | 'update' | 'remove'
  const [employees, setEmployees] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState('')
  
  // Update form fields
  const [updateName, setUpdateName] = useState('')
  const [updateEmail, setUpdateEmail] = useState('')
  const [updatePassword, setUpdatePassword] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')

  // Remove form fields
  const [removeLoading, setRemoveLoading] = useState(false)
  const [removeError, setRemoveError] = useState('')
  const [removeSuccess, setRemoveSuccess] = useState('')

  const fetchEmployeesList = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await apiFetch('/api/employees/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setEmployees(data.employees || [])
      }
    } catch (err) {
      console.error('Error fetching employee list:', err)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchEmployeesList()
      setUpdateError('')
      setUpdateSuccess('')
      setRemoveError('')
      setRemoveSuccess('')
    }
  }, [isOpen, fetchEmployeesList])

  const handleEmployeeSelect = (empId) => {
    setSelectedEmpId(empId)
    setUpdateError('')
    setUpdateSuccess('')
    setRemoveError('')
    setRemoveSuccess('')

    const emp = employees.find((e) => e._id === empId || e.employeeId === empId)
    if (emp) {
      setUpdateName(emp.name || '')
      setUpdateEmail(emp.email || '')
      setUpdatePassword('')
    } else {
      setUpdateName('')
      setUpdateEmail('')
      setUpdatePassword('')
    }
  }

  // Handle Update Employee
  const handleUpdateEmployee = async (e) => {
    e.preventDefault()
    setUpdateError('')
    setUpdateSuccess('')

    if (!selectedEmpId) {
      setUpdateError('Please select an employee to update.')
      return
    }

    setUpdateLoading(true)

    try {
      const token = localStorage.getItem('token')
      const bodyPayload = {
        id: selectedEmpId,
        name: updateName,
        email: updateEmail,
      }
      if (updatePassword) {
        bodyPayload.password = updatePassword
      }

      const res = await apiFetch(`/api/employees/update/${selectedEmpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update employee')
      }

      setUpdateSuccess(`Employee "${data.employee.name}" updated successfully!`)
      setUpdatePassword('')
      fetchEmployeesList()
      if (onEmployeeChange) onEmployeeChange()
    } catch (err) {
      setUpdateError(err.message)
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle Remove Employee
  const handleRemoveEmployee = async (e) => {
    e.preventDefault()
    setRemoveError('')
    setRemoveSuccess('')

    if (!selectedEmpId) {
      setRemoveError('Please select an employee to remove.')
      return
    }

    const selectedEmp = employees.find((e) => e._id === selectedEmpId)
    const empName = selectedEmp ? selectedEmp.name : 'this employee'

    if (!window.confirm(`Are you sure you want to remove ${empName}? This action cannot be undone.`)) {
      return
    }

    setRemoveLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await apiFetch(`/api/employees/delete/${selectedEmpId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to remove employee')
      }

      setRemoveSuccess(data.message || 'Employee removed successfully!')
      setSelectedEmpId('')
      fetchEmployeesList()
      if (onEmployeeChange) onEmployeeChange()
    } catch (err) {
      setRemoveError(err.message)
    } finally {
      setRemoveLoading(false)
    }
  }

  const handleAddSuccess = (newEmp) => {
    fetchEmployeesList()
    if (onEmployeeChange) onEmployeeChange(newEmp)
  }

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
          <h3>⚡ Admin Actions Panel</h3>
          <button className="close-drawer-btn" onClick={onClose} title="Close Panel">
            ✕
          </button>
        </div>

        {/* 3 Tabs: Add, Update, Remove */}
        <div className="sliding-bar-tabs">
          <button
            className={`sliding-tab-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            ➕ Add
          </button>
          <button
            className={`sliding-tab-btn ${activeTab === 'update' ? 'active' : ''}`}
            onClick={() => setActiveTab('update')}
          >
            ✏️ Update
          </button>
          <button
            className={`sliding-tab-btn ${activeTab === 'remove' ? 'active tab-remove' : ''}`}
            onClick={() => setActiveTab('remove')}
          >
            🗑️ Remove
          </button>
        </div>

        {/* Body Content based on Active Tab */}
        <div className="sliding-bar-body">
          {/* TAB 1: ADD EMPLOYEE */}
          {activeTab === 'add' && (
            <div className="fade-in-up">
              <h4 style={{ marginBottom: '14px', fontSize: '0.95rem' }}>➕ Create New Employee</h4>
              <AddEmployeeForm onEmployeeAdded={handleAddSuccess} />
            </div>
          )}

          {/* TAB 2: UPDATE EMPLOYEE */}
          {activeTab === 'update' && (
            <form onSubmit={handleUpdateEmployee} className="add-employee-form fade-in-up">
              <h4 style={{ marginBottom: '10px', fontSize: '0.95rem' }}>✏️ Update Employee Details</h4>
              
              {updateError && <div className="alert alert-error">⚠️ {updateError}</div>}
              {updateSuccess && <div className="alert alert-success">✅ {updateSuccess}</div>}

              <div className="employee-select-box">
                <label>Select Employee to Edit</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId}) - {emp.email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmpId && (
                <>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={updateName}
                      onChange={(e) => setUpdateName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={updateEmail}
                      onChange={(e) => setUpdateEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Reset Password (Optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep unchanged"
                      value={updatePassword}
                      onChange={(e) => setUpdatePassword(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={updateLoading}>
                    {updateLoading ? <div className="spinner"></div> : '💾 Save Changes'}
                  </button>
                </>
              )}
            </form>
          )}

          {/* TAB 3: REMOVE EMPLOYEE */}
          {activeTab === 'remove' && (
            <form onSubmit={handleRemoveEmployee} className="add-employee-form fade-in-up">
              <h4 style={{ marginBottom: '10px', fontSize: '0.95rem' }}>🗑️ Remove Employee Account</h4>

              {removeError && <div className="alert alert-error">⚠️ {removeError}</div>}
              {removeSuccess && <div className="alert alert-success">✅ {removeSuccess}</div>}

              <div className="employee-select-box">
                <label>Select Employee to Delete</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  required
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.employeeId}) - {emp.email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmpId && (
                <div className="remove-warning-box">
                  <strong>⚠️ Warning: Permanent Action</strong>
                  <p>
                    Removing this employee will delete their profile account. Their historical attendance records remain logged for compliance.
                  </p>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={removeLoading}
                    style={{ marginTop: '10px' }}
                  >
                    {removeLoading ? <div className="spinner"></div> : '🗑️ Confirm & Delete Employee'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </aside>
    </>
  )
}
