import api from './axios'

export const submitFeedback = (complaintId, data) => api.post(`/feedback/${complaintId}`, data)
export const getFeedback = (complaintId) => api.get(`/feedback/${complaintId}`)
