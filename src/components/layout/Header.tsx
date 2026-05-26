import { Share2 } from 'lucide-react';
import type { PeerState } from '../../types';
import { cn } from '../../lib/utils';

interface HeaderProps {
  peerState: PeerState;
  onDisconnect: () => void;
  onLogoClick: () => void;
}

export function Header({ peerState, onDisconnect, onLogoClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={onLogoClick}
        role="button"
      >
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
          <Share2 className="text-sky-300 w-4.5 h-4.5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">LiquidPeer</h1>
          <p className="text-[9px] text-white/30 font-medium">Compartilhamento Líquido</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.02]">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all duration-300",
              peerState === 'connected'
                ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"
                : peerState === 'connecting'
                  ? "bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse"
                  : peerState === 'error'
                    ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]"
                    : "bg-white/20",
            )}
          />
          <span className="text-[9px] font-semibold text-white/60 tracking-wide uppercase">
            {peerState === 'connected'
              ? 'Conectado'
              : peerState === 'connecting'
                ? 'Buscando...'
                : peerState === 'error'
                  ? 'Erro'
                  : 'Offline'}
          </span>
        </div>

        {peerState === 'connected' && (
          <button
            onClick={onDisconnect}
            className="text-[9px] font-semibold text-white/45 hover:text-rose-300 bg-white/5 hover:bg-rose-500/10 px-2 py-1 rounded-md border border-white/5 transition-all cursor-pointer"
          >
            Sair
          </button>
        )}
      </div>
    </header>
  );
}
