import BrandWatermark from '../BrandWatermark/BrandWatermark'

function PageBackground({ variant = 'auth', watermark = true, watermarkVariant, children }) {
  const resolvedWatermarkVariant = watermarkVariant ?? (variant === 'auth' ? 'auth' : 'default')

  return (
    <div className={`suc-page-bg suc-page-bg--${variant}`}>
      <div className="suc-page-bg__layer" aria-hidden="true">
        <div className="suc-page-bg__gradient" />
        {watermark && <BrandWatermark variant={resolvedWatermarkVariant} />}
      </div>
      <div className="suc-page-bg__content">{children}</div>
    </div>
  )
}

export default PageBackground
