import { Share2, ArrowLeft } from 'lucide-react';

interface ConnectingOverlayProps {
  connectionStage: string;
  onCancel: () => void;
}

export function ConnectingOverlay({ connectionStage, onCancel }: ConnectingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#050814]/92 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-28 h-28 flex items-center justify-center mb-8">
        {/* Outer glowing liquid boundary */}
        <div className="absolute inset-2 rounded-full border border-sky-500/10 bg-sky-500/[0.02] animate-pulse-slow shadow-[0_0_30px_rgba(56,189,248,0.05),inset_0_0_20px_rgba(56,189,248,0.05)] pointer-events-none" />

        {/* Central main wobbly liquid bubble */}
        <div className="w-20 h-20 rounded-full liquid-soap-bubble animate-wobble-slow-2 relative z-10 flex items-center justify-center">
          <Share2 className="w-7 h-7 text-white/90 animate-pulse relative z-10" />
        </div>

        {/* Floating companion iridescent bubbles */}
        <div 
          className="absolute w-5 h-5 iridescent-bubble animate-float"
          style={{ top: '6%', left: '8%', animationDelay: '0.4s', animationDuration: '4.8s' }} 
        />
        <div 
          className="absolute w-3.5 h-3.5 iridescent-bubble animate-float"
          style={{ bottom: '10%', right: '6%', animationDelay: '1.5s', animationDuration: '3.8s' }} 
        />
        <div 
          className="absolute w-4 h-4 iridescent-bubble animate-float"
          style={{ top: '15%', right: '4%', animationDelay: '0.1s', animationDuration: '5.2s' }} 
        />
        <div 
          className="absolute w-3 h-3 iridescent-bubble animate-float"
          style={{ bottom: '8%', left: '12%', animationDelay: '2.2s', animationDuration: '4.2s' }} 
        />
        <div 
          className="absolute w-4.5 h-4.5 iridescent-bubble animate-float"
          style={{ top: '65%', left: '2%', animationDelay: '0.8s', animationDuration: '4.5s' }} 
        />
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-sm font-bold text-white tracking-wide">Conectando...</h3>
        <p className="text-[11px] text-sky-200/60 text-center max-w-[220px] leading-relaxed font-medium">
          {connectionStage}
        </p>
      </div>

      <button
        onClick={onCancel}
        className="mt-10 px-5 py-2.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 text-white/50 hover:text-white/80 transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Cancelar
      </button>
    </div>
  );
}
