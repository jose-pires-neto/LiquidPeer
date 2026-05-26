import { QrCode, Home, Plus, Key } from 'lucide-react';

interface HomeViewProps {
  onScanClick: () => void;
  onHostClick: () => void;
  onJoinClick: () => void;
}

export function HomeView({ onScanClick, onHostClick, onJoinClick }: HomeViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full py-4 animate-in fade-in duration-300">
      {/* Central Large QR Code Scanner Bubble */}
      <button
        onClick={onScanClick}
        className="group relative w-36 h-36 sm:w-40 sm:h-40 rounded-full liquid-soap-bubble animate-wobble-slow-1 flex items-center justify-center"
        aria-label="Escanear QR Code"
      >
        <QrCode className="w-14 h-14 sm:w-16 sm:h-16 text-sky-200 opacity-90 transition-all duration-300 group-hover:scale-110 group-hover:text-white" />
        
        {/* Floating Tooltip */}
        <div className="absolute bottom-full mb-3 px-2.5 py-1.5 bg-slate-950/80 border border-white/10 rounded-lg text-[9px] font-bold text-white/80 tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg scale-95 group-hover:scale-100 backdrop-blur-md">
          Escanear QR
        </div>
      </button>

      {/* Bottom Staggered / Asymmetric Bubble Buttons */}
      <div className="flex items-center justify-center gap-10 sm:gap-14 w-full pt-10 pb-2">
        {/* Create Room Bubble Button (Staggered Lower) */}
        <button
          onClick={onHostClick}
          className="group relative w-20 h-20 sm:w-22 sm:h-22 rounded-full liquid-soap-bubble animate-wobble-slow-2 mt-5 flex items-center justify-center"
          aria-label="Criar Sala"
        >
          <div className="relative transition-transform duration-300 group-hover:scale-115">
            <Home className="w-7 h-7 text-sky-200 opacity-90 group-hover:text-white" />
            <Plus className="w-3.5 h-3.5 absolute -top-1 -right-1.5 text-emerald-400 stroke-[3.5] bg-slate-900/60 rounded-full" />
          </div>

          {/* Floating Tooltip */}
          <div className="absolute bottom-full mb-3 px-2 py-1 bg-slate-950/80 border border-white/10 rounded-lg text-[9px] font-bold text-white/80 tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg scale-95 group-hover:scale-100 backdrop-blur-md">
            Criar Sala
          </div>
        </button>

        {/* Enter Code Bubble Button (Staggered Higher) */}
        <button
          onClick={onJoinClick}
          className="group relative w-20 h-20 sm:w-22 sm:h-22 rounded-full liquid-soap-bubble animate-wobble-slow-3 -mt-5 flex items-center justify-center"
          aria-label="Digitar Código"
        >
          <Key className="w-7 h-7 text-sky-200 opacity-90 transition-all duration-300 group-hover:scale-115 group-hover:text-white group-hover:rotate-45" />

          {/* Floating Tooltip */}
          <div className="absolute bottom-full mb-3 px-2 py-1 bg-slate-950/80 border border-white/10 rounded-lg text-[9px] font-bold text-white/80 tracking-wide uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap shadow-lg scale-95 group-hover:scale-100 backdrop-blur-md">
            Digitar Código
          </div>
        </button>
      </div>
    </div>
  );
}
