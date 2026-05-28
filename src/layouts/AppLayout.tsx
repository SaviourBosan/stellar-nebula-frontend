import { Outlet } from 'react-router-dom'
import Navigation from '../components/Navigation'
import { Footer } from '../components/Layout'

function AppLayout() {
  return (
    <div className="app-shell">
      <Navigation />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default AppLayout
