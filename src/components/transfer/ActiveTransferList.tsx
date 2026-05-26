import { Share2 } from 'lucide-react';
import type { FileTransfer } from '../../types';
import { TransferItem } from './TransferItem';

interface ActiveTransferListProps {
  transfers: FileTransfer[];
  hasActiveTransfer: boolean;
}

export function ActiveTransferList({ transfers, hasActiveTransfer }: ActiveTransferListProps) {
  return (
    <div className="space-y-3 flex-1 flex flex-col">
      <h4 className="text-[9px] font-extrabold text-white/35 uppercase tracking-widest pl-1 flex items-center justify-between">
        <span>Em Trânsito ({transfers.length})</span>
        {hasActiveTransfer && (
          <span className="text-[9px] text-sky-400 font-bold lowercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            ativo
          </span>
        )}
      </h4>

      {transfers.length === 0 ? (
        <div className="p-5 rounded-2xl border border-white/5 bg-black/10 text-center flex flex-col items-center justify-center gap-2 min-h-[90px]">
          <Share2 className="w-4 h-4 text-white/20" />
          <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">
            Sem transferências ativas
          </span>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
          {transfers.map(transfer => (
            <TransferItem key={transfer.id} transfer={transfer} />
          ))}
        </div>
      )}
    </div>
  );
}
