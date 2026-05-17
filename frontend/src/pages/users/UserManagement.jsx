import { useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { getUsers, updateUser, deactivateUser } from '../../api/users'
import toast from 'react-hot-toast'
import '../../styles/complaints.css'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getUsers().then((r) => setUsers(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (user) => {
    try {
      await updateUser(user.user_id, { is_active: !user.is_active })
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}`)
      load()
    } catch {
      toast.error('Failed')
    }
  }

  return (
    <Layout title="User Management">
      <div className="page-header">
        <h2>Users</h2>
      </div>

      <div className="table-card">
        {loading ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Loading…</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.user_id}</td>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-open">{u.role.role_name}</span></td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-resolved' : 'badge-closed'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className={`btn btn-sm ${u.is_active ? 'btn-red' : 'btn-green'}`}
                      onClick={() => toggleActive(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
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
