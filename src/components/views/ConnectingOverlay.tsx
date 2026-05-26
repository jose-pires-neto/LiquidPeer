import { Share2, ArrowLeft } from 'lucide-react';

interface ConnectingOverlayProps {
  connectionStage: string;
  onCancel: () => void;
}

export function ConnectingOverlay({ connectionStage, onCancel }: ConnectingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#050814]/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-24 h-24 flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-sky-500/10 border border-sky-500/30 animate-ping opacity-75" />
        <div className="absolute inset-4 rounded-full bg-sky-500/20 border border-sky-500/40 animate-pulse" />
        <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 shadow-[0_0_15px_rgba(56,189,248,0.5)] flex items-center justify-center">
          <Share2 className="w-5 h-5 text-white animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <h3 className="text-sm font-bold text-white tracking-wide">Conectando...</h3>
        <p className="text-[11px] text-white/50 text-center max-w-[200px] leading-relaxed">
          {connectionStage}
        </p>
      </div>

      <button
        onClick={onCancel}
        className="mt-8 liquid-glass-button px-5 py-2 text-[10px] flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Cancelar
      </button>
    </div>
  );
}
