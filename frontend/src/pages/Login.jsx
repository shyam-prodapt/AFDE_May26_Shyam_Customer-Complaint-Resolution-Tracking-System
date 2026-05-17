import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login as apiLogin, getMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import '../styles/auth.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await apiLogin(form.email, form.password)
      localStorage.setItem('token', data.access_token)
      const meRes = await getMe()
      const userData = meRes.data
      login(data.access_token, userData)
      toast.success('Welcome back!')
      const role = userData.role?.role_name
      const dest = ['Admin', 'Supervisor', 'Quality Team'].includes(role) ? '/dashboard' : '/complaints'
      navigate(dest)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
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
        <h2>Sign In</h2>
        <form onSubmit={handle}>
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
          <button className="btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  )
}
