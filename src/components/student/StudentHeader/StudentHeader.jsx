import SaiUniversityMark from '../../SaiUniversityMark/SaiUniversityMark'
import './StudentHeader.css'

function StudentHeader() {
  return (
    <div className="student-header__box suc-header">
      <div className="student-header__brand">
        <SaiUniversityMark className="student-header__logo" />
        <div>
          <span className="student-header__brand-name">SaiUConnect</span>
          <span className="student-header__brand-sub">Sai University</span>
        </div>
      </div>
    </div>
  )
}

export default StudentHeader
