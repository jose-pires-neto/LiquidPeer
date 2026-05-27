import { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import type { PeerState } from '../../types';
import { ROOM_CODE_LENGTH } from '../../constants';
import { cn } from '../../lib/utils';

interface JoinViewProps {
  peerState: PeerState;
  onSubmit: (code: string) => void;
  onBack: () => void;
}

export function JoinView({ peerState, onSubmit, onBack }: JoinViewProps) {
  const [joinId, setJoinId] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGridClick = () => {
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    onSubmit(joinId.trim().toUpperCase());
  };

  return (
    <div className="flex flex-col items-center justify-between h-full space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-0.5">
        <h2 className="text-sm sm:text-base font-bold text-white">Entrar com Código</h2>
        <p className="text-white/40 text-[11px]">Insira o código de 6 letras da outra sala.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 pt-2">
        <div className="relative">
          <label htmlFor="joinId-input" className="sr-only">Código da Sala</label>
          <input
            id="joinId-input"
            ref={inputRef}
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value.toUpperCase().slice(0, ROOM_CODE_LENGTH))}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
            maxLength={ROOM_CODE_LENGTH}
            required
            disabled={peerState === 'connecting'}
          />

          <div
            onClick={handleGridClick}
            className="flex gap-1.5 sm:gap-2.5 justify-center cursor-pointer"
          >
            {Array.from({ length: ROOM_CODE_LENGTH }).map((_, idx) => {
              const char = joinId[idx] || '';
              const isFocused = joinId.length === idx && isInputFocused;
              
              // Stagger wobble classes for active focus slots
              const animClass = isFocused 
                ? (idx % 3 === 0 ? "animate-wobble-slow-1" : idx % 3 === 1 ? "animate-wobble-slow-2" : "animate-wobble-slow-3") 
                : "";

              return (
                <div
                  key={idx}
                  className={cn(
                    "w-8 h-11 sm:w-10 sm:h-13 rounded-2xl flex items-center justify-center font-mono text-lg sm:text-xl font-extrabold transition-all duration-300 border relative overflow-hidden",
                    isFocused
                      ? "border-sky-400 bg-sky-500/15 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.35)] scale-105"
                      : char
                        ? "border-white/20 bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_4px_10px_rgba(0,0,0,0.2)]"
                        : "border-white/5 bg-white/[0.01] text-white/20 shadow-inner",
                    animClass
                  )}
                >
                  {/* Glossy highlight inside active bubble */}
                  {(isFocused || char) && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
                  )}
                  <span className="relative z-10">{char}</span>
                  {isFocused && <span className="animate-pulse text-sky-400 absolute z-20">|</span>}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={joinId.length < ROOM_CODE_LENGTH || peerState === 'connecting'}
          className="w-full liquid-glass-button py-3.5 text-xs flex justify-center items-center gap-1.5 disabled:opacity-40 cursor-pointer rounded-full"
        >
          {peerState === 'connecting' ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Conectar <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <button
        onClick={onBack}
        className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 text-white/50 hover:text-white/80 transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-3 h-3" /> Voltar
      </button>
    </div>
  );
}
