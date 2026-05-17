import api from './axios'

export const getStats = () => api.get('/dashboard/stats')
export const getCategoryBreakdown = () => api.get('/dashboard/category-breakdown')
