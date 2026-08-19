import { Navigate, Route, Routes } from 'react-router-dom'
import PageBackground from '../../components/PageBackground/PageBackground'
import TimetableEditor from '../../components/timetable-editor/TimetableEditor'
import AdminProfilePanel from '../../components/timetable-editor/AdminProfilePanel'
import AdminNotificationsPage from '../../components/timetable-editor/AdminNotificationsPage'

function AdminDashboard() {
  return (
    <PageBackground variant="dashboard" watermarkVariant="corner">
      <div className="timetable-editor-page">
        <Routes>
          <Route index element={<TimetableEditor mode="admin" />} />
          <Route path="profile" element={<AdminProfilePanel />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </PageBackground>
  )
}

export default AdminDashboard
