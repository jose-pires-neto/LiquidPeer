import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, X, Share2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { playBubbleSound } from '../../lib/audio';
import { RoomCodeDisplay } from '../layout/RoomCodeDisplay';

interface ShareRoomModalProps {
  peerId: string;
  onClose: () => void;
  showToast: (message: string, type: 'info' | 'success' | 'error') => void;
}

export function ShareRoomModal({ peerId, onClose, showToast }: ShareRoomModalProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${peerId}`;

  const handleInvite = async () => {
    playBubbleSound();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LiquidPeer',
          text: 'Entre na minha sala no LiquidPeer para compartilharmos arquivos em tempo real!',
          url: shareUrl,
        });
        showToast('Link compartilhado com sucesso!', 'success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await fallbackCopyLink();
        }
      }
    } else {
      await fallbackCopyLink();
    }
  };

  const fallbackCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast('Link de convite copiado!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Não foi possível copiar. Copie o link manualmente.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050814]/80 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Volumetric glassmorphic card */}
      <div className="relative w-full max-w-xs sm:max-w-sm p-6 sm:p-8 rounded-[28px] bg-white/[0.02] border border-white/10 text-center flex flex-col items-center gap-5 overflow-hidden backdrop-blur-md shadow-[0_24px_70px_rgba(0,0,0,0.65),inset_0_1px_1.5px_rgba(255,255,255,0.25)] animate-in zoom-in-95 duration-300">
        
        {/* Specular sheen reflection highlights */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent pointer-events-none" />
        <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white/90 hover:bg-white/10 transition-all cursor-pointer z-20 shadow-sm"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-0.5 mt-2">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">Convidar Participantes</h2>
          <p className="text-white/40 text-[10px] sm:text-[11px] leading-relaxed px-2">
            Escaneie o QR Code ou compartilhe o link para adicionar até 6 dispositivos nesta sala.
          </p>
        </div>

        {/* Gloss-sheened white QR code container */}
        <div className="relative p-3.5 sm:p-4 bg-white rounded-3xl shadow-[0_20px_45px_rgba(0,0,0,0.45)] border border-white/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none z-10" />
          <QRCodeSVG
            value={shareUrl}
            size={180}
            level="H"
            includeMargin={false}
            className="w-28 h-28 sm:w-32 sm:h-32 relative z-0"
          />
        </div>

        {/* Code display with staggered wobbly soap-bubbles */}
        <div className="w-full space-y-3 mt-1">
          <RoomCodeDisplay code={peerId} />

          {/* Copy/Share Link Button */}
          <button
            onClick={handleInvite}
            className={cn(
              "liquid-glass-button px-5 py-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider mx-auto transition-all duration-300 shadow-md rounded-full mt-2",
              copied ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "",
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-300 animate-in zoom-in-50" /> Link Copiado
              </>
            ) : (
              <>
                <Share2 className="w-3 h-3 text-white/60 animate-pulse" /> Convidar Amigos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
