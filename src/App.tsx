import React, { useState, useCallback, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  Share2, 
  Send, 
  UploadCloud, 
  Download, 
  AlertCircle, 
  Copy, 
  Laptop, 
  Smartphone, 
  Check, 
  ArrowLeft, 
  Camera,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileArchive,
  FileCode,
  File as FileIcon,
  Clipboard
} from 'lucide-react';
import { usePeer, type FileTransfer } from './hooks/usePeer';
import { cn } from './lib/utils';

type ViewState = 'home' | 'host' | 'join' | 'transfer';

interface ScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

// Synthetic Audio Feedback using Web Audio API (0KB Bandwidth)
const playDropletSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.error("Audio error", e);
  }
};

const playBubbleSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.error("Audio error", e);
  }
};

const playFlowSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    for (let i = 0; i < 4; i++) {
      const time = ctx.currentTime + i * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      const startFreq = 200 + Math.random() * 80;
      const endFreq = 650 + Math.random() * 150;
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.07);
      
      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.07);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.07);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

function QRScanner({ onScan, onClose }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    const startCamera = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          (qrCodeMessage) => {
            if (qrCodeMessage) {
              onScan(qrCodeMessage);
            }
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
      }
    };

    const timer = setTimeout(() => {
      startCamera();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(err => console.error("Error stopping scanner during unmount:", err));
        }
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center justify-between h-full space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-0.5">
        <h2 className="text-sm font-bold text-white">Escanear QR Code</h2>
        <p className="text-white/40 text-[10px]">Posicione o QR Code no centro da tela.</p>
      </div>

      {error ? (
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center space-y-2 max-w-[240px]">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-rose-200 text-[11px] leading-relaxed">{error}</p>
        </div>
      ) : (
        <div className="relative w-full max-w-[240px] aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl flex items-center justify-center">
          <div className="absolute inset-5 border border-white/5 rounded-lg pointer-events-none z-20">
            <div className="absolute top-0 left-0 w-3.5 h-3.5 border-t border-l border-sky-400" />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 border-t border-r border-sky-400" />
            <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-b border-l border-sky-400" />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-b border-r border-sky-400" />
          </div>
          <div id="qr-reader" className="w-full h-full object-cover z-10" />
        </div>
      )}

      <button 
        onClick={onClose} 
        className="text-[10px] text-white/40 hover:text-white/80 flex items-center gap-1 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>
    </div>
  );
}

function App() {
  const [view, setView] = useState<ViewState>('home');
  const [joinId, setJoinId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  // Tab control: 'transfer' (mobile only), 'files', 'chat'
  const [activeTab, setActiveTab] = useState<'transfer' | 'files' | 'chat'>('transfer');
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState('');

  // Toast notifications state
  interface Toast {
    id: string;
    message: string;
    type: 'info' | 'success' | 'error';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // QR Scanner States
  const [showScanner, setShowScanner] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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
    disconnect 
  } = usePeer({
    onConnect: () => {
      setView('transfer');
      setShowScanner(false);
      showToast('Conectado com sucesso!', 'success');
      playDropletSound();
      setActiveTab('transfer'); // default on mobile
    },
    onDisconnect: () => {
      setView('home');
      setJoinId('');
      showToast('Conexão encerrada.', 'info');
      playDropletSound();
    }
  });

  // Watch connection error
  useEffect(() => {
    if (peerError) {
      const timer = setTimeout(() => {
        showToast(peerError, 'error');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [peerError, showToast]);

  // Watch transfers and play sounds
  const prevTransfersStates = useRef<Record<string, string>>({});
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    transfers.forEach(t => {
      const prevState = prevTransfersStates.current[t.id];
      
      // Trigger flow sound on start
      if (t.status === 'transferring' && prevState !== 'transferring' && prevState !== 'completed') {
        playFlowSound();
      }
      
      // Trigger bubble sound on completion
      if (t.status === 'completed' && prevState !== 'completed') {
        playBubbleSound();
        const timer = setTimeout(() => {
          showToast(`"${t.name}" transferido com sucesso!`, 'success');
        }, 0);
        timers.push(timer);
      } else if (t.status === 'error' && prevState !== 'error') {
        const timer = setTimeout(() => {
          showToast(`Erro na transferência de "${t.name}".`, 'error');
        }, 0);
        timers.push(timer);
      }
      prevTransfersStates.current[t.id] = t.status;
    });
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [transfers, showToast]);

  // Watch incoming text messages to play sound and show toast
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
      // Scroll to bottom of chat
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
    prevMessagesLength.current = messages.length;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [messages, showToast]);

  // Force activeTab switch on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && activeTab === 'transfer') {
        setActiveTab('files');
      }
    };
    window.addEventListener('resize', handleResize);
    // run initially
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  const handleHost = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    initializePeer(randomId);
    setView('host');
  };

  const handleJoin = () => {
    setView('join');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const submitJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    connectToPeer(joinId.trim().toUpperCase());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => {
        sendFile(file);
      });
    }
  }, [sendFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        sendFile(file);
      });
    }
  };

  const handleDownload = (transfer: FileTransfer) => {
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

  const copyToClipboard = (text: string, toastMsg = 'Código copiado!') => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast(toastMsg, 'success');
    playBubbleSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSec?: number) => {
    if (bytesPerSec === undefined || bytesPerSec === null || bytesPerSec === 0) return '0 KB/s';
    return formatBytes(bytesPerSec) + '/s';
  };

  const formatEta = (seconds?: number) => {
    if (seconds === undefined || seconds === null || seconds === Infinity || isNaN(seconds)) return '';
    if (seconds <= 0) return '';
    if (seconds < 60) return `~ ${Math.ceil(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.ceil(seconds % 60);
    return `~ ${mins}m ${secs}s`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return { icon: ImageIcon, color: 'text-sky-300' };
    }
    if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'].includes(ext)) {
      return { icon: Video, color: 'text-sky-300' };
    }
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      return { icon: Music, color: 'text-sky-300' };
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return { icon: FileArchive, color: 'text-sky-300' };
    }
    if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'py', 'java', 'cpp', 'c', 'sh'].includes(ext)) {
      return { icon: FileCode, color: 'text-sky-300' };
    }
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md'].includes(ext)) {
      return { icon: FileText, color: 'text-sky-300' };
    }
    return { icon: FileIcon, color: 'text-slate-400' };
  };

  const handleGridClick = () => {
    inputRef.current?.focus();
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

  const submitChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendText(chatInput.trim());
    setChatInput('');
    playBubbleSound();
  };

  const isLink = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return text.startsWith('http://') || text.startsWith('https://');
    }
  };

  const activeTransfer = transfers.find(t => t.status === 'transferring');
  const isSending = activeTransfer?.direction === 'sending';

  const visibleTransfers = transfers.filter(t => !clearedIds.has(t.id));
  const activeTransfersList = visibleTransfers.filter(t => t.status === 'transferring' || t.status === 'pending');
  const completedTransfersList = visibleTransfers.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative select-none overflow-hidden">
      
      {/* Liquid Ambient Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-sky-500/10 rounded-full blur-[120px] animate-glow-1 pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] animate-glow-2 pointer-events-none z-0" />

      {/* Floating Glass Toasts */}
      <div className="absolute top-6 right-6 z-55 flex flex-col gap-2.5 max-w-xs w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={cn(
              "px-4 py-3 rounded-2xl backdrop-blur-xl border flex items-center gap-2.5 shadow-lg pointer-events-auto animate-in slide-in-from-top-4 duration-300",
              toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" :
              toast.type === 'error' ? "bg-rose-500/10 border-rose-500/20 text-rose-300" :
              "bg-white/5 border-white/10 text-white/90"
            )}
          >
            <span className={cn("w-2 h-2 rounded-full",
              toast.type === 'success' ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" :
              toast.type === 'error' ? "bg-rose-400 shadow-[0_0_6px_#fb7185]" :
              "bg-sky-400 shadow-[0_0_6px_#38bdf8]"
            )} />
            <span className="text-[11px] font-bold tracking-wide">{toast.message}</span>
          </div>
        ))}
      </div>
      
      <main className={cn(
        "w-full z-10 liquid-glass-panel p-6 md:p-8 transition-all duration-500 relative",
        view === 'transfer' ? "max-w-4xl" : "max-w-md"
      )}>
        {peerState === 'connecting' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#050814]/90 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Pulsing Liquid-like Loader */}
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-sky-500/10 border border-sky-500/30 animate-ping opacity-75" />
              {/* Middle pulsing liquid ring */}
              <div className="absolute inset-4 rounded-full bg-sky-500/20 border border-sky-500/40 animate-pulse" />
              {/* Inner liquid drop core */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-sky-400 to-blue-500 shadow-[0_0_15px_rgba(56,189,248,0.5)] flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-white tracking-wide">Conectando...</h3>
              <p className="text-[11px] text-white/50 text-center max-w-[200px] leading-relaxed">
                {connectionStage}
              </p>
            </div>

            <button
              onClick={disconnect}
              className="mt-8 liquid-glass-button px-5 py-2 text-[10px] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cancelar
            </button>
          </div>
        )}
        
        {/* Sleek Minimalist Header */}
        <header className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { disconnect(); setView('home'); setShowScanner(false); }} role="button">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
              <Share2 className="text-sky-300 w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">LiquidPeer</h1>
              <p className="text-[9px] text-white/30 font-medium">Compartilhamento Líquido</p>
            </div>
          </div>
          
          {/* Subtle Connection Status badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5 bg-white/[0.02]">
              <span className={cn("w-1.5 h-1.5 rounded-full transition-all duration-300", 
                peerState === 'connected' ? "bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" :
                peerState === 'connecting' ? "bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse" :
                peerState === 'error' ? "bg-rose-500 shadow-[0_0_6px_#f43f5e]" : "bg-white/20"
              )} />
              <span className="text-[9px] font-semibold text-white/60 tracking-wide uppercase">
                {peerState === 'connected' ? 'Conectado' :
                 peerState === 'connecting' ? 'Buscando...' :
                 peerState === 'error' ? 'Erro' : 'Offline'}
              </span>
            </div>

            {peerState === 'connected' && (
              <button 
                onClick={disconnect}
                className="text-[9px] font-semibold text-white/45 hover:text-rose-300 bg-white/5 hover:bg-rose-500/10 px-2 py-1 rounded-md border border-white/5 transition-all cursor-pointer"
              >
                Sair
              </button>
            )}
          </div>
        </header>

        {peerError && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-start gap-2.5 animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-rose-200 text-[10px] leading-relaxed">{peerError}</p>
          </div>
        )}

        {/* Content Section Router */}
        <div className="relative min-h-[300px] flex flex-col justify-between">
          
          {/* 0. SCANNER VIEW */}
          {showScanner && (
            <QRScanner 
              onScan={(code) => {
                connectToPeer(code.toUpperCase());
                setShowScanner(false);
              }} 
              onClose={() => setShowScanner(false)} 
            />
          )}
          
          {/* 1. HOME VIEW */}
          {!showScanner && view === 'home' && (
            <div className="flex flex-col items-center justify-between h-full space-y-6 animate-in fade-in duration-300">
              
              {/* Central Liquid Glass Camera Scan Button */}
              <button 
                onClick={() => setShowScanner(true)}
                className="relative w-36 h-36 rounded-full liquid-glass-card flex flex-col items-center justify-center gap-2 group cursor-pointer border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.35)] animate-float"
              >
                {/* Visual Glass Refraction Ring */}
                <div className="absolute inset-1.5 rounded-full border border-white/10" />
                
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-inner">
                  <Camera className="w-5.5 h-5.5" />
                </div>
                
                <div className="text-center">
                  <span className="block font-bold text-[11px] text-white tracking-wide">Escanear QR</span>
                  <span className="text-[8px] text-white/40 leading-snug block mt-0.5">Conexão instantânea</span>
                </div>
              </button>

              <div className="text-center space-y-1 mt-2">
                <h2 className="text-lg font-bold text-white/90">Envio P2P Líquido</h2>
                <p className="text-white/35 text-[10px] leading-relaxed max-w-[280px] mx-auto">
                  Envie arquivos diretamente entre navegadores, sem limites e sem armazenamento em nuvem.
                </p>
              </div>

              {/* Minimal Clean Side Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full pt-4">
                <button 
                  onClick={handleHost}
                  className="liquid-glass-button py-3 text-xs font-semibold text-center hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Criar Sala
                </button>
                
                <button 
                  onClick={handleJoin}
                  className="liquid-glass-button py-3 text-xs font-semibold text-center hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Digitar Código
                </button>
              </div>
            </div>
          )}

          {/* 2. HOST VIEW */}
          {!showScanner && view === 'host' && (
            <div className="flex flex-col items-center justify-between h-full space-y-6 animate-in fade-in duration-300">
              <div className="text-center space-y-0.5">
                <h2 className="text-sm font-bold text-white">Aguardando Conexão</h2>
                <p className="text-white/40 text-[10px]">Aponte a câmera do outro dispositivo para este código.</p>
              </div>

              {peerId ? (
                <div className="space-y-6 flex flex-col items-center w-full">
                  {/* Clean Specular QR Container */}
                  <div className="p-3 bg-white rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.5)] border border-white/20">
                    <QRCodeSVG 
                      value={peerId} 
                      size={120}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  
                  {/* Code Grid */}
                  <div className="w-full space-y-3">
                    <div className="flex gap-1.5 justify-center">
                      {peerId.toUpperCase().split('').map((char, index) => (
                        <div 
                           key={index} 
                           className="w-9 h-12 rounded-xl flex items-center justify-center font-mono text-xl font-extrabold text-sky-300 border border-white/10 bg-white/[0.02] shadow-inner"
                        >
                          {char}
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => copyToClipboard(peerId)}
                      className={cn(
                        "liquid-glass-button px-4 py-2 flex items-center gap-1.5 text-[10px] mx-auto cursor-pointer",
                        copied ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : ""
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400 animate-in zoom-in-50" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-white/60" /> Copiar Código
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-sky-400 rounded-full animate-spin"></div>
                </div>
              )}
              
              <button 
                onClick={() => { disconnect(); setView('home'); }} 
                className="text-[10px] text-white/40 hover:text-white/80 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Cancelar
              </button>
            </div>
          )}

          {/* 3. JOIN VIEW */}
          {!showScanner && view === 'join' && (
            <div className="flex flex-col items-center justify-between h-full space-y-6 animate-in fade-in duration-300">
               <div className="text-center space-y-0.5">
                <h2 className="text-sm font-bold text-white">Entrar com Código</h2>
                <p className="text-white/40 text-[10px]">Insira o código de 6 letras da outra sala.</p>
              </div>

              <form onSubmit={submitJoin} className="w-full max-w-sm space-y-6 pt-2">
                <div className="relative">
                  <label htmlFor="joinId-input" className="sr-only">Código da Sala</label>
                  <input
                    id="joinId-input"
                    ref={inputRef}
                    type="text"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value.toUpperCase().slice(0, 6))}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
                    maxLength={6}
                    required
                    disabled={peerState === 'connecting'}
                  />
                  
                  <div 
                    onClick={handleGridClick} 
                    className="flex gap-2 justify-center cursor-pointer"
                  >
                    {Array.from({ length: 6 }).map((_, idx) => {
                      const char = joinId[idx] || '';
                      const isFocused = joinId.length === idx && isInputFocused;
                      return (
                        <div 
                          key={idx} 
                          className={cn(
                            "w-9 h-12 rounded-xl flex items-center justify-center font-mono text-xl font-extrabold transition-all duration-200 border", 
                            isFocused 
                              ? "border-sky-500 bg-sky-500/10 shadow-[0_0_10px_rgba(56,189,248,0.25)] scale-105" 
                              : char 
                                ? "border-white/20 bg-white/5 text-white" 
                                : "border-white/5 bg-black/40 text-white/20"
                          )}
                        >
                          {char}
                          {isFocused && <span className="animate-pulse text-sky-400">|</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <button 
                  type="submit"
                  disabled={joinId.length < 6 || peerState === 'connecting'}
                  className="w-full liquid-glass-button py-3 text-xs flex justify-center items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  {peerState === 'connecting' ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Conectar <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <button 
                onClick={() => setView('home')} 
                className="text-[10px] text-white/40 hover:text-white/80 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            </div>
          )}

          {/* 4. TRANSFER VIEW (Two-column Grid / Tabbed responsive layout) */}
          {!showScanner && view === 'transfer' && (
            <div className="flex flex-col h-full animate-in fade-in duration-300 w-full">
              
              {/* Mobile Glass Bottom/Top Dock Tab Bar */}
              <div className="flex md:hidden items-center justify-center p-1 bg-white/[0.03] border border-white/5 rounded-2xl mb-5 shadow-inner">
                <button 
                  onClick={() => setActiveTab('transfer')}
                  className={cn(
                    "flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 cursor-pointer",
                    activeTab === 'transfer' ? "bg-white/10 text-sky-300 shadow-sm border border-white/5" : "text-white/40 hover:text-white/60"
                  )}
                >
                  Transferir
                </button>
                <button 
                  onClick={() => setActiveTab('files')}
                  className={cn(
                    "flex-1 py-2.5 text-[11px] font-bold rounded-xl transition-all duration-300 relative cursor-pointer",
                    activeTab === 'files' ? "bg-white/10 text-sky-300 shadow-sm border border-white/5" : "text-white/40 hover:text-white/60"
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
                    activeTab === 'chat' ? "bg-white/10 text-sky-300 shadow-sm border border-white/5" : "text-white/40 hover:text-white/60"
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

              {/* Grid System: Desktop side-by-side / Mobile dynamic display based on tabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* COLUMN 1: Connection Tube & Upload Drop Zone */}
                <div className={cn(
                  "space-y-5 flex flex-col justify-between transition-all duration-300",
                  activeTab === 'transfer' ? "flex" : "hidden md:flex"
                )}>
                  
                  {/* Glass Connection Tube */}
                  <div className="flex items-center justify-between w-full px-4 py-3.5 liquid-glass-card border border-white/5">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                        <Smartphone className="w-5.5 h-5.5 text-white/70" />
                      </div>
                      <span className="text-[9px] font-bold text-white/50 tracking-wider">Meu Device</span>
                    </div>
                    
                    {/* Physical Glass Tube */}
                    <div className="flex-1 px-3 relative flex items-center justify-center">
                      <div className="relative h-4.5 w-full rounded-full bg-black/45 border border-white/10 shadow-[inset_0_1.5px_4px_rgba(0,0,0,0.7)] overflow-hidden flex items-center">
                        <div className={cn(
                          "absolute top-0 bottom-0 bg-sky-500/15 blur-[1.5px] transition-all duration-500",
                          activeTransfer ? "w-full" : "w-0"
                        )} />
                        
                        {activeTransfer && (
                          <div className="absolute inset-0 pointer-events-none">
                            {isSending ? (
                              <>
                                <div className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-sky-300/90 shadow-[0_0_6px_#38bdf8] animate-bubble-right-1 -translate-y-1/2" />
                                <div className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white/95 shadow-[0_0_8px_#ffffff] animate-bubble-right-2 -translate-y-1/2" />
                                <div className="absolute top-1/2 w-1 h-1 rounded-full bg-sky-200/80 shadow-[0_0_4px_#7dd3fc] animate-bubble-right-3 -translate-y-1/2" />
                              </>
                            ) : (
                              <>
                                <div className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-sky-300/90 shadow-[0_0_6px_#38bdf8] animate-bubble-left-1 -translate-y-1/2" />
                                <div className="absolute top-1/2 w-2.5 h-2.5 rounded-full bg-white/95 shadow-[0_0_8px_#ffffff] animate-bubble-left-2 -translate-y-1/2" />
                                <div className="absolute top-1/2 w-1 h-1 rounded-full bg-sky-200/80 shadow-[0_0_4px_#7dd3fc] animate-bubble-left-3 -translate-y-1/2" />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                        <Laptop className="w-5.5 h-5.5 text-white/70" />
                      </div>
                      <span className="text-[9px] font-bold text-white/50 tracking-wider">Remoto</span>
                    </div>
                  </div>

                  {/* Upload Drag & Drop Area */}
                  <div 
                    className={cn(
                      "border border-dashed rounded-2xl flex flex-col items-center justify-center min-h-[190px] p-6 transition-all duration-300 relative overflow-hidden",
                      isDragging 
                        ? "border-sky-400 bg-sky-400/5 scale-[1.01]" 
                        : "border-white/5 bg-black/20 hover:bg-white/[0.01]"
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label htmlFor="file-input" className="sr-only">Escolher arquivos</label>
                    <input 
                      id="file-input"
                      type="file" 
                      multiple 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                      onChange={handleFileSelect}
                      title=""
                    />

                    {isDragging ? (
                      <div className="absolute inset-0 bg-[#050814]/85 backdrop-blur-[6px] flex flex-col items-center justify-center pointer-events-none z-30 animate-in fade-in duration-300">
                        <div className="absolute w-24 h-24 rounded-full bg-sky-500/10 border border-sky-400/30 animate-liquid-ripple flex items-center justify-center">
                          <UploadCloud className="w-8 h-8 text-sky-300 animate-bounce" />
                        </div>
                        <span className="text-[11px] font-bold text-sky-200 mt-6 tracking-wide">Solte para Enviar Líquido</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center pointer-events-none">
                        <div className="p-3 rounded-2xl bg-white/[0.02] mb-3.5 border border-white/5 shadow-inner">
                          <UploadCloud className="w-7 h-7 text-white/35 animate-float" />
                        </div>
                        <h3 className="text-xs font-semibold mb-1 text-white/80">Arraste arquivos aqui</h3>
                        <p className="text-[9px] text-white/35">ou clique para navegar</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Disconnect Info */}
                  <div className="p-3.5 liquid-glass-card border border-white/5 text-center flex flex-col justify-center gap-1.5">
                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Canal WebRTC Seguro</span>
                    <p className="text-[9px] text-white/50 leading-relaxed">
                      Conexão criptografada de ponta a ponta. Nenhum dado toca nossos servidores.
                    </p>
                  </div>
                </div>

                {/* COLUMN 2: Files & Chat Tabbed Manager */}
                <div className={cn(
                  "flex-1 flex flex-col h-full md:border-l md:border-white/5 md:pl-8 transition-all duration-300",
                  activeTab !== 'transfer' ? "flex" : "hidden md:flex"
                )}>
                  
                  {/* Desktop Right Column Tab Header */}
                  <div className="hidden md:flex items-center justify-between border-b border-white/5 pb-3 mb-5">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setActiveTab('files')}
                        className={cn(
                          "text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-all cursor-pointer",
                          activeTab === 'files' ? "border-sky-500/20 bg-sky-500/10 text-sky-300 shadow-sm" : "border-transparent text-white/40 hover:text-white/60"
                        )}
                      >
                        Arquivos ({visibleTransfers.length})
                      </button>
                      <button 
                        onClick={() => setActiveTab('chat')}
                        className={cn(
                          "text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-xl border transition-all relative cursor-pointer",
                          activeTab === 'chat' ? "border-sky-500/20 bg-sky-500/10 text-sky-300 shadow-sm" : "border-transparent text-white/40 hover:text-white/60"
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

                  {/* SUB-VIEW 1: FILES LIST */}
                  {activeTab === 'files' && (
                    <div className="flex-1 flex flex-col gap-6 animate-in fade-in duration-300">
                      
                      {/* Active Queue */}
                      <div className="space-y-3 flex-1 flex flex-col">
                        <h4 className="text-[9px] font-extrabold text-white/35 uppercase tracking-widest pl-1 flex items-center justify-between">
                          <span>Em Trânsito ({activeTransfersList.length})</span>
                          {activeTransfer && (
                            <span className="text-[9px] text-sky-400 font-bold lowercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                              ativo
                            </span>
                          )}
                        </h4>
                        
                        {activeTransfersList.length === 0 ? (
                          <div className="p-5 rounded-2xl border border-white/5 bg-black/10 text-center flex flex-col items-center justify-center gap-2 min-h-[90px]">
                            <Share2 className="w-4 h-4 text-white/20" />
                            <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Sem transferências ativas</span>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {activeTransfersList.map(transfer => {
                              const iconConfig = getFileIcon(transfer.name);
                              const Icon = iconConfig.icon;
                              
                              return (
                                <div key={transfer.id} className="liquid-glass-card p-3 flex items-center gap-3 border border-white/5">
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
                                            <div className="absolute inset-0 w-[200%] h-full animate-wave-flow-slow opacity-15 text-white pointer-events-none" style={{ animationDirection: 'reverse' }}>
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
                                          : `${Math.round(transfer.progress)}%`
                                        }
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex-shrink-0 ml-1">
                                    <div className="w-6 h-6 flex items-center justify-center">
                                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-sky-400 rounded-full animate-spin"></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Completed / History */}
                      <div className="space-y-3 flex-1 flex flex-col justify-end">
                        <h4 className="text-[9px] font-extrabold text-white/35 uppercase tracking-widest pl-1 flex items-center justify-between">
                          <span>Concluídos ({completedTransfersList.length})</span>
                          {completedTransfersList.length > 0 && (
                            <button 
                              onClick={clearHistory}
                              className="text-[9px] text-white/30 hover:text-white/60 font-bold lowercase tracking-normal border border-white/5 hover:border-white/10 bg-white/[0.01] hover:bg-white/[0.04] px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                            >
                              limpar
                            </button>
                          )}
                        </h4>

                        {completedTransfersList.length === 0 ? (
                          <div className="p-5 rounded-2xl border border-white/5 bg-black/10 text-center flex flex-col items-center justify-center gap-2 min-h-[90px]">
                            <Check className="w-4 h-4 text-white/20" />
                            <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">Nenhum arquivo transferido</span>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            {completedTransfersList.map(transfer => {
                              const iconConfig = getFileIcon(transfer.name);
                              const Icon = iconConfig.icon;
                              
                              return (
                                <div key={transfer.id} className="liquid-glass-card p-3 flex items-center gap-3 border border-white/5">
                                  <div className={cn("p-2 rounded-lg border border-white/10 flex-shrink-0 bg-white/[0.02]", iconConfig.color)}>
                                    <Icon className="w-4 h-4" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                      <span className="font-bold text-[11px] truncate block text-white/80">{transfer.name}</span>
                                      <span className="text-[9px] text-white/40 font-medium whitespace-nowrap ml-2">
                                        {formatBytes(transfer.size)}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider mt-1">
                                      Concluído • {transfer.direction === 'sending' ? 'Enviado' : 'Recebido'}
                                    </div>
                                  </div>

                                  <div className="flex-shrink-0 ml-1">
                                    {transfer.direction === 'receiving' && transfer.data && (
                                      <button 
                                        onClick={() => handleDownload(transfer)}
                                        className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                        title="Baixar"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {transfer.direction === 'sending' && (
                                      <div className="p-1.5 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                                        <Check className="w-3.5 h-3.5" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* SUB-VIEW 2: CLIPBOARD / NOTES CHAT */}
                  {activeTab === 'chat' && (
                    <div className="flex-1 flex flex-col justify-between h-full animate-in fade-in duration-300 min-h-[360px]">
                      
                      <div className="space-y-3 flex-1 flex flex-col">
                        <h4 className="text-[9px] font-extrabold text-white/35 uppercase tracking-widest pl-1 mb-2">
                          Área de Notas ({messages.length})
                        </h4>

                        {messages.length === 0 ? (
                          <div className="flex-1 border border-white/5 bg-black/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3.5">
                            <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/5">
                              <Clipboard className="w-6 h-6 text-white/20" />
                            </div>
                            <div className="max-w-[200px] space-y-1">
                              <span className="text-[10px] text-white/40 block font-bold uppercase tracking-wider">Notas Compartilhadas</span>
                              <p className="text-[9px] text-white/30 leading-relaxed">
                                Envie links, senhas ou notas rápidas abaixo. Eles aparecem nos clipboards instantaneamente.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 space-y-3 max-h-72 overflow-y-auto pr-1.5 custom-scrollbar pb-4">
                            {messages.map(msg => {
                              const isSent = msg.direction === 'sending';
                              const isTextLink = isLink(msg.content);
                              
                              return (
                                <div 
                                  key={msg.id} 
                                  className={cn(
                                    "flex w-full animate-in slide-in-from-bottom-2 duration-200",
                                    isSent ? "justify-end" : "justify-start"
                                  )}
                                >
                                  <div className={cn(
                                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[11px] border flex flex-col gap-2 relative shadow-md",
                                    isSent 
                                      ? "bg-sky-500/10 border-sky-400/20 text-sky-100 rounded-tr-none" 
                                      : "bg-white/5 border-white/10 text-white/90 rounded-tl-none"
                                  )}>
                                    
                                    <div className="break-all font-medium leading-relaxed">
                                      {isTextLink ? (
                                        <a 
                                          href={msg.content} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-sky-400 hover:text-sky-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                                        >
                                          {msg.content}
                                        </a>
                                      ) : (
                                        msg.content
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between gap-6 pt-1 border-t border-white/5">
                                      <span className="text-[8px] text-white/30 font-medium">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      
                                      <button
                                        onClick={() => copyToClipboard(msg.content, 'Nota copiada!')}
                                        className="text-[8px] text-white/40 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
                                        title="Copiar para clipboard"
                                      >
                                        <Copy className="w-2.5 h-2.5" /> Copiar
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={chatBottomRef} />
                          </div>
                        )}
                      </div>

                      {/* Chat Note Send Input */}
                      <form onSubmit={submitChat} className="flex gap-2.5 pt-4 border-t border-white/5">
                        <label htmlFor="chat-input" className="sr-only">Escrever nota...</label>
                        <input 
                          id="chat-input"
                          type="text"
                          placeholder="Escrever nota ou colar URL..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="flex-1 liquid-glass-input px-4 py-2.5 text-xs"
                          required
                          maxLength={1000}
                          autoComplete="off"
                        />
                        <button 
                          type="submit"
                          className="liquid-glass-button p-2.5 flex items-center justify-center cursor-pointer aspect-square"
                          title="Enviar nota"
                        >
                          <Send className="w-4 h-4 text-sky-300" />
                        </button>
                      </form>

                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
