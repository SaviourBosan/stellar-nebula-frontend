type WSStatus = 'connecting' | 'open' | 'closed' | 'error'

type Handler = (payload: any) => void

export interface WebSocketManagerOptions {
  reconnectInitialDelay?: number
  reconnectMaxDelay?: number
  heartbeatIntervalMs?: number
}

export class WebSocketManager {
  private url: string
  private ws: WebSocket | null = null
  private status: WSStatus = 'closed'
  private reconnectDelay: number
  private reconnectMaxDelay: number
  private shouldReconnect = true
  private subscriptions = new Map<string, Set<Handler>>()
  private heartbeatTimer: number | null = null
  private heartbeatIntervalMs: number

  constructor(url: string, opts: WebSocketManagerOptions = {}) {
    this.url = url
    this.reconnectDelay = opts.reconnectInitialDelay ?? 1000
    this.reconnectMaxDelay = opts.reconnectMaxDelay ?? 30000
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs ?? 30000
  }

  connect() {
    if (this.ws && (this.status === 'connecting' || this.status === 'open')) return
    this.status = 'connecting'
    this.ws = new WebSocket(this.url)

    this.ws.addEventListener('open', () => {
      this.status = 'open'
      this.reconnectDelay = 1000
      this.startHeartbeat()
    })

    this.ws.addEventListener('message', (ev) => this.handleMessage(ev.data))

    this.ws.addEventListener('close', () => {
      this.status = 'closed'
      this.stopHeartbeat()
      if (this.shouldReconnect) this.scheduleReconnect()
    })

    this.ws.addEventListener('error', (err) => {
      this.status = 'error'
      // keep socket around so close handler can run and schedule reconnect
      console.error('WebSocket error', err)
    })
  }

  private startHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatTimer = window.setInterval(() => {
      if (this.ws && this.status === 'open') {
        try {
          this.ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }))
        } catch (e) {
          /* ignore */
        }
      }
    }, this.heartbeatIntervalMs)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private scheduleReconnect() {
    const delay = this.reconnectDelay
    this.reconnectDelay = Math.min(this.reconnectMaxDelay, Math.floor(this.reconnectDelay * 1.8))
    setTimeout(() => this.connect(), delay)
  }

  private handleMessage(raw: any) {
    let data: any = raw
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch (e) {
      /* ignore */
    }
    const type = data?.type ?? 'message'
    // publish to subscribers for the exact type and wildcard '*'
    this.publish(type, data)
    this.publish('*', data)
  }

  private publish(event: string, payload: any) {
    const set = this.subscriptions.get(event)
    if (!set) return
    for (const h of Array.from(set)) {
      try {
        h(payload)
      } catch (e) {
        console.error('WebSocket handler error', e)
      }
    }
  }

  subscribe(event: string, handler: Handler) {
    if (!this.subscriptions.has(event)) this.subscriptions.set(event, new Set())
    this.subscriptions.get(event)!.add(handler)
    return () => this.unsubscribe(event, handler)
  }

  unsubscribe(event: string, handler: Handler) {
    const set = this.subscriptions.get(event)
    if (!set) return
    set.delete(handler)
    if (set.size === 0) this.subscriptions.delete(event)
  }

  subscribeToAccount(accountId: string) {
    this.send({ action: 'subscribe', topic: 'account', account: accountId })
  }

  subscribeToContract(contractId: string) {
    this.send({ action: 'subscribe', topic: 'contract', contract: contractId })
  }

  send(obj: any) {
    if (!this.ws || this.status !== 'open') return
    try {
      this.ws.send(typeof obj === 'string' ? obj : JSON.stringify(obj))
    } catch (e) {
      console.error('send failed', e)
    }
  }

  close() {
    this.shouldReconnect = false
    this.stopHeartbeat()
    if (this.ws) {
      try {
        this.ws.close()
      } catch (e) {
        /* ignore */
      }
    }
  }

  getStatus() {
    return this.status
  }
}

export default WebSocketManager
