/**
 * Abstract mark inspired by the Sai University logo —
 * stylized flame/droplet form in university blue and teal.
 */
function SaiUniversityMark({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M100 18c-8 28-32 48-32 82 0 28 18 52 44 62-6-22 2-42 18-58C88 88 72 62 100 18Z"
        fill="var(--suc-blue-800)"
        opacity="0.85"
      />
      <path
        d="M100 18c28 46 12 70-6 84 16-16 24-36 18-58 26-10 44-34 44-62 0-34-24-54-32-82-18 14-34 38-24 60Z"
        fill="var(--suc-teal-600)"
        opacity="0.75"
      />
      <path
        d="M68 100c-14 16-22 36-16 58 8-4 14-10 18-18 4-14 2-28-2-40Z"
        fill="var(--suc-blue-700)"
        opacity="0.6"
      />
      <ellipse cx="100" cy="168" rx="52" ry="8" fill="var(--suc-blue-900)" opacity="0.12" />
    </svg>
  )
}

export default SaiUniversityMark
