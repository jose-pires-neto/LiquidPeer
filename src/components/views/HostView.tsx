import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { playBubbleSound } from '../../lib/audio';
import { RoomCodeDisplay } from '../layout/RoomCodeDisplay';

interface HostViewProps {
  peerId: string | null;
  onCancel: () => void;
  showToast: (message: string, type: 'info' | 'success' | 'error') => void;
}

export function HostView({ peerId, onCancel, showToast }: HostViewProps) {
  const [copied, setCopied] = useState(false);

  // Full invite URL so external camera apps open the room directly
  const shareUrl = peerId
    ? `${window.location.origin}${window.location.pathname}?room=${peerId}`
    : '';

  const copyCode = async () => {
    if (!peerId) return;
    try {
      await navigator.clipboard.writeText(peerId);
      setCopied(true);
      showToast('Código copiado!', 'success');
      playBubbleSound();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Não foi possível copiar. Copie o código manualmente.', 'error');
    }
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
              value={shareUrl}
              size={200}
              level="H"
              includeMargin={false}
              className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 relative z-0"
            />
          </div>

          <div className="w-full space-y-3">
            <RoomCodeDisplay code={peerId} />

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
