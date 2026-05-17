import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { getComplaints } from '../../api/complaints'
import { useAuth } from '../../context/AuthContext'
import '../../styles/complaints.css'

const STATUSES = ['', 'Open', 'Assigned', 'In Progress', 'Pending Customer Response', 'Escalated', 'Resolved', 'Closed']

export default function ComplaintList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const isAgent = user?.role?.role_name === 'Support Agent'
  const title = isAgent ? 'My Queue' : 'Complaints'

  useEffect(() => {
    setLoading(true)
    getComplaints(filter || undefined)
      .then((r) => setComplaints(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  const visible = complaints.filter((c) =>
    !search ||
    c.complaint_id.toLowerCase().includes(search.toLowerCase()) ||
    c.customer?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title={title}>
      <div className="page-header">
        <h2>{title}</h2>
        {user?.role?.role_name === 'Customer' && (
          <button className="btn btn-blue" onClick={() => navigate('/complaints/new')}>
            + New Complaint
          </button>
        )}
      </div>

      <div className="filters-bar">
        <input placeholder="Search by ID or customer…" value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
      </div>

      <div className="table-card">
        {loading ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Loading…</p>
        ) : visible.length === 0 ? (
          <p className="empty-state">No complaints found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Agent</th>
                <th>SLA Due</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.complaint_id}>
                  <td><strong>{c.complaint_id}</strong></td>
                  <td>{c.category?.category_name}</td>
                  <td><PriorityBadge priority={c.priority} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>{c.customer?.name}</td>
                  <td>{c.agent?.name || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
                  <td style={{ color: c.sla_due_date && new Date(c.sla_due_date) < new Date() ? '#dc2626' : 'inherit' }}>
                    {c.sla_due_date ? new Date(c.sla_due_date).toLocaleDateString() : '—'}
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/complaints/${c.complaint_id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
