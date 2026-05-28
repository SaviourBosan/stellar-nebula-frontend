import { Outlet } from 'react-router-dom'
import Navigation from '../components/Navigation'

function AppLayout() {
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
