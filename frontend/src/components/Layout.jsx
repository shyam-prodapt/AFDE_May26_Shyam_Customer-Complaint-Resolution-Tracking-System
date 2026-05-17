import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { getNotifications, markAllRead } from '../api/notifications'
import '../styles/layout.css'

const NAV = {
  Admin: [
    { to: '/dashboard',   label: 'Dashboard' },
    { to: '/complaints',  label: 'All Complaints' },
    { to: '/users',       label: 'User Management' },
    { to: '/categories',  label: 'Categories' },
  ],
  Supervisor: [
    { to: '/dashboard',   label: 'Dashboard' },
    { to: '/complaints',  label: 'All Complaints' },
  ],
  'Support Agent': [
    { to: '/complaints',  label: 'My Queue' },
  ],
  Customer: [
    { to: '/complaints',  label: 'My Complaints' },
    { to: '/complaints/new', label: 'New Complaint' },
  ],
  'Quality Team': [
    { to: '/dashboard',   label: 'Dashboard' },
    { to: '/complaints',  label: 'Complaints' },
  ],
}

export default function Layout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    getNotifications()
      .then((r) => setUnread(r.data.filter((n) => !n.is_read).length))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }
  const navItems = NAV[user?.role?.role_name] || []
  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Complaint Tracker</h2>
          <span>Resolution System</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/complaints' && user?.role?.role_name !== 'Customer'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{initials}</div>
            <div className="user-info-text">
              <p>{user?.name}</p>
              <span>{user?.role?.role_name}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <div className="topbar-right">
            <button
              className="notif-btn"
              onClick={() => { markAllRead(); setUnread(0) }}
              title="Mark all notifications read"
            >
              🔔
              {unread > 0 && <span className="notif-badge">{unread}</span>}
            </button>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{user?.email}</span>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
