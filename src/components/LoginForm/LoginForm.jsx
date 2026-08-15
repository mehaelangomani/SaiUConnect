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
    <form className="login-form suc-animate-fade-in-up" onSubmit={handleSubmit} noValidate>
      <div className="suc-field">
        <label className="suc-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="suc-input"
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

      <div className="suc-field">
        <label className="suc-label" htmlFor="password">
          Password
        </label>
        <div className="suc-input-group">
          <input
            id="password"
            className="suc-input suc-input--with-action"
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
            className="login-form__toggle suc-btn suc-btn--text"
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
        className="suc-btn suc-btn--primary suc-btn--block login-form__submit"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <span className="suc-spinner" aria-hidden="true" />
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
