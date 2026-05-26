import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';

interface CodeBlockProps {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-white/10 bg-black/45 shadow-[inset_0_1.5px_4px_rgba(0,0,0,0.7)] text-left font-mono w-full">
      <div className="flex justify-between items-center px-4 py-1.5 bg-white/[0.03] border-b border-white/5 text-[9px] font-bold text-white/50 tracking-wider select-none">
        <span className="uppercase">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-sky-300 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-emerald-400">Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-2.5 h-2.5" />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 overflow-x-auto text-[10px] leading-relaxed custom-scrollbar max-h-96">
        <Highlight theme={themes.vsDark} code={code} language={language}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={className} style={{ ...style, background: 'transparent', margin: 0, padding: 0 }}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line, key: i })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token, key })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </div>
  );
}
