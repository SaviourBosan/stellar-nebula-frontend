import { Toaster } from 'react-hot-toast'
import { NebulaCanvas } from './components/Canvas'
import ErrorBoundary from './components/ErrorBoundary'
import { isDev } from './config'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh' }}>
        <NebulaCanvas showFps={isDev} />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: 8,
            background: '#1a1a1a',
            color: 'rgba(255, 255, 255, 0.87)',
            border: '1px solid rgba(100, 108, 255, 0.3)',
          },
          success: {
            iconTheme: { primary: '#646cff', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ff4444', secondary: '#fff' },
          },
        }}
      />
    </ErrorBoundary>
  )
}

export default App
