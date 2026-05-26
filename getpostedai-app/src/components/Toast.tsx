import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

let toastListeners: ((state: ToastState) => void)[] = []
let toastState: ToastState = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
}

function notifyListeners() {
  toastListeners.forEach((listener) => listener(toastState))
}

export function addToast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).substring(2, 9)
  const newToast: ToastItem = { id, message, type }
  toastState = {
    ...toastState,
    toasts: [...toastState.toasts, newToast],
  }
  notifyListeners()

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    removeToast(id)
  }, 4000)
}

export function removeToast(id: string) {
  toastState = {
    ...toastState,
    toasts: toastState.toasts.filter((t) => t.id !== id),
  }
  notifyListeners()
}

export function useToast(): ToastState {
  const [state, setState] = useState<ToastState>(toastState)

  useEffect(() => {
    toastListeners.push(setState)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setState)
    }
  }, [])

  const addToastWrapped = useCallback((message: string, type: ToastType = 'info') => {
    addToast(message, type)
  }, [])

  const removeToastWrapped = useCallback((id: string) => {
    removeToast(id)
  }, [])

  return {
    ...state,
    addToast: addToastWrapped,
    removeToast: removeToastWrapped,
  }
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-[#00ff88]" />,
  error: <AlertCircle className="w-4 h-4 text-[#ff3366]" />,
  info: <Info className="w-4 h-4 text-[#00ccff]" />,
}

const toastBorderColors: Record<ToastType, string> = {
  success: 'border-l-[#00ff88]',
  error: 'border-l-[#ff3366]',
  info: 'border-l-[#00ccff]',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-[#0a0a0a] border-l-[3px] ${toastBorderColors[toast.type]} shadow-lg min-w-[280px]`}
          >
            {toastIcons[toast.type]}
            <span className="text-sm text-[#cccccc] flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#555555] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
