import { env } from '../config'

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  status: number
}

export interface ApiError {
  message: string
  status: number
  code?: string
}

export interface ApiRequestConfig extends RequestInit {
  url: string
  retries?: number
}

type RequestInterceptor = (config: ApiRequestConfig) => ApiRequestConfig | Promise<ApiRequestConfig>

type ResponseInterceptor = (response: Response) => Response | Promise<Response>

const requestInterceptors: RequestInterceptor[] = []
const responseInterceptors: ResponseInterceptor[] = []

export function addRequestInterceptor(interceptor: RequestInterceptor): () => void {
  requestInterceptors.push(interceptor)
  return () => {
    const index = requestInterceptors.indexOf(interceptor)
    if (index >= 0) {
      requestInterceptors.splice(index, 1)
    }
  }
}

export function addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
  responseInterceptors.push(interceptor)
  return () => {
    const index = responseInterceptors.indexOf(interceptor)
    if (index >= 0) {
      responseInterceptors.splice(index, 1)
    }
  }
}

function buildUrl(path: string): string {
  const base = env.API_BASE_URL.replace(/\/+$/, '')
  const cleanPath = path.replace(/^\/+/, '')
  return `${base}/${cleanPath}`
}

async function executeFetch(
  url: string,
  config: ApiRequestConfig,
  retries: number,
  signal: AbortSignal
): Promise<Response> {
  let lastError: Error | null = null
  let delay = 1000

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2
    }

    try {
      const response = await fetch(url, { ...config, signal })
      return response
    } catch (error) {
      if (signal.aborted) throw error
      lastError = error instanceof Error ? error : new Error('Network request failed')
    }
  }

  throw lastError ?? new Error('Request failed after retries')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = 2
): Promise<ApiResponse<T>> {
  let config: ApiRequestConfig = { ...options, url: path, retries }

  for (const interceptor of requestInterceptors) {
    const result = interceptor(config)
    config = result instanceof Promise ? await result : result
  }

  const finalUrl = config.url

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), env.API_TIMEOUT_MS)

  try {
    let response = await executeFetch(buildUrl(finalUrl), config, retries, controller.signal)

    for (const interceptor of responseInterceptors) {
      response = await interceptor(response)
    }

    let data: T | null = null
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      data = (await response.json()) as T
    }

    if (!response.ok) {
      return {
        data: null,
        error: {
          message:
            (data as Record<string, string> | null)?.message ??
            `Request failed with status ${response.status}`,
          status: response.status,
          code: String(response.status),
        },
        status: response.status,
      }
    }

    return { data, error: null, status: response.status }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        data: null,
        error: { message: 'Request timed out', status: 408, code: 'TIMEOUT' },
        status: 408,
      }
    }
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        status: 0,
        code: 'NETWORK_ERROR',
      },
      status: 0,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export function get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return request<T>(path, { ...options, method: 'GET' })
}

export function post<T>(
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  return request<T>(path, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers } as HeadersInit,
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

export function put<T>(
  path: string,
  body?: unknown,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  return request<T>(path, {
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers } as HeadersInit,
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

export function del<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  return request<T>(path, { ...options, method: 'DELETE' })
}
