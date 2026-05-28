function toBase64(arr: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(arr)))
}
function fromBase64(s: string) {
  const bin = atob(s)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

async function deriveAesKeyFromPassphrase(passphrase: string) {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-256', enc.encode(passphrase))
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export interface StorageOptions {
  encryptionKey?: string // passphrase (optional)
  version?: number
  validate?: (v: any) => boolean
}

export class StorageManager {
  private prefix: string
  private opts: StorageOptions
  private aesKeyPromise: Promise<CryptoKey | null>

  constructor(prefix = 'app:', opts: StorageOptions = {}) {
    this.prefix = prefix
    this.opts = opts
    this.aesKeyPromise = opts.encryptionKey
      ? deriveAesKeyFromPassphrase(opts.encryptionKey)
      : Promise.resolve(null)
  }

  private key(k: string) {
    return `${this.prefix}${k}`
  }

  async set<T>(k: string, value: T) {
    const payload = { v: value, __v: this.opts.version ?? 1 }
    let data = JSON.stringify(payload)
    const aes = await this.aesKeyPromise
    if (aes) {
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const enc = new TextEncoder().encode(data)
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, enc)
      const store = { encrypted: true, iv: toBase64(iv.buffer), data: toBase64(ct) }
      localStorage.setItem(this.key(k), JSON.stringify(store))
      return
    }
    localStorage.setItem(this.key(k), data)
  }

  async get<T>(k: string): Promise<T | null> {
    const raw = localStorage.getItem(this.key(k))
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.encrypted && parsed.iv && parsed.data) {
        const aes = await this.aesKeyPromise
        if (!aes) throw new Error('encrypted value but no key provided')
        const iv = new Uint8Array(fromBase64(parsed.iv))
        const ct = fromBase64(parsed.data)
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aes, ct)
        const text = new TextDecoder().decode(plain)
        const payload = JSON.parse(text)
        if (this.opts.validate && !this.opts.validate(payload.v)) return null
        return payload.v as T
      }
      // unencrypted
      const payload = JSON.parse(raw)
      if (payload && payload.v !== undefined) {
        if (this.opts.validate && !this.opts.validate(payload.v)) return null
        return payload.v as T
      }
      // legacy raw value
      return payload as T
    } catch (e) {
      console.error('Storage get error', e)
      return null
    }
  }

  remove(k: string) {
    localStorage.removeItem(this.key(k))
  }

  async migrate<T>(k: string, transform: (oldValue: any) => T) {
    const raw = localStorage.getItem(this.key(k))
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      const old = parsed && parsed.v !== undefined ? parsed.v : parsed
      const next = transform(old)
      await this.set(k, next)
    } catch (e) {
      console.error('migrate failed', e)
    }
  }
}

export default StorageManager
