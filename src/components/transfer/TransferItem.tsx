import { Download, Check } from 'lucide-react';
import type { FileTransfer } from '../../types';
import { getFileIcon } from '../../lib/device';
import { formatBytes, formatSpeed, formatEta } from '../../lib/formatters';
import { cn } from '../../lib/utils';

interface TransferItemProps {
  transfer: FileTransfer;
}

export function TransferItem({ transfer }: TransferItemProps) {
  const iconConfig = getFileIcon(transfer.name);
  const Icon = iconConfig.icon;
  const isActive = transfer.status === 'transferring' || transfer.status === 'pending';

  const handleDownload = () => {
    if (!transfer.data) return;
    const url = URL.createObjectURL(transfer.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = transfer.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="liquid-glass-card p-3 flex items-center gap-3 border border-white/5">
      <div className={cn("p-2 rounded-lg border border-white/10 flex-shrink-0 bg-white/[0.02]", iconConfig.color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="font-bold text-[11px] truncate block text-white/80">{transfer.name}</span>
          <span className="text-[9px] text-white/40 font-medium whitespace-nowrap ml-2">
            {formatBytes(transfer.size)}
          </span>
        </div>

        {isActive ? (
          <>
            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mt-1.5 relative border border-white/5 shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-600/80 to-sky-400/80 relative overflow-hidden"
                style={{ width: `${transfer.progress}%` }}
              >
                {transfer.status === 'transferring' && (
                  <>
                    <div className="absolute inset-0 w-[200%] h-full animate-wave-flow opacity-30 text-white pointer-events-none">
                      <svg className="h-full w-full" viewBox="0 0 200 20" preserveAspectRatio="none">
                        <path d="M0,10 C50,15 50,5 100,10 C150,15 150,5 200,10 L200,20 L0,20 Z" fill="currentColor" />
                      </svg>
                    </div>
                    <div
                      className="absolute inset-0 w-[200%] h-full animate-wave-flow-slow opacity-15 text-white pointer-events-none"
                      style={{ animationDirection: 'reverse' }}
                    >
                      <svg className="h-full w-full" viewBox="0 0 200 20" preserveAspectRatio="none">
                        <path d="M0,10 C50,5 50,15 100,10 C150,5 150,15 200,10 L200,20 L0,20 Z" fill="currentColor" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-1 text-[9px] font-semibold text-white/35">
              <span className="uppercase tracking-wide">
                {transfer.direction === 'sending' ? 'Enviando' : 'Recebendo'} • {formatSpeed(transfer.speed)}
              </span>
              <span className="text-white/60">
                {transfer.eta !== undefined && transfer.eta > 0
                  ? formatEta(transfer.eta)
                  : `${Math.round(transfer.progress)}%`}
              </span>
            </div>
          </>
        ) : (
          <div className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider mt-1">
            Concluído • {transfer.direction === 'sending' ? 'Enviado' : 'Recebido'}
          </div>
        )}
      </div>

      <div className="flex-shrink-0 ml-1">
        {isActive ? (
          <div className="w-6 h-6 flex items-center justify-center">
            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-sky-400 rounded-full animate-spin" />
          </div>
        ) : transfer.direction === 'receiving' && transfer.data ? (
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Baixar"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="p-1.5 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
