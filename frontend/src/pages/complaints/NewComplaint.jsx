import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout'
import { createComplaint } from '../../api/complaints'
import { getCategories } from '../../api/categories'
import toast from 'react-hot-toast'
import '../../styles/complaints.css'

export default function NewComplaint() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ category_id: '', description: '', priority: 'Medium' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data)).catch(() => {})
  }, [])

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await createComplaint({ ...form, category_id: Number(form.category_id) })
      toast.success(`Complaint ${data.complaint_id} registered!`)
      navigate(`/complaints/${data.complaint_id}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit complaint')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="New Complaint">
      <div className="page-header">
        <h2>Register New Complaint</h2>
      </div>

      <div className="form-card">
        <form onSubmit={handle}>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select required value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">— Select category —</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea required value={form.description}
              placeholder="Describe your issue in detail…"
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-blue" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Complaint'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/complaints')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
