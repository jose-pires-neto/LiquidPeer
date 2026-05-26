import { Smartphone, Laptop } from 'lucide-react';
import type { FileTransfer } from '../../types';
import { cn } from '../../lib/utils';

interface ConnectionTubeProps {
  activeTransfer?: FileTransfer;
  isSending: boolean;
}

export function ConnectionTube({ activeTransfer, isSending }: ConnectionTubeProps) {
  return (
    <div className="flex items-center justify-between w-full px-3 py-3 sm:px-4 sm:py-3.5 liquid-glass-card border border-white/5">
      <div className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
          <Smartphone className="w-5.5 h-5.5 text-white/70" />
        </div>
        <span className="text-[10px] font-bold text-white/50 tracking-wider">Meu Device</span>
      </div>

      <div className="flex-1 px-3 relative flex items-center justify-center">
        <div className="relative h-4.5 w-full rounded-full bg-black/45 border border-white/10 shadow-[inset_0_1.5px_4px_rgba(0,0,0,0.7)] overflow-hidden flex items-center">
          <div
            className={cn(
              "absolute top-0 bottom-0 bg-sky-500/15 blur-[1.5px] transition-all duration-500",
              activeTransfer ? "w-full" : "w-0",
            )}
          />

          {activeTransfer && (
            <div className="absolute inset-0 pointer-events-none">
              {isSending ? (
                <>
                  <div className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-sky-300/90 shadow-[0_0_6px_#38bdf8] animate-bubble-right-1 -translate-y-1/2" />
                  <div className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white/95 shadow-[0_0_8px_#ffffff] animate-bubble-right-2 -translate-y-1/2" />
                  <div className="absolute top-1/2 w-1 h-1 rounded-full bg-sky-200/80 shadow-[0_0_4px_#7dd3fc] animate-bubble-right-3 -translate-y-1/2" />
                </>
              ) : (
                <>
                  <div className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-sky-300/90 shadow-[0_0_6px_#38bdf8] animate-bubble-left-1 -translate-y-1/2" />
                  <div className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white/95 shadow-[0_0_8px_#ffffff] animate-bubble-left-2 -translate-y-1/2" />
                  <div className="absolute top-1/2 w-1 h-1 rounded-full bg-sky-200/80 shadow-[0_0_4px_#7dd3fc] animate-bubble-left-3 -translate-y-1/2" />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
          <Laptop className="w-5.5 h-5.5 text-white/70" />
        </div>
        <span className="text-[10px] font-bold text-white/50 tracking-wider">Remoto</span>
      </div>
    </div>
  );
}
