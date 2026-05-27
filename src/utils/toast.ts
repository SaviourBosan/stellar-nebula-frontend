import toast from 'react-hot-toast'
import type { Toast, ToastOptions } from 'react-hot-toast'

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'bottom-right',
}

export function showSuccess(message: string, options?: ToastOptions): string {
  return toast.success(message, { ...defaultOptions, ...options })
}

export function showError(message: string, options?: ToastOptions): string {
  return toast.error(message, { ...defaultOptions, ...options })
}

export function showLoading(message: string, options?: ToastOptions): string {
  return toast.loading(message, { ...defaultOptions, ...options })
}

export function dismissToast(toastId?: string): void {
  toast.dismiss(toastId)
}

export function updateToast(
  toastId: string,
  options: Partial<Pick<Toast, 'message' | 'type'>> & ToastOptions
): void {
  toast(toastId, { ...defaultOptions, ...options })
}
