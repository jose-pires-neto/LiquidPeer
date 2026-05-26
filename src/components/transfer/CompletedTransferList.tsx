import { Check } from 'lucide-react';
import type { FileTransfer } from '../../types';
import { TransferItem } from './TransferItem';

interface CompletedTransferListProps {
  transfers: FileTransfer[];
  onClearHistory: () => void;
}

export function CompletedTransferList({ transfers, onClearHistory }: CompletedTransferListProps) {
  return (
    <div className="space-y-3 flex-1 flex flex-col justify-end">
      <h4 className="text-[9px] font-extrabold text-white/35 uppercase tracking-widest pl-1 flex items-center justify-between">
        <span>Concluídos ({transfers.length})</span>
        {transfers.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[9px] text-white/30 hover:text-white/60 font-bold lowercase tracking-normal border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.04] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
          >
            limpar
          </button>
        )}
      </h4>

      {transfers.length === 0 ? (
        <div className="p-5 rounded-2xl border border-white/5 bg-black/10 text-center flex flex-col items-center justify-center gap-2 min-h-[90px]">
          <Check className="w-4 h-4 text-white/20" />
          <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">
            Nenhum arquivo transferido
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
