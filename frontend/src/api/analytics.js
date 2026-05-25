import api from './axios'

export const runEtl            = () => api.post('/analytics/run-etl')
export const getAnalyticsSummary  = () => api.get('/analytics/summary')
export const getSlaReport      = () => api.get('/analytics/sla-report')
export const getCategoryAnalysis  = () => api.get('/analytics/category-analysis')
export const getResolutionTrends  = () => api.get('/analytics/resolution-trends')
export const getAgentPerformance  = () => api.get('/analytics/agent-performance')
