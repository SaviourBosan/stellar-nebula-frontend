import { RouterProvider } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { WalletProvider } from './contexts/WalletContext'
import { router } from './routes'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <WalletProvider>
        <RouterProvider router={router} />
      </WalletProvider>
    </ErrorBoundary>
  )
}

export default App
