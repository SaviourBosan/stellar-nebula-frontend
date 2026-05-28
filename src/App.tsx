import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import './App.css'

function App() {
  return <RouterProvider router={router} />
}

function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <AppInner />
      </WalletProvider>
    </ErrorBoundary>
  )
}

export default App

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  left: 16,
  bottom: 16,
  zIndex: 12,
  width: 240,
  padding: 14,
  borderRadius: 16,
  background: 'linear-gradient(180deg, rgba(10, 10, 24, 0.78), rgba(12, 12, 32, 0.92))',
  border: '1px solid rgba(167, 139, 250, 0.18)',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.34)',
  backdropFilter: 'blur(12px)',
  color: 'rgba(255, 255, 255, 0.9)',
}

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  marginBottom: 12,
  textAlign: 'left',
}

const panelTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '0.02em',
}

const panelHintStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255, 255, 255, 0.58)',
}

const toggleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
}

const toggleLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
}

const sliderRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: 10,
  marginBottom: 12,
}

const sliderLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
}

const sliderStyle: React.CSSProperties = {
  width: '100%',
  accentColor: '#a78bfa',
}

const sliderValueStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'monospace',
  color: 'rgba(255, 255, 255, 0.64)',
  width: 38,
  textAlign: 'right',
}

const performanceButtonStyle = (enabled: boolean): React.CSSProperties => ({
  width: '100%',
  border: '1px solid rgba(96, 165, 250, 0.25)',
  background: enabled ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.05)',
  color: enabled ? '#bfdbfe' : 'rgba(255, 255, 255, 0.78)',
  padding: '8px 10px',
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 600,
  textAlign: 'left',
})

const switchStyle = (enabled: boolean): React.CSSProperties => ({
  width: 46,
  height: 26,
  borderRadius: 999,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: enabled ? 'rgba(167, 139, 250, 0.72)' : 'rgba(255, 255, 255, 0.12)',
  padding: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: enabled ? 'flex-end' : 'flex-start',
})

const switchKnobStyle = (enabled: boolean): React.CSSProperties => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: enabled ? '#f8fafc' : 'rgba(255, 255, 255, 0.76)',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
})
