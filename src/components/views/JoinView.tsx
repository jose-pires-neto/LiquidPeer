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
    <div className="flex flex-col items-center justify-between h-full space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-0.5">
        <h2 className="text-sm font-bold text-white">Entrar com Código</h2>
        <p className="text-white/40 text-[10px]">Insira o código de 6 letras da outra sala.</p>
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
            className="flex gap-2 justify-center cursor-pointer"
          >
            {Array.from({ length: ROOM_CODE_LENGTH }).map((_, idx) => {
              const char = joinId[idx] || '';
              const isFocused = joinId.length === idx && isInputFocused;
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-9 h-12 rounded-xl flex items-center justify-center font-mono text-xl font-extrabold transition-all duration-200 border",
                    isFocused
                      ? "border-sky-500 bg-sky-500/10 shadow-[0_0_10px_rgba(56,189,248,0.25)] scale-105"
                      : char
                        ? "border-white/20 bg-white/5 text-white"
                        : "border-white/5 bg-black/40 text-white/20",
                  )}
                >
                  {char}
                  {isFocused && <span className="animate-pulse text-sky-400">|</span>}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={joinId.length < ROOM_CODE_LENGTH || peerState === 'connecting'}
          className="w-full liquid-glass-button py-3 text-xs flex justify-center items-center gap-1.5 disabled:opacity-40 cursor-pointer"
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
        className="text-[10px] text-white/40 hover:text-white/80 flex items-center gap-1 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>
    </div>
  );
}
