import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import PublicRoute from './auth/PublicRoute'
import ProtectedRoute from './auth/ProtectedRoute'
import RootRedirect from './auth/RootRedirect'
import { ROLES } from './auth/roles'
import LoginPage from './components/LoginPage/LoginPage'
import ProfileErrorPage from './pages/ProfileErrorPage'
import StudentDashboard from './pages/StudentDashboard'
import StudentAcademicSetup from './pages/StudentAcademicSetup'
import StudentSetupRoute from './auth/StudentSetupRoute'
import FacultyDashboard from './pages/FacultyDashboard'
import EditorDashboard from './pages/EditorDashboard'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route path="/auth-error" element={<ProfileErrorPage />} />

          <Route
            path="/student/setup"
            element={
              <StudentSetupRoute>
                <StudentAcademicSetup />
              </StudentSetupRoute>
            }
          />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]} requireStudentSetupComplete>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={[ROLES.FACULTY]}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/editor/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.EDITOR]}>
                <EditorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
