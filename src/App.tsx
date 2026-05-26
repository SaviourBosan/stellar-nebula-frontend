import { NebulaCanvas } from './components/Canvas'
import { isDev } from './config'
import './App.css'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <NebulaCanvas showFps={isDev} />
    </div>
  )
}

export default App
