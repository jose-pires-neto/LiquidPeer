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
      if (window.innerWidth >= 1024 && activeTab === 'transfer') {
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
      <div className="flex lg:hidden items-center justify-center p-1 bg-white/[0.02] border border-white/5 rounded-full mb-3 sm:mb-5 shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md">
        <button
          onClick={() => setActiveTab('transfer')}
          className={cn(
            "flex-1 py-3 text-xs font-bold rounded-full transition-all duration-300 cursor-pointer",
            activeTab === 'transfer'
              ? "bg-white/10 text-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_8px_rgba(56,189,248,0.15)] border border-white/10"
              : "text-white/40 hover:text-white/60 hover:bg-white/[0.01]",
          )}
        >
          Transferir
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={cn(
            "flex-1 py-3 text-xs font-bold rounded-full transition-all duration-300 relative cursor-pointer",
            activeTab === 'files'
              ? "bg-white/10 text-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_8px_rgba(56,189,248,0.15)] border border-white/10"
              : "text-white/40 hover:text-white/60 hover:bg-white/[0.01]",
          )}
        >
          Arquivos
          {visibleTransfers.length > 0 && (
            <span className="absolute top-1.5 right-2 bg-sky-500 text-[8px] font-extrabold text-white w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#050814]">
              {visibleTransfers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex-1 py-3 text-xs font-bold rounded-full transition-all duration-300 relative cursor-pointer",
            activeTab === 'chat'
              ? "bg-white/10 text-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_8px_rgba(56,189,248,0.15)] border border-white/10"
              : "text-white/40 hover:text-white/60 hover:bg-white/[0.01]",
          )}
        >
          Notas
          {messages.length > 0 && (
            <span className="absolute top-1.5 right-2 bg-sky-500 text-[8px] font-extrabold text-white w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#050814]">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* COLUMN 1: Connection Tube & Upload Drop Zone */}
        <div
          className={cn(
            "space-y-3 sm:space-y-5 flex flex-col justify-between transition-all duration-300",
            activeTab === 'transfer' ? "flex" : "hidden lg:flex",
          )}
        >
          <ConnectionTube 
            activeTransfer={activeTransfer} 
            isSending={isSending ?? false} 
            transfers={transfers}
          />
          <DropZone onFilesSelected={handleFilesSelected} />

          <div className="relative p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/10 text-center flex flex-col justify-center gap-1 overflow-hidden backdrop-blur-md shadow-[0_10px_25px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)]">
            {/* Specular sheen line/gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            
            <span className="text-[8px] font-extrabold text-sky-300/40 uppercase tracking-widest relative z-10">
              Canal WebRTC Seguro
            </span>
            <p className="text-[9.5px] text-white/50 leading-relaxed relative z-10 font-medium">
              Conexão criptografada de ponta a ponta. Nenhum dado toca nossos servidores.
            </p>
          </div>
        </div>

        {/* COLUMN 2: Files & Chat */}
        <div
          className={cn(
            "flex-1 flex flex-col h-full lg:border-l lg:border-white/5 lg:pl-8 transition-all duration-300",
            activeTab !== 'transfer' ? "flex" : "hidden lg:flex",
          )}
        >
          {/* Desktop Tab Header */}
          <div className="hidden lg:flex items-center justify-between pb-3 mb-5 border-b border-white/5">
            <div className="flex gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-full shadow-inner backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('files')}
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wider px-4 py-2 rounded-full border transition-all duration-300 cursor-pointer",
                  activeTab === 'files'
                    ? "border-white/10 bg-white/10 text-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_8px_rgba(56,189,248,0.15)]"
                    : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.01]",
                )}
              >
                Arquivos ({visibleTransfers.length})
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wider px-4 py-2 rounded-full border transition-all duration-300 relative cursor-pointer",
                  activeTab === 'chat'
                    ? "border-white/10 bg-white/10 text-sky-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_2px_8px_rgba(56,189,248,0.15)]"
                    : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/[0.01]",
                )}
              >
                Notas / Clipboard
                {messages.length > 0 && (
                  <span className="absolute -top-1.5 -right-1 bg-sky-500 text-[8px] font-extrabold text-white w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#050814] animate-pulse">
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
