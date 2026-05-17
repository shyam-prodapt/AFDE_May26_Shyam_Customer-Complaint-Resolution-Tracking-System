import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import StatusBadge from '../../components/StatusBadge'
import PriorityBadge from '../../components/PriorityBadge'
import { getComplaint, getHistory, updateStatus, assignComplaint, uploadAttachment } from '../../api/complaints'
import { getUsers } from '../../api/users'
import { submitFeedback, getFeedback } from '../../api/feedback'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import '../../styles/complaints.css'

const TRANSITIONS = {
  Admin:         ['Assigned', 'In Progress', 'Escalated', 'Resolved', 'Closed'],
  Supervisor:    ['In Progress', 'Escalated', 'Resolved', 'Closed'],
  'Support Agent':['In Progress', 'Pending Customer Response', 'Resolved'],
  Customer:      ['Closed'],
  'Quality Team':[],
}

export default function ComplaintDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role?.role_name

  const [complaint, setComplaint] = useState(null)
  const [history, setHistory] = useState([])
  const [agents, setAgents] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [comment, setComment] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('')
  const [rating, setRating] = useState(5)
  const [fbComment, setFbComment] = useState('')

  const reload = () => {
    getComplaint(id).then((r) => setComplaint(r.data)).catch(() => navigate('/complaints'))
    getHistory(id).then((r) => setHistory(r.data)).catch(() => {})
    getFeedback(id).then((r) => setFeedback(r.data)).catch(() => {})
  }

  useEffect(() => {
    reload()
    if (['Admin', 'Supervisor'].includes(role)) {
      getUsers().then((r) => setAgents(r.data.filter((u) => u.role.role_name === 'Support Agent'))).catch(() => {})
    }
  }, [id])

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    try {
      await updateStatus(id, newStatus, comment)
      toast.success('Status updated')
      setNewStatus(''); setComment('')
      reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    }
  }

  const handleAssign = async () => {
    if (!selectedAgent) return
    try {
      await assignComplaint(id, Number(selectedAgent))
      toast.success('Complaint assigned')
      setSelectedAgent('')
      reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      await uploadAttachment(id, file)
      toast.success('File uploaded')
      reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    }
  }

  const handleFeedback = async (e) => {
    e.preventDefault()
    try {
      await submitFeedback(id, { rating: Number(rating), comments: fbComment })
      toast.success('Feedback submitted!')
      reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    }
  }

  if (!complaint) return <Layout title="Loading…"><p style={{ padding: 24 }}>Loading…</p></Layout>

  const allowedStatuses = TRANSITIONS[role] || []
  const canFeedback = role === 'Customer' &&
    ['Resolved', 'Closed'].includes(complaint.status) && !feedback

  return (
    <Layout title={`Complaint ${id}`}>
      <div className="page-header">
        <h2>{complaint.complaint_id}</h2>
        <button className="btn btn-outline" onClick={() => navigate('/complaints')}>← Back</button>
      </div>

      <div className="detail-layout">
        {/* Left column */}
        <div>
          <div className="card">
            <h3>Details</h3>
            <div className="meta-grid">
              <div className="meta-item"><label>Status</label><StatusBadge status={complaint.status} /></div>
              <div className="meta-item"><label>Priority</label><PriorityBadge priority={complaint.priority} /></div>
              <div className="meta-item"><label>Category</label><span>{complaint.category?.category_name}</span></div>
              <div className="meta-item"><label>Customer</label><span>{complaint.customer?.name}</span></div>
              <div className="meta-item"><label>Agent</label><span>{complaint.agent?.name || 'Unassigned'}</span></div>
              <div className="meta-item">
                <label>SLA Due</label>
                <span style={{ color: complaint.sla_due_date && new Date(complaint.sla_due_date) < new Date() ? '#dc2626' : 'inherit' }}>
                  {complaint.sla_due_date ? new Date(complaint.sla_due_date).toLocaleString() : '—'}
                </span>
              </div>
              <div className="meta-item"><label>Created</label><span>{new Date(complaint.created_at).toLocaleString()}</span></div>
              {complaint.resolved_date && (
                <div className="meta-item"><label>Resolved</label><span>{new Date(complaint.resolved_date).toLocaleString()}</span></div>
              )}
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Description</label>
              <p style={{ marginTop: 6, fontSize: 14, lineHeight: 1.6, color: '#374151' }}>{complaint.description}</p>
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <h3>Attachments</h3>
            {complaint.attachments?.length === 0
              ? <p style={{ color: '#9ca3af', fontSize: 13 }}>No attachments.</p>
              : complaint.attachments?.map((a) => (
                  <div key={a.attachment_id} style={{ fontSize: 13, padding: '4px 0' }}>📎 {a.file_name}</div>
                ))
            }
            {!['Resolved','Closed'].includes(complaint.status) && (
              <div style={{ marginTop: 12 }}>
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                  Upload File
                  <input type="file" style={{ display: 'none' }} onChange={handleFile} />
                </label>
              </div>
            )}
          </div>

          {/* History */}
          <div className="card">
            <h3>History</h3>
            <ul className="history-list">
              {history.map((h) => (
                <li key={h.history_id} className="history-item">
                  <div className="history-dot" />
                  <div className="history-text">
                    <strong>{h.old_status || 'Created'}</strong> → <strong>{h.new_status}</strong>
                    {h.comment && <> &mdash; {h.comment}</>}
                    <small>{h.updated_by_user?.name} &bull; {new Date(h.updated_at).toLocaleString()}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Update status */}
          {allowedStatuses.length > 0 && !['Closed'].includes(complaint.status) && (
            <div className="card">
              <h3>Update Status</h3>
              <div className="form-group">
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  <option value="">— Select new status —</option>
                  {allowedStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <textarea placeholder="Comment (optional)" value={comment}
                  onChange={(e) => setComment(e.target.value)} style={{ minHeight: 70 }} />
              </div>
              <button className="btn btn-blue" style={{ width: '100%' }} onClick={handleStatusUpdate}>
                Update Status
              </button>
            </div>
          )}

          {/* Assign agent */}
          {['Admin','Supervisor'].includes(role) && complaint.status !== 'Closed' && (
            <div className="card">
              <h3>Assign Agent</h3>
              <div className="form-group">
                <select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
                  <option value="">— Select agent —</option>
                  {agents.map((a) => <option key={a.user_id} value={a.user_id}>{a.name}</option>)}
                </select>
              </div>
              <button className="btn btn-green" style={{ width: '100%' }} onClick={handleAssign}>
                Assign
              </button>
            </div>
          )}

          {/* Feedback */}
          {canFeedback && (
            <div className="card">
              <h3>Rate Resolution</h3>
              <form onSubmit={handleFeedback}>
                <div className="form-group">
                  <label>Rating (1–5)</label>
                  <select value={rating} onChange={(e) => setRating(e.target.value)}>
                    {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} ⭐</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <textarea placeholder="Comments (optional)" value={fbComment}
                    onChange={(e) => setFbComment(e.target.value)} style={{ minHeight: 70 }} />
                </div>
                <button className="btn btn-blue" style={{ width: '100%' }}>Submit Feedback</button>
              </form>
            </div>
          )}

          {/* Show existing feedback */}
          {feedback && (
            <div className="card">
              <h3>Customer Feedback</h3>
              <p style={{ fontSize: 22, marginBottom: 6 }}>{'⭐'.repeat(feedback.rating)}</p>
              <p style={{ fontSize: 13, color: '#374151' }}>{feedback.comments || 'No comment.'}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
