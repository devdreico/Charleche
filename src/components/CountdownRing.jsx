import { useId } from 'react'

export default function CountdownRing({ progress = 0, size = 132, stroke = 11, from = '#7ed0b0', to = '#f2568b', due = false, children }) {
  const gid = useId().replace(/:/g, '')
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, progress))
  return (
    <div className={`ring-wrap${due ? ' due' : ''}`} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="ring-bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#g${gid})`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}
