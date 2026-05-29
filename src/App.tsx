import { RouterProvider } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { WalletProvider } from './contexts/WalletContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { router } from './routes'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <WalletProvider>
          <RouterProvider router={router} />
        </WalletProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
