import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ComplaintList from './pages/complaints/ComplaintList'
import ComplaintDetail from './pages/complaints/ComplaintDetail'
import NewComplaint from './pages/complaints/NewComplaint'
import UserManagement from './pages/users/UserManagement'
import Categories from './pages/Categories'

const ADMIN_ROLES = ['Admin']
const MANAGEMENT_ROLES = ['Admin', 'Supervisor', 'Quality Team']

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <ProtectedRoute roles={MANAGEMENT_ROLES}><Dashboard /></ProtectedRoute>
          } />

          <Route path="/complaints" element={
            <ProtectedRoute><ComplaintList /></ProtectedRoute>
          } />
          <Route path="/complaints/new" element={
            <ProtectedRoute><NewComplaint /></ProtectedRoute>
          } />
          <Route path="/complaints/:id" element={
            <ProtectedRoute><ComplaintDetail /></ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute roles={ADMIN_ROLES}><UserManagement /></ProtectedRoute>
          } />
          <Route path="/categories" element={
            <ProtectedRoute roles={ADMIN_ROLES}><Categories /></ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/complaints" replace />} />
          <Route path="*" element={<Navigate to="/complaints" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
