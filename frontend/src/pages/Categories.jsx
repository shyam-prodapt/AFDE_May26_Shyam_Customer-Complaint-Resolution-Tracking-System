import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'
import toast from 'react-hot-toast'
import '../styles/complaints.css'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ category_name: '', description: '' })
  const [editing, setEditing] = useState(null)

  const load = () => getCategories().then((r) => setCategories(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateCategory(editing, form)
        toast.success('Category updated')
        setEditing(null)
      } else {
        await createCategory(form)
        toast.success('Category created')
      }
      setForm({ category_name: '', description: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await deleteCategory(id)
      toast.success('Deleted')
      load()
    } catch {
      toast.error('Cannot delete — may have complaints attached')
    }
  }

  return (
    <Layout title="Categories">
      <div className="page-header"><h2>Complaint Categories</h2></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div className="table-card">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.category_id}>
                  <td>{c.category_id}</td>
                  <td><strong>{c.category_name}</strong></td>
                  <td>{c.description || '—'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                      setEditing(c.category_id)
                      setForm({ category_name: c.category_name, description: c.description || '' })
                    }}>Edit</button>
                    <button className="btn btn-red btn-sm" onClick={() => handleDelete(c.category_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <h3>{editing ? 'Edit Category' : 'Add Category'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input required value={form.category_name}
                onChange={(e) => setForm({ ...form, category_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{ minHeight: 70 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-blue" style={{ flex: 1 }}>
                {editing ? 'Update' : 'Create'}
              </button>
              {editing && (
                <button type="button" className="btn btn-outline" onClick={() => {
                  setEditing(null)
                  setForm({ category_name: '', description: '' })
                }}>Cancel</button>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
