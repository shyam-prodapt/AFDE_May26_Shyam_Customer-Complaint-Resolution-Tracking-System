import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import Layout from '../components/Layout'
import { getStats, getCategoryBreakdown } from '../api/dashboard'
import '../styles/dashboard.css'

const COLORS = ['#60a5fa','#34d399','#ffc84a','#fb7185','#a78bfa','#2dd4bf','#f97316']

const STAT_CONFIG = [
  { key: 'total',       label: 'Total Complaints', color: 'rgba(96,165,250,0.12)',   icon: '📋' },
  { key: 'open',        label: 'Open',              color: 'rgba(251,191,36,0.12)',   icon: '🟡' },
  { key: 'in_progress', label: 'In Progress',       color: 'rgba(45,212,191,0.12)',   icon: '🔄' },
  { key: 'escalated',   label: 'Escalated',         color: 'rgba(251,113,133,0.12)',  icon: '🔺' },
  { key: 'resolved',    label: 'Resolved',          color: 'rgba(52,211,153,0.12)',   icon: '✅' },
  { key: 'closed',      label: 'Closed',            color: 'rgba(255,255,255,0.05)', icon: '🔒' },
  { key: 'sla_breaches',label: 'SLA Breaches',      color: 'rgba(251,113,133,0.15)', icon: '⚠️' },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [breakdown, setBreakdown] = useState([])

  useEffect(() => {
    getStats().then((r) => setStats(r.data)).catch(() => {})
    getCategoryBreakdown().then((r) => setBreakdown(r.data)).catch(() => {})
  }, [])

  const statusData = stats ? [
    { name: 'Open',        value: stats.open },
    { name: 'In Progress', value: stats.in_progress },
    { name: 'Escalated',   value: stats.escalated },
    { name: 'Resolved',    value: stats.resolved },
    { name: 'Closed',      value: stats.closed },
  ] : []

  return (
    <Layout title="Dashboard">
      <div className="dashboard-page">
        <h2>Overview</h2>

        <div className="stats-grid">
          {STAT_CONFIG.map(({ key, label, color, icon }) => (
            <div className="stat-card" key={key}>
              <div className="stat-icon" style={{ background: color }}>{icon}</div>
              <div className="stat-value">{stats ? (stats[key] ?? 0) : '—'}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
          {stats?.avg_customer_rating && (
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef9c3' }}>⭐</div>
              <div className="stat-value">{stats.avg_customer_rating}</div>
              <div className="stat-label">Avg. Rating</div>
            </div>
          )}
        </div>

        <div className="charts-row">
          <div className="chart-card">
            <h3>Complaints by Status</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#12172b', border: '1px solid rgba(255,200,80,0.15)', borderRadius: 8, fontSize: 12, color: '#d4d9ee' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#6b7a9e' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Complaints by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={breakdown} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <XAxis dataKey="category_id" tick={{ fill: '#3a4760', fontSize: 11 }} />
                <YAxis tick={{ fill: '#3a4760', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#12172b', border: '1px solid rgba(255,200,80,0.15)', borderRadius: 8, fontSize: 12, color: '#d4d9ee' }} />
                <Bar dataKey="count" fill="#ffc84a" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  )
}
