import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { playBubbleSound } from '../../lib/audio';

interface HostViewProps {
  peerId: string | null;
  onCancel: () => void;
  showToast: (message: string, type: 'info' | 'success' | 'error') => void;
}

export function HostView({ peerId, onCancel, showToast }: HostViewProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!peerId) return;
    navigator.clipboard.writeText(peerId);
    setCopied(true);
    showToast('Código copiado!', 'success');
    playBubbleSound();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-between h-full space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-0.5">
        <h2 className="text-sm sm:text-base font-bold text-white">Aguardando Conexão</h2>
        <p className="text-white/40 text-[11px]">Aponte a câmera do outro dispositivo para este código.</p>
      </div>

      {peerId ? (
        <div className="space-y-6 flex flex-col items-center w-full">
          <div className="relative p-3.5 sm:p-4 bg-white rounded-3xl shadow-[0_20px_45px_rgba(0,0,0,0.45)] border border-white/30 overflow-hidden">
            {/* Specular sheen over the white QR code square */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none z-10" />
            <QRCodeSVG
              value={peerId}
              size={200}
              level="H"
              includeMargin={false}
              className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 relative z-0"
            />
          </div>

          <div className="w-full space-y-3">
            <div className="flex gap-1 sm:gap-2 justify-center">
              {peerId.toUpperCase().split('').map((char, index) => {
                // Alternating bubble-wobble classes to create asynchronous liquid motion
                const animationClass = index % 3 === 0
                  ? "animate-wobble-slow-1"
                  : index % 3 === 1
                    ? "animate-wobble-slow-2"
                    : "animate-wobble-slow-3";
                return (
                  <div
                    key={index}
                    className={cn(
                      "w-8 h-11 sm:w-10 sm:h-13 rounded-2xl flex items-center justify-center font-mono text-lg sm:text-xl font-extrabold text-sky-200 border border-white/20 bg-white/10 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.35),0_4px_10px_rgba(0,0,0,0.25)] relative overflow-hidden",
                      animationClass
                    )}
                  >
                    {/* Inner specular reflection overlay inside bubble */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                    <span className="relative z-10">{char}</span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={copyCode}
              className={cn(
                "liquid-glass-button px-5 py-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mx-auto transition-all duration-300 shadow-md rounded-full",
                copied ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "",
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300 animate-in zoom-in-50" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-white/60" /> Copiar Código
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-sky-400 rounded-full animate-spin" />
        </div>
      )}

      <button
        onClick={onCancel}
        className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 text-white/50 hover:text-white/80 transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-3 h-3" /> Cancelar
      </button>
    </div>
  );
}
