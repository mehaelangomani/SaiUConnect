import './BrandLogo.css'

function BrandLogo() {
  return (
    <div className="brand-logo">
      <div className="brand-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" className="brand-logo__mark-bg" />
          <path
            d="M14 32V16h6.5c3.2 0 5.5 1.8 5.5 4.8 0 2.2-1.2 3.7-3.1 4.3L26 32h-3.5l-2.8-6.2H17.5V32H14zm3.5-9.2h2.8c1.5 0 2.4-.8 2.4-2.1s-.9-2.1-2.4-2.1h-2.8v4.2zM28 32V16h8.5v3h-5v3.8h4.8v3h-4.8V29H37v3H28z"
            className="brand-logo__mark-text"
          />
        </svg>
      </div>
      <h1 className="brand-logo__title">SaiUConnect</h1>
      <p className="brand-logo__subtitle">
        Personalized university timetables and real-time classroom availability
      </p>
    </div>
  )
}

export default BrandLogo
