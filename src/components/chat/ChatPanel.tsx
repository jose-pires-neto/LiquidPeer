import { useRef, useEffect } from 'react';
import { Clipboard } from 'lucide-react';
import type { PeerMessage } from '../../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: PeerMessage[];
  onSendText: (text: string) => void;
  showToast: (message: string, type: 'info' | 'success' | 'error') => void;
}

export function ChatPanel({ messages, onSendText, showToast }: ChatPanelProps) {
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col justify-between h-full animate-in fade-in duration-300 min-h-[280px] sm:min-h-[340px] lg:min-h-[400px]">
      <div className="space-y-3 flex-1 flex flex-col">
        <h4 className="text-[10px] font-extrabold text-white/35 uppercase tracking-widest pl-1 mb-2">
          Área de Notas ({messages.length})
        </h4>

        {messages.length === 0 ? (
          <div className="flex-1 border border-white/5 bg-black/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3.5">
            <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/5">
              <Clipboard className="w-6 h-6 text-white/20" />
            </div>
            <div className="max-w-[200px] space-y-1">
              <span className="text-[11px] text-white/40 block font-bold uppercase tracking-wider">
                Notas Compartilhadas
              </span>
              <p className="text-[10px] text-white/30 leading-relaxed">
                Envie links, senhas ou notas rápidas abaixo. Eles aparecem nos clipboards instantaneamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-3 max-h-52 sm:max-h-64 lg:max-h-80 overflow-y-auto pr-1.5 custom-scrollbar pb-4">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} showToast={showToast} />
            ))}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>

      <ChatInput onSend={onSendText} />
    </div>
  );
}
