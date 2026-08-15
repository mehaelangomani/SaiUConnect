import SaiUniversityMark from '../SaiUniversityMark/SaiUniversityMark'

function BrandWatermark({ variant = 'default', className = '' }) {
  const variantClass =
    variant === 'auth'
      ? 'suc-watermark--auth'
      : variant === 'corner'
        ? 'suc-watermark--corner'
        : variant === 'subtle'
          ? 'suc-watermark--subtle'
          : ''

  return (
    <div className={`suc-watermark ${variantClass} ${className}`.trim()} aria-hidden="true">
      <SaiUniversityMark className="suc-watermark__logo" />
    </div>
  )
}

export default BrandWatermark
