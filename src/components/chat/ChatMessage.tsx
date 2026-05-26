import { Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PeerMessage } from '../../types';
import { cn } from '../../lib/utils';
import { playBubbleSound } from '../../lib/audio';
import { CodeBlock } from './CodeBlock';

interface ChatMessageProps {
  message: PeerMessage;
  showToast: (message: string, type: 'info' | 'success' | 'error') => void;
}

export function ChatMessage({ message, showToast }: ChatMessageProps) {
  const isSent = message.direction === 'sending';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    showToast('Nota copiada!', 'success');
    playBubbleSound();
  };

  return (
    <div
      className={cn(
        "flex w-full animate-in slide-in-from-bottom-2 duration-200",
        isSent ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[11px] border flex flex-col gap-2 relative shadow-md",
          isSent
            ? "bg-sky-500/10 border-sky-400/20 text-sky-100 rounded-tr-none"
            : "bg-white/5 border-white/10 text-white/90 rounded-tl-none",
        )}
      >
        <div className="break-words font-medium leading-relaxed w-full whitespace-pre-wrap">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a({ href, children }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 underline font-semibold cursor-pointer break-all"
                  >
                    {children}
                  </a>
                );
              },
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                const isInline = !className && !String(children).includes('\n');

                if (!isInline) {
                  return (
                    <CodeBlock
                      code={codeString}
                      language={match ? match[1] : 'text'}
                    />
                  );
                }

                return (
                  <code
                    className="font-mono bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-sky-300 text-[10px]"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              p({ children }) {
                return <p className="mb-1 last:mb-0 leading-relaxed whitespace-pre-wrap">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc pl-4 mb-2 last:mb-0">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal pl-4 mb-2 last:mb-0">{children}</ol>;
              },
              li({ children }) {
                return <li className="mb-0.5">{children}</li>;
              },
              h1({ children }) {
                return <h1 className="text-sm font-extrabold text-white mt-2 mb-1">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-xs font-bold text-white mt-2 mb-1">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-xs font-semibold text-white mt-1.5 mb-1">{children}</h3>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-2 border-white/20 pl-2 text-white/60 italic my-1.5">
                    {children}
                  </blockquote>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        <div className="flex items-center justify-between gap-6 pt-1 border-t border-white/5">
          <span className="text-[8px] text-white/30 font-medium">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>

          <button
            onClick={handleCopy}
            className="text-[8px] text-white/40 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
            title="Copiar para clipboard"
          >
            <Copy className="w-2.5 h-2.5" /> Copiar
          </button>
        </div>
      </div>
    </div>
  );
}
