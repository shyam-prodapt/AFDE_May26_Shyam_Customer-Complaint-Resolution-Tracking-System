import api from './axios'

export const getComplaints = (status) =>
  api.get('/complaints/', { params: status ? { status_filter: status } : {} })

export const getComplaint = (id) => api.get(`/complaints/${id}`)
export const createComplaint = (data) => api.post('/complaints/', data)
export const assignComplaint = (id, agentId) => api.post(`/complaints/${id}/assign`, { agent_id: agentId })
export const updateStatus = (id, status, comment) => api.patch(`/complaints/${id}/status`, { status, comment })
export const getHistory = (id) => api.get(`/complaints/${id}/history`)
export const uploadAttachment = (id, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post(`/complaints/${id}/attachments`, fd)
}
