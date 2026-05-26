import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { MAX_CHAT_LENGTH } from '../../constants';
import { detectAndWrapCode } from '../../lib/markdown';
import { playBubbleSound } from '../../lib/audio';

interface ChatInputProps {
  onSend: (text: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [chatInput, setChatInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [chatInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const formattedText = detectAndWrapCode(trimmed);
    onSend(formattedText);
    setChatInput('');
    playBubbleSound();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = chatInput.trim();
      if (trimmed) {
        const formattedText = detectAndWrapCode(trimmed);
        onSend(formattedText);
        setChatInput('');
        playBubbleSound();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2.5 pt-4 border-t border-white/5 items-end">
      <label htmlFor="chat-input" className="sr-only">Escrever nota...</label>
      <textarea
        id="chat-input"
        ref={textareaRef}
        placeholder="Escrever nota (Markdown) ou colar URL..."
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 liquid-glass-input px-4 py-2 text-xs resize-none overflow-y-auto custom-scrollbar h-[38px] min-h-[38px]"
        rows={1}
        required
        maxLength={MAX_CHAT_LENGTH}
        autoComplete="off"
      />
      <button
        type="submit"
        className="liquid-glass-button p-2.5 flex items-center justify-center cursor-pointer aspect-square h-[38px] w-[38px] flex-shrink-0"
        title="Enviar nota"
      >
        <Send className="w-4 h-4 text-sky-300" />
      </button>
    </form>
  );
}
