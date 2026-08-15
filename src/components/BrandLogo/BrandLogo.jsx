import SaiUniversityMark from '../SaiUniversityMark/SaiUniversityMark'
import './BrandLogo.css'

function BrandLogo() {
  return (
    <div className="brand-logo suc-animate-fade-in-down">
      <div className="brand-logo__mark">
        <SaiUniversityMark className="brand-logo__mark-svg" />
      </div>
      <h1 className="brand-logo__title">SaiUConnect</h1>
      <p className="brand-logo__subtitle">
        Personalized university timetables and real-time classroom availability
      </p>
    </div>
  )
}

export default BrandLogo
