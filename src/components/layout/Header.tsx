import type { PeerState } from '../../types';
import { cn } from '../../lib/utils';

interface HeaderProps {
  peerState: PeerState;
  onDisconnect: () => void;
  onLogoClick: () => void;
  onInviteClick?: () => void;
}

export function Header({ peerState, onDisconnect, onLogoClick, onInviteClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-4 pb-3 sm:mb-6 sm:pb-4 border-b border-white/5">
      <div
        className="flex items-center cursor-pointer"
        onClick={onLogoClick}
        role="button"
      >
        {/* Tiny glassy soap bubble containing the app logo image */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full liquid-soap-bubble flex items-center justify-center animate-wobble-slow-1 shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
          <img src="/favicon.svg" alt="LiquidPeer Logo" className="w-5.5 h-5.5 object-contain opacity-85 select-none pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Volumetric glass status pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.03] shadow-[0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_1.5px_rgba(255,255,255,0.25)] backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
          <span
            className={cn(
               "w-1.5 h-1.5 rounded-full transition-all duration-300",
              peerState === 'connected'
                ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"
                : peerState === 'connecting'
                  ? "bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse"
                  : peerState === 'error'
                    ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]"
                    : "bg-white/25",
            )}
          />
          <span className="text-[9px] font-bold text-white/70 tracking-wider uppercase select-none">
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
          <div className="flex items-center gap-1.5 animate-in fade-in duration-300">
            {onInviteClick && (
              <button
                onClick={onInviteClick}
                className="text-[9px] font-bold text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 rounded-lg border border-sky-400/20 hover:border-sky-400/30 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              >
                Convidar
              </button>
            )}
            <button
              onClick={onDisconnect}
              className="text-[9px] font-bold text-white/55 hover:text-rose-300 bg-white/5 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-rose-500/20 transition-all cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
