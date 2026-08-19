import { Navigate, Route, Routes } from 'react-router-dom'
import PageBackground from '../components/PageBackground/PageBackground'
import TimetableEditor from '../components/timetable-editor/TimetableEditor'
import EditorProfilePanel from '../components/timetable-editor/EditorProfilePanel'

function EditorDashboard() {
  return (
    <PageBackground variant="dashboard" watermarkVariant="corner">
      <div className="timetable-editor-page">
        <Routes>
          <Route index element={<TimetableEditor mode="editor" />} />
          <Route path="profile" element={<EditorProfilePanel />} />
          <Route path="*" element={<Navigate to="/editor" replace />} />
        </Routes>
      </div>
    </PageBackground>
  )
}

export default EditorDashboard
