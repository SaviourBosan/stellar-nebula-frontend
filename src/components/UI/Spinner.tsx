import type { HTMLAttributes } from 'react'

interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 64,
}

const borderSizeMap = {
  sm: 2,
  md: 3,
  lg: 4,
}

export function Spinner({ size = 'md', text, style, ...props }: SpinnerProps) {
  const dimension = sizeMap[size]
  const border = borderSizeMap[size]

  return (
    <div
      role="status"
      aria-label={text ?? 'Loading'}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...style }}
      {...props}
    >
      <div
        className="nebula-spinner"
        style={{
          width: dimension,
          height: dimension,
          border: `${border}px solid rgba(100, 108, 255, 0.15)`,
          borderTopColor: '#646cff',
          borderRightColor: '#9d4edd',
          borderRadius: '50%',
        }}
      />
      {text && <span style={{ color: 'rgba(255, 255, 255, 0.87)', fontSize: 14 }}>{text}</span>}
    </div>
  )
}
