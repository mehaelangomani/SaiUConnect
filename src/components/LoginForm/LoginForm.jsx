import { useState } from 'react'
import './LoginForm.css'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (isLoading) return

    setIsLoading(true)

    // Placeholder for future authentication — no backend yet
    window.setTimeout(() => {
      setIsLoading(false)
    }, 1500)
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="login-form__field">
        <label className="login-form__label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="login-form__input"
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@university.edu"
          autoComplete="email"
          disabled={isLoading}
          required
        />
      </div>

      <div className="login-form__field">
        <label className="login-form__label" htmlFor="password">
          Password
        </label>
        <div className="login-form__password-wrapper">
          <input
            id="password"
            className="login-form__input login-form__input--password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isLoading}
            required
          />
          <button
            type="button"
            className="login-form__toggle-password"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={isLoading}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="login-form__submit"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className="login-form__spinner" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          'Login'
        )}
      </button>
    </form>
  )
}

export default LoginForm
