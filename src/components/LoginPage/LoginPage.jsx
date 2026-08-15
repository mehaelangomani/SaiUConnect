import PageBackground from '../PageBackground/PageBackground'
import BrandLogo from '../BrandLogo/BrandLogo'
import LoginForm from '../LoginForm/LoginForm'
import './LoginPage.css'

function LoginPage() {
  return (
    <PageBackground variant="auth" watermarkVariant="auth">
      <main className="login-page">
        <div className="login-page__card suc-card suc-card--elevated suc-animate-scale-in">
          <BrandLogo />
          <LoginForm />
        </div>
      </main>
    </PageBackground>
  )
}

export default LoginPage
