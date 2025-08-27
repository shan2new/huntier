import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        classNames: {
          toast: 'bg-card text-card-foreground border shadow-sm',
          error: 'text-destructive',
        },
      }}
    />
  )
}

export const toast = Object.assign(sonnerToast, {
  error: (msg: string, opts?: any) => sonnerToast.error(msg, opts),
  success: (msg: string, opts?: any) => sonnerToast.success(msg, opts),
  info: (msg: string, opts?: any) => sonnerToast.info(msg, opts),
})

export default Toaster


