import { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import type { ViewState } from './types';
import { cn } from './lib/utils';
import { playDropletSound, playBubbleSound, playFlowSound } from './lib/audio';
import { usePeer } from './hooks/usePeer';
import { useToast } from './hooks/useToast';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { ConnectingOverlay } from './components/views/ConnectingOverlay';
import { QRScanner } from './components/scanner/QRScanner';
import { HomeView } from './components/views/HomeView';
import { HostView } from './components/views/HostView';
import { JoinView } from './components/views/JoinView';
import { TransferView } from './components/views/TransferView';
import { ROOM_CODE_LENGTH } from './constants';

function App() {
  const [view, setView] = useState<ViewState>('home');
  const [showScanner, setShowScanner] = useState(false);

  const { toasts, showToast } = useToast();

  const {
    peerId,
    state: peerState,
    error: peerError,
    connectionStage,
    transfers,
    messages,
    initializePeer,
    connectToPeer,
    sendFile,
    sendText,
    disconnect,
  } = usePeer({
    onConnect: () => {
      setView('transfer');
      setShowScanner(false);
      showToast('Conectado com sucesso!', 'success');
      playDropletSound();
    },
    onDisconnect: () => {
      setView('home');
      showToast('Conexão encerrada.', 'info');
      playDropletSound();
    },
  });

  // Watch connection errors
  useEffect(() => {
    if (peerError) {
      const timer = setTimeout(() => {
        showToast(peerError, 'error');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [peerError, showToast]);

  // Watch transfers for audio feedback + toasts
  const prevTransfersStates = useRef<Record<string, string>>({});
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    transfers.forEach(t => {
      const prevState = prevTransfersStates.current[t.id];

      if (t.status === 'transferring' && prevState !== 'transferring' && prevState !== 'completed') {
        playFlowSound();
      }

      if (t.status === 'completed' && prevState !== 'completed') {
        playBubbleSound();
        timers.push(setTimeout(() => {
          showToast(`"${t.name}" transferido com sucesso!`, 'success');
        }, 0));
      } else if (t.status === 'error' && prevState !== 'error') {
        timers.push(setTimeout(() => {
          showToast(`Erro na transferência de "${t.name}".`, 'error');
        }, 0));
      }
      prevTransfersStates.current[t.id] = t.status;
    });
    return () => timers.forEach(clearTimeout);
  }, [transfers, showToast]);

  // Watch incoming text messages for audio feedback + toasts
  const prevMessagesLength = useRef(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (messages.length > prevMessagesLength.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.direction === 'receiving') {
        timer = setTimeout(() => {
          showToast('Nova nota recebida!', 'info');
          playBubbleSound();
        }, 0);
      }
    }
    prevMessagesLength.current = messages.length;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [messages, showToast]);

  const handleHost = () => {
    const randomId = Math.random().toString(36).substring(2, 2 + ROOM_CODE_LENGTH).toUpperCase();
    initializePeer(randomId);
    setView('host');
  };

  const handleGoHome = () => {
    disconnect();
    setView('home');
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative select-none overflow-hidden">
      {/* Liquid Ambient Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-sky-500/10 rounded-full blur-[120px] animate-glow-1 pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] animate-glow-2 pointer-events-none z-0" />

      {/* Floating Glass Toasts */}
      <ToastContainer toasts={toasts} />

      <main
        className={cn(
          "w-full z-10 liquid-glass-panel p-6 md:p-8 transition-all duration-500 relative",
          view === 'transfer' ? "max-w-4xl" : "max-w-md",
        )}
      >
        {peerState === 'connecting' && (
          <ConnectingOverlay
            connectionStage={connectionStage}
            onCancel={disconnect}
          />
        )}

        {/* Header */}
        <Header
          peerState={peerState}
          onDisconnect={disconnect}
          onLogoClick={handleGoHome}
        />

        {/* Error Banner */}
        {peerError && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-rose-200 text-[10px] leading-relaxed">{peerError}</p>
          </div>
        )}

        {/* Content Section Router */}
        <div className="relative min-h-[300px] flex flex-col justify-between">
          {showScanner && (
            <QRScanner
              onScan={(code) => {
                connectToPeer(code.toUpperCase());
                setShowScanner(false);
              }}
              onClose={() => setShowScanner(false)}
            />
          )}

          {!showScanner && view === 'home' && (
            <HomeView
              onScanClick={() => setShowScanner(true)}
              onHostClick={handleHost}
              onJoinClick={() => setView('join')}
            />
          )}

          {!showScanner && view === 'host' && (
            <HostView
              peerId={peerId}
              onCancel={handleGoHome}
              showToast={showToast}
            />
          )}

          {!showScanner && view === 'join' && (
            <JoinView
              peerState={peerState}
              onSubmit={(code) => connectToPeer(code)}
              onBack={() => setView('home')}
            />
          )}

          {!showScanner && view === 'transfer' && (
            <TransferView
              transfers={transfers}
              messages={messages}
              onSendFile={sendFile}
              onSendText={sendText}
              showToast={showToast}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
