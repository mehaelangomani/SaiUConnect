import BrandLogo from '../BrandLogo/BrandLogo'
import LoginForm from '../LoginForm/LoginForm'
import './LoginPage.css'

function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-page__background" aria-hidden="true">
        <div className="login-page__gradient" />
        <div className="login-page__pattern" />
      </div>

      <main className="login-page__content">
        <div className="login-page__card">
          <BrandLogo />
          <LoginForm />
        </div>
      </main>
    </div>
  )
}

export default LoginPage
