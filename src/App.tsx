import { useState, useEffect, useRef, useCallback } from 'react';
import { AlertCircle, Coffee } from 'lucide-react';
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
import { ShareRoomModal } from './components/views/ShareRoomModal';
import { ROOM_CODE_LENGTH } from './constants';
import { getSharedFiles, clearSharedFiles } from './lib/db';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

function App() {
  const [view, setView] = useState<ViewState>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [sharedFiles, setSharedFiles] = useState<File[]>([]);

  const { toasts, showToast } = useToast();

  const handleConnect = useCallback(() => {
    setView('transfer');
    setShowScanner(false);
    showToast('Conectado com sucesso!', 'success');
    playDropletSound();
  }, [showToast]);

  const handleDisconnect = useCallback(() => {
    setView('home');
    showToast('Conexão encerrada.', 'info');
    playDropletSound();
  }, [showToast]);

  const {
    peerId,
    state: peerState,
    error: peerError,
    connectionStage,
    transfers,
    messages,
    peers,
    initializePeer,
    connectToPeer,
    sendFile,
    sendText,
    disconnect,
  } = usePeer({
    onConnect: handleConnect,
    onDisconnect: handleDisconnect,
  });

  const roomCode = peerId && peerId.length === ROOM_CODE_LENGTH
    ? peerId
    : peers?.find(p => p.id.length === ROOM_CODE_LENGTH)?.id || null;

  // Watch connection errors
  useEffect(() => {
    if (peerError) {
      const timer = setTimeout(() => {
        showToast(peerError, 'error');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [peerError, showToast]);

  // Retrieve shared files on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('shared') === 'true') {
      getSharedFiles()
        .then((storedFiles) => {
          if (storedFiles && storedFiles.length > 0) {
            const files = storedFiles.map((f) => new File([f.data], f.name, { type: f.type }));
            setSharedFiles(files);
            showToast(`${files.length} arquivo(s) compartilhado(s) carregado(s).`, 'info');
          }
          clearSharedFiles();
        })
        .catch((err) => {
          console.error('Error fetching shared files from IndexedDB:', err);
        });

      // Clear query string params from the browser address bar
      window.history.replaceState({}, '', '/');
    }
  }, [showToast]);

  // Check for room invitation in URL query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomCodeParam = params.get('room');
    if (roomCodeParam && roomCodeParam.length === ROOM_CODE_LENGTH) {
      connectToPeer(roomCodeParam.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
      showToast(`Conectando à sala ${roomCodeParam.toUpperCase()}...`, 'info');
    }
  }, [connectToPeer, showToast]);

  // Automatically transfer shared files when peer connection is established
  useEffect(() => {
    if (view === 'transfer' && sharedFiles.length > 0) {
      const timer = setTimeout(() => {
        sharedFiles.forEach((file) => {
          sendFile(file);
          showToast(`Enviando arquivo compartilhado: ${file.name}`, 'info');
        });
        setSharedFiles([]);
      }, 800); // Small buffer to ensure WebRTC Data Channel is fully ready
      return () => clearTimeout(timer);
    }
  }, [view, sharedFiles, sendFile, showToast]);

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
    <div className="min-h-dvh flex flex-col items-center justify-center safe-area-container relative select-none overflow-hidden py-8">
      {/* Liquid Ambient Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-48 sm:w-72 h-48 sm:h-72 bg-sky-500/10 rounded-full blur-[80px] sm:blur-[120px] animate-glow-1 pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-600/10 rounded-full blur-[100px] sm:blur-[140px] animate-glow-2 pointer-events-none z-0" />

      {/* Floating Glass Toasts */}
      <ToastContainer toasts={toasts} />

      {/* LiquidPeer Title (Only on Home/Initial Views, Hidden in TransferView) */}
      {view !== 'transfer' && (
        <div className="w-full max-w-md flex justify-center mb-6 animate-banner-wobble z-10 px-2">
          <div className="liquid-glass-banner px-8 py-3 rounded-[28px] w-full text-center select-none cursor-pointer">
            <h1 className="text-3xl sm:text-4xl tracking-widest bg-gradient-to-r from-white via-sky-200 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(14,165,233,0.3)] font-bubble">
              LiquidPeer
            </h1>
          </div>
        </div>
      )}

      <main
        className={cn(
          "w-full z-10 liquid-glass-panel p-4 sm:p-6 lg:p-8 transition-all duration-500 relative",
          view === 'transfer' ? "max-w-4xl lg:max-w-5xl" : "max-w-md",
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
          onInviteClick={() => setShowInviteModal(true)}
        />

        {/* Error Banner */}
        {peerError && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-rose-200 text-[10px] leading-relaxed">{peerError}</p>
          </div>
        )}

        {/* Content Section Router */}
        <div className="relative min-h-[260px] sm:min-h-[320px] flex flex-col justify-between">
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
              peers={peers}
              onSendFile={sendFile}
              onSendText={sendText}
              showToast={showToast}
              onInviteClick={() => setShowInviteModal(true)}
            />
          )}
        </div>
      </main>

      {showInviteModal && roomCode && (
        <ShareRoomModal
          peerId={roomCode}
          onClose={() => setShowInviteModal(false)}
          showToast={showToast}
        />
      )}

      {/* Footer Links (Only on Home/Initial Views, Hidden in TransferView) */}
      {view !== 'transfer' && (
        <div className="w-full max-w-md flex justify-center gap-3 mt-6 z-10 px-2 animate-in fade-in duration-300">
          {/* GitHub Button */}
          <a
            href="https://github.com/jose-pires-neto/LiquidPeer"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 hover:scale-105 active:scale-95 text-white/60 hover:text-white transition-all duration-300 shadow-sm cursor-pointer"
          >
            <GithubIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50" /> GitHub
          </a>

          {/* Buy Me a Coffee Button */}
          <a
            href="https://buymeacoffee.com/josepires.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 hover:scale-105 active:scale-95 text-white/60 hover:text-white transition-all duration-300 shadow-sm cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300/80 animate-pulse" /> Buy Me a Coffee
          </a>
        </div>
      )}
    </div>
  );
}

export default App;
