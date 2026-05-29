import * as Sentry from '@sentry/react'

export interface ErrorTrackingConfig {
  dsn: string
  environment: string
  release?: string
  tracesSampleRate?: number
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
}

export function initErrorTracking(config: ErrorTrackingConfig): void {
  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    replaysSessionSampleRate: config.replaysSessionSampleRate ?? 0,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate ?? 1.0,
  })
}

export function setSentryUser(publicKey: string | null): void {
  if (publicKey) {
    Sentry.setUser({ id: publicKey })
  } else {
    Sentry.setUser(null)
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context)
    }
    if (error instanceof Error) {
      Sentry.captureException(error)
    } else {
      Sentry.captureException(new Error(String(error)))
    }
  })
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'error'): void {
  Sentry.captureMessage(message, level)
}

export function getSentryReportDialogUrl(eventId: string): string {
  return `https://o${eventId}/ingest/`
}

export { Sentry }
