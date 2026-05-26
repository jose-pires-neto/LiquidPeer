import { useState, useEffect, useMemo } from 'react';
import type { FileTransfer, PeerMessage, TabState } from '../../types';
import { cn } from '../../lib/utils';
import { ConnectionTube } from '../transfer/ConnectionTube';
import { DropZone } from '../transfer/DropZone';
import { ActiveTransferList } from '../transfer/ActiveTransferList';
import { CompletedTransferList } from '../transfer/CompletedTransferList';
import { ChatPanel } from '../chat/ChatPanel';

interface TransferViewProps {
  transfers: FileTransfer[];
  messages: PeerMessage[];
  onSendFile: (file: File) => void;
  onSendText: (text: string) => void;
  showToast: (message: string, type: 'info' | 'success' | 'error') => void;
}

export function TransferView({
  transfers,
  messages,
  onSendFile,
  onSendText,
  showToast,
}: TransferViewProps) {
  const [activeTab, setActiveTab] = useState<TabState>('transfer');
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());

  // Force activeTab switch on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && activeTab === 'transfer') {
        setActiveTab('files');
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const visibleTransfers = useMemo(
    () => transfers.filter(t => !clearedIds.has(t.id)),
    [transfers, clearedIds],
  );

  const activeTransfersList = useMemo(
    () => visibleTransfers.filter(t => t.status === 'transferring' || t.status === 'pending'),
    [visibleTransfers],
  );

  const completedTransfersList = useMemo(
    () => visibleTransfers.filter(t => t.status === 'completed'),
    [visibleTransfers],
  );

  const activeTransfer = transfers.find(t => t.status === 'transferring');
  const isSending = activeTransfer?.direction === 'sending';

  const handleFilesSelected = (files: File[]) => {
    files.forEach(file => onSendFile(file));
  };

  const clearHistory = () => {
    const completedIds = transfers.filter(t => t.status === 'completed').map(t => t.id);
    setClearedIds(prev => {
      const next = new Set(prev);
      completedIds.forEach(id => next.add(id));
      return next;
    });
    showToast('Histórico limpo!', 'info');
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 w-full">
      {/* Mobile Tab Bar */}
      <div className="flex md:hidden items-center justify-center p-1 bg-white/[0.03] border border-white/5 rounded-2xl mb-5 shadow-inner">
        <button
          onClick={() => setActiveTab('transfer')}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 cursor-pointer",
            activeTab === 'transfer'
              ? "bg-white/10 text-sky-300 shadow-sm border border-white/5"
              : "text-white/40 hover:text-white/60",
          )}
        >
          Transferir
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 relative cursor-pointer",
            activeTab === 'files'
              ? "bg-white/10 text-sky-300 shadow-sm border border-white/5"
              : "text-white/40 hover:text-white/60",
          )}
        >
          Arquivos
          {visibleTransfers.length > 0 && (
            <span className="absolute top-1 right-2 bg-sky-500 text-[8px] font-extrabold text-white w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#050814]">
              {visibleTransfers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 relative cursor-pointer",
            activeTab === 'chat'
              ? "bg-white/10 text-sky-300 shadow-sm border border-white/5"
              : "text-white/40 hover:text-white/60",
          )}
        >
          Notas
          {messages.length > 0 && (
            <span className="absolute top-1 right-2 bg-sky-500 text-[8px] font-extrabold text-white w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#050814]">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Grid System */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* COLUMN 1: Connection Tube & Upload Drop Zone */}
        <div
          className={cn(
            "space-y-5 flex flex-col justify-between transition-all duration-300",
            activeTab === 'transfer' ? "flex" : "hidden md:flex",
          )}
        >
          <ConnectionTube activeTransfer={activeTransfer} isSending={isSending ?? false} />
          <DropZone onFilesSelected={handleFilesSelected} />

          <div className="p-3.5 liquid-glass-card border border-white/5 text-center flex flex-col justify-center gap-1.5">
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">
              Canal WebRTC Seguro
            </span>
            <p className="text-[9px] text-white/50 leading-relaxed">
              Conexão criptografada de ponta a ponta. Nenhum dado toca nossos servidores.
            </p>
          </div>
        </div>

        {/* COLUMN 2: Files & Chat */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full md:border-l md:border-white/5 md:pl-8 transition-all duration-300",
            activeTab !== 'transfer' ? "flex" : "hidden md:flex",
          )}
        >
          {/* Desktop Tab Header */}
          <div className="hidden md:flex items-center justify-between border-b border-white/5 pb-3 mb-5">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('files')}
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-all cursor-pointer",
                  activeTab === 'files'
                    ? "border-sky-500/20 bg-sky-500/10 text-sky-300 shadow-sm"
                    : "border-transparent text-white/40 hover:text-white/60",
                )}
              >
                Arquivos ({visibleTransfers.length})
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-all relative cursor-pointer",
                  activeTab === 'chat'
                    ? "border-sky-500/20 bg-sky-500/10 text-sky-300 shadow-sm"
                    : "border-transparent text-white/40 hover:text-white/60",
                )}
              >
                Notas / Clipboard
                {messages.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-sky-500 text-[8px] font-extrabold text-white w-4 h-4 rounded-full flex items-center justify-center border border-[#050814] animate-pulse">
                    {messages.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-300">
              <ActiveTransferList
                transfers={activeTransfersList}
                hasActiveTransfer={!!activeTransfer}
              />
              <CompletedTransferList
                transfers={completedTransfersList}
                onClearHistory={clearHistory}
              />
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <ChatPanel
              messages={messages}
              onSendText={onSendText}
              showToast={showToast}
            />
          )}
        </div>
      </div>
    </div>
  );
}
