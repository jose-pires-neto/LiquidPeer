import { useState } from 'react';
import { Smartphone, Laptop, ArrowRightLeft } from 'lucide-react';
import type { FileTransfer } from '../../types';
import { cn } from '../../lib/utils';

interface ConnectionTubeProps {
  activeTransfer?: FileTransfer;
  isSending: boolean;
  transfers?: FileTransfer[];
}

export function ConnectionTube({ activeTransfer, isSending, transfers = [] }: ConnectionTubeProps) {
  const [isLocalMobile] = useState(() => 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );

  // Count active transfers in each direction
  const activeSendingCount = transfers.filter(
    t => t.direction === 'sending' && (t.status === 'transferring' || t.status === 'pending')
  ).length;

  const activeReceivingCount = transfers.filter(
    t => t.direction === 'receiving' && (t.status === 'transferring' || t.status === 'pending')
  ).length;

  // Calculate bubble sizes dynamically (base 90px, add 14px per queued file, max 146px)
  const localBubbleSize = Math.min(92 + activeSendingCount * 14, 146);
  const remoteBubbleSize = Math.min(92 + activeReceivingCount * 14, 146);

  // Extract progress levels
  const isTransferring = activeTransfer && activeTransfer.status === 'transferring';
  const localProgress = isTransferring && isSending ? Math.round(activeTransfer.progress) : 0;
  const remoteProgress = isTransferring && !isSending ? Math.round(activeTransfer.progress) : 0;

  return (
    <div className="min-h-[220px] sm:min-h-[250px] w-full flex flex-col justify-center items-center relative rounded-3xl p-4 sm:p-6 bg-white/[0.01] border border-white/10 overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.4),inset_0_1px_1.5px_rgba(255,255,255,0.15)] backdrop-blur-xl">
      {/* Liquid background accent blobs for depth */}
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

      {/* Bubble Row */}
      <div className="flex items-center justify-between w-full relative z-10 px-2 sm:px-6 md:px-8">
        
        {/* Local Device Bubble (Você) */}
        <div className="flex flex-col items-center gap-2.5">
          <div
            className="rounded-full liquid-soap-bubble animate-wobble-slow-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 select-none border border-white/20"
            style={{ width: `${localBubbleSize}px`, height: `${localBubbleSize}px` }}
          >
            {/* Liquid Wave Progress Overlay */}
            {localProgress > 0 && (
              <div
                className="absolute bottom-0 left-0 right-0 bg-sky-400/25 transition-all duration-300 pointer-events-none"
                style={{ height: `${localProgress}%` }}
              >
                {/* Rotating wave effect surface */}
                <div className="absolute top-0 left-1/2 w-[220%] h-[220%] bg-sky-300/15 rounded-[38%] -translate-y-[88%] animate-wave-spin pointer-events-none" />
              </div>
            )}

            {/* Inner Content */}
            <div className="relative z-10 flex flex-col items-center gap-1 text-center">
              {isLocalMobile ? (
                <Smartphone className="w-6 h-6 text-sky-200 opacity-80" />
              ) : (
                <Laptop className="w-6 h-6 text-sky-200 opacity-80" />
              )}
              {localProgress > 0 ? (
                <span className="text-[10px] font-black text-white tracking-wide animate-pulse">
                  {localProgress}%
                </span>
              ) : (
                <span className="text-[9px] font-bold text-white/50 tracking-wider uppercase">
                  Você
                </span>
              )}
            </div>
          </div>
          
          {/* Active Queue indicator */}
          {activeSendingCount > 0 && (
            <span className="text-[8px] font-extrabold text-sky-300 bg-sky-500/10 border border-sky-400/20 px-2 py-0.5 rounded-full animate-bounce">
              {activeSendingCount} na fila
            </span>
          )}
        </div>

        {/* Connective Channel (Particle flow space) */}
        <div className="flex-1 min-w-[60px] sm:min-w-[100px] h-12 relative flex items-center justify-center">
          {/* Subtle connecting stream line */}
          <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-sky-500/5 via-sky-500/25 to-sky-500/5 blur-[0.5px]" />
          
          {/* Flow Indicator Icon */}
          <div className={cn(
            "w-7 h-7 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center shadow-inner relative z-10 transition-transform duration-500",
            isTransferring ? "animate-pulse" : ""
          )}>
            <ArrowRightLeft className={cn(
              "w-3.5 h-3.5 text-sky-300/60 transition-transform duration-500",
              isTransferring && isSending ? "rotate-180 text-sky-300" : "",
              isTransferring && !isSending ? "text-cyan-300" : ""
            )} />
          </div>

          {/* Flowing Iridescent Particles */}
          {isTransferring && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className={cn(
                "iridescent-bubble w-3 h-3 top-1",
                isSending ? "animate-bubble-right-1" : "animate-bubble-left-1"
              )} />
              <div className={cn(
                "iridescent-bubble w-4 h-4 top-4.5",
                isSending ? "animate-bubble-right-2" : "animate-bubble-left-2"
              )} />
              <div className={cn(
                "iridescent-bubble w-2 h-2 top-8",
                isSending ? "animate-bubble-right-3" : "animate-bubble-left-3"
              )} />
            </div>
          )}
        </div>

        {/* Remote Device Bubble (Par) */}
        <div className="flex flex-col items-center gap-2.5">
          <div
            className="rounded-full liquid-soap-bubble animate-wobble-slow-3 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 select-none border border-white/20"
            style={{ width: `${remoteBubbleSize}px`, height: `${remoteBubbleSize}px` }}
          >
            {/* Liquid Wave Progress Overlay */}
            {remoteProgress > 0 && (
              <div
                className="absolute bottom-0 left-0 right-0 bg-sky-400/25 transition-all duration-300 pointer-events-none"
                style={{ height: `${remoteProgress}%` }}
              >
                {/* Rotating wave effect surface */}
                <div className="absolute top-0 left-1/2 w-[220%] h-[220%] bg-sky-300/15 rounded-[38%] -translate-y-[88%] animate-wave-spin pointer-events-none" />
              </div>
            )}

            {/* Inner Content */}
            <div className="relative z-10 flex flex-col items-center gap-1 text-center">
              {/* Default laptop for peer, showing smartphone if we prefer variety */}
              {isLocalMobile ? (
                <Laptop className="w-6 h-6 text-sky-200 opacity-80" />
              ) : (
                <Smartphone className="w-6 h-6 text-sky-200 opacity-80" />
              )}
              {remoteProgress > 0 ? (
                <span className="text-[10px] font-black text-white tracking-wide animate-pulse">
                  {remoteProgress}%
                </span>
              ) : (
                <span className="text-[9px] font-bold text-white/50 tracking-wider uppercase">
                  Par
                </span>
              )}
            </div>
          </div>

          {/* Active Queue indicator */}
          {activeReceivingCount > 0 && (
            <span className="text-[8px] font-extrabold text-sky-300 bg-sky-500/10 border border-sky-400/20 px-2 py-0.5 rounded-full animate-bounce">
              {activeReceivingCount} na fila
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
