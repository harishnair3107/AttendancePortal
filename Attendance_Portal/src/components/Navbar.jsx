import { useNavigate } from 'react-router-dom'

export default function Navbar({ title, role, userName, onOpenSlidingBar }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    if (role === 'admin') {
      navigate('/admin')
    } else {
      navigate('/login')
    }
  }

  return (
    <header
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#fff',
          }}
        >
          📍
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{title || 'Attendance Portal'}</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {role === 'admin' ? '🛡️ Admin Panel' : '👤 Employee Portal'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onOpenSlidingBar && (
          <button
            onClick={onOpenSlidingBar}
            className="drawer-toggle-btn"
          >
            {role === 'admin' ? '⚡ Manage Employees' : '⚙️ Options & Rules'}
          </button>
        )}
        {userName && (
          <span className="hide-mobile" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {userName}
          </span>
        )}
        <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
          🚪 Logout
        </button>
      </div>
    </header>
  )
}
