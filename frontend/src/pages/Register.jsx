import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/auth'
import toast from 'react-hot-toast'
import '../styles/auth.css'

const ROLES = [
  { id: 4, label: 'Customer' },
  { id: 2, label: 'Support Agent' },
  { id: 3, label: 'Supervisor' },
  { id: 5, label: 'Quality Team' },
]

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: 4 })
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({ ...form, role_id: Number(form.role_id) })
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>CRT System</h1>
          <p>Customer Complaint &amp; Resolution Tracking</p>
        </div>
        <h2>Create Account</h2>
        <form onSubmit={handle}>
          <div className="form-group">
            <label>Full Name</label>
            <input required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email address</label>
            <input type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <button className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
