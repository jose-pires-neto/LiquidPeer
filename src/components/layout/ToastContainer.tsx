import type { Toast } from '../../types';
import { cn } from '../../lib/utils';

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="absolute top-6 right-6 z-55 flex flex-col gap-2.5 max-w-xs w-full pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={cn(
            "px-4 py-3 rounded-2xl backdrop-blur-xl border flex items-center gap-2.5 shadow-lg pointer-events-auto animate-in slide-in-from-top-4 duration-300",
            toast.type === 'success'
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : toast.type === 'error'
                ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                : "bg-white/5 border-white/10 text-white/90",
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              toast.type === 'success'
                ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                : toast.type === 'error'
                  ? "bg-rose-400 shadow-[0_0_6px_#fb7185]"
                  : "bg-sky-400 shadow-[0_0_6px_#38bdf8]",
            )}
          />
          <span className="text-[11px] font-bold tracking-wide">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
