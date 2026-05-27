import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { NebulaCanvas } from './components/Canvas'
import ErrorBoundary from './components/ErrorBoundary'
import { WalletProvider } from './contexts/WalletContext'
import { WalletDisplay } from './components/Wallet'
import { ConnectModal } from './components/Wallet'
import { isDev } from './config'
import './App.css'

function AppInner() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div style={{ width: '100vw', height: '100vh' }}>
        <NebulaCanvas showFps={isDev} />
      </div>

      {/* Wallet HUD — top-right overlay */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        <WalletDisplay onOpenConnectModal={() => setModalOpen(true)} />
      </div>

      <ConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

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
    </>
  )
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
