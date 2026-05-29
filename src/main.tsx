import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './styles/base.css'
import App from './App.tsx'
import { initErrorTracking } from './services/errorTracking'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
if (SENTRY_DSN) {
  initErrorTracking({
    dsn: SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV ?? 'development',
    release: import.meta.env.VITE_APP_VERSION || undefined,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An unexpected error occurred.</p>}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
)
