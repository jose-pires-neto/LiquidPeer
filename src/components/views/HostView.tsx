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
    <div className="flex flex-col items-center justify-between h-full space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-0.5">
        <h2 className="text-sm font-bold text-white">Aguardando Conexão</h2>
        <p className="text-white/40 text-[10px]">Aponte a câmera do outro dispositivo para este código.</p>
      </div>

      {peerId ? (
        <div className="space-y-6 flex flex-col items-center w-full">
          <div className="p-3 bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/20">
            <QRCodeSVG
              value={peerId}
              size={120}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="w-full space-y-3">
            <div className="flex gap-1.5 justify-center">
              {peerId.toUpperCase().split('').map((char, index) => (
                <div
                  key={index}
                  className="w-9 h-12 rounded-xl flex items-center justify-center font-mono text-xl font-extrabold text-sky-300 border border-white/10 bg-white/[0.02] shadow-inner"
                >
                  {char}
                </div>
              ))}
            </div>

            <button
              onClick={copyCode}
              className={cn(
                "liquid-glass-button px-4 py-2 flex items-center gap-1.5 text-[10px] mx-auto cursor-pointer",
                copied ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "",
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400 animate-in zoom-in-50" /> Copiado
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
        className="text-[10px] text-white/40 hover:text-white/80 flex items-center gap-1 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Cancelar
      </button>
    </div>
  );
}
