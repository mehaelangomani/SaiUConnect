import './StudentPlaceholder.css'

function StudentPlaceholder({ title, description }) {
  return (
    <section className="student-placeholder suc-card">
      <h2 className="student-placeholder__title">{title}</h2>
      <p className="student-placeholder__description">{description}</p>
      <span className="suc-badge suc-badge--default">Coming soon</span>
    </section>
  )
}

export default StudentPlaceholder
