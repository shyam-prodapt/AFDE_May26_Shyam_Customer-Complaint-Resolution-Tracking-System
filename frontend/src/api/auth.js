import api from './axios'

export const login = (email, password) => {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return api.post('/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
}

export const register = (data) => api.post('/auth/register', data)
export const getMe = () => api.get('/users/me')
