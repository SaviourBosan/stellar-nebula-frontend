import { Outlet } from 'react-router-dom'
import Navigation from '../components/Navigation'
import LoadingScreen from '../components/Loading/LoadingScreen'
import { useWallet } from '../contexts'

function AppLayout() {
  const { isReconnecting } = useWallet()

  if (isReconnecting) {
    return (
      <LoadingScreen
        stageLabel="Restoring mission link"
        message="Reconnecting secure wallet session..."
        progress={68}
      />
    )
  }

  return (
    <div className="app-shell">
      <Navigation />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
