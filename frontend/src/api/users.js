import api from './axios'

export const getUsers = () => api.get('/users/')
export const updateUser = (id, data) => api.patch(`/users/${id}`, data)
export const deactivateUser = (id) => api.delete(`/users/${id}`)
