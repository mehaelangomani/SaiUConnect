import PageBackground from '../../components/PageBackground/PageBackground'
import BrandLogo from '../../components/BrandLogo/BrandLogo'
import AcademicSetupForm from '../../components/student/AcademicSetup/AcademicSetupForm'
import './StudentAcademicSetup.css'

function StudentAcademicSetup() {
  return (
    <PageBackground variant="auth" watermarkVariant="auth">
      <main className="student-academic-setup">
        <div className="student-academic-setup__card suc-card suc-card--elevated suc-animate-scale-in">
          <header className="student-academic-setup__header">
            <BrandLogo />
            <p className="student-academic-setup__intro">
              Complete your academic setup to personalize your SaiUConnect dashboard.
            </p>
          </header>

          <AcademicSetupForm />
        </div>
      </main>
    </PageBackground>
  )
}

export default StudentAcademicSetup
