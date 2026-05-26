import { Camera } from 'lucide-react';

interface HomeViewProps {
  onScanClick: () => void;
  onHostClick: () => void;
  onJoinClick: () => void;
}

export function HomeView({ onScanClick, onHostClick, onJoinClick }: HomeViewProps) {
  return (
    <div className="flex flex-col items-center justify-between h-full space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      <button
        onClick={onScanClick}
        className="relative w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full liquid-glass-card flex flex-col items-center justify-center gap-2 group cursor-pointer border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.35)] animate-float"
      >
        <div className="absolute inset-1.5 rounded-full border border-white/10" />

        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-inner">
          <Camera className="w-5.5 h-5.5" />
        </div>

        <div className="text-center">
          <span className="block font-bold text-xs text-white tracking-wide">Escanear QR</span>
          <span className="text-[9px] text-white/40 leading-snug block mt-0.5">Conexão instantânea</span>
        </div>
      </button>

      <div className="text-center space-y-1 mt-2">
        <h2 className="text-base sm:text-lg font-bold text-white/90">Envio P2P Líquido</h2>
        <p className="text-white/35 text-[11px] sm:text-xs leading-relaxed max-w-[320px] mx-auto">
          Envie arquivos diretamente entre navegadores, sem limites e sem armazenamento em nuvem.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full pt-4">
        <button
          onClick={onHostClick}
          className="liquid-glass-button py-3.5 text-xs font-semibold text-center hover:bg-white/5 transition-colors cursor-pointer"
        >
          Criar Sala
        </button>

        <button
          onClick={onJoinClick}
          className="liquid-glass-button py-3.5 text-xs font-semibold text-center hover:bg-white/5 transition-colors cursor-pointer"
        >
          Digitar Código
        </button>
      </div>
    </div>
  );
}
