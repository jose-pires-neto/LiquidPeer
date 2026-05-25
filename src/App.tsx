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
  File as FileIcon
} from 'lucide-react';
import { usePeer, type FileTransfer } from './hooks/usePeer';
import { cn } from './lib/utils';

type ViewState = 'home' | 'host' | 'join' | 'transfer';

interface ScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

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
  
  // QR Scanner States
  const [showScanner, setShowScanner] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    peerId, 
    state: peerState, 
    error: peerError, 
    connectionStage,
    transfers, 
    initializePeer, 
    connectToPeer, 
    sendFile, 
    disconnect 
  } = usePeer({
    onConnect: () => {
      setView('transfer');
      setShowScanner(false);
    },
    onDisconnect: () => {
      setView('home');
      setJoinId('');
    }
  });

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
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

  const activeTransfer = transfers.find(t => t.status === 'transferring');
  const isSending = activeTransfer?.direction === 'sending';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative select-none">
      
      <main className="w-full max-w-md z-10 liquid-glass-panel p-6 md:p-8 transition-all duration-500 relative">
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
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { disconnect(); setView('home'); setShowScanner(false); }} role="button">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
              <Share2 className="text-sky-300 w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">P2Drop</h1>
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
                className="text-[9px] font-semibold text-white/40 hover:text-rose-300 bg-white/5 hover:bg-rose-500/10 px-2 py-1 rounded-md border border-white/5 transition-all"
              >
                Desconectar
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
                className="relative w-36 h-36 rounded-full liquid-glass-card flex flex-col items-center justify-center gap-2 group cursor-pointer border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.35)]"
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
                <h2 className="text-lg font-bold text-white/90">Envio P2P Minimalista</h2>
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
                className="text-[10px] text-white/40 hover:text-white/80 flex items-center gap-1 transition-colors"
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
                className="text-[10px] text-white/40 hover:text-white/80 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            </div>
          )}

          {/* 4. TRANSFER VIEW */}
          {!showScanner && view === 'transfer' && (
            <div className="flex flex-col h-full justify-between animate-in fade-in duration-300">
              
              {/* Glass connection tube with flowing bubble drops (Minimalist visual) */}
              <div className="flex items-center justify-between w-full px-4 py-3 liquid-glass-card mb-5 border border-white/5">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                    <Smartphone className="w-5 h-5 text-white/70" />
                  </div>
                  <span className="text-[8px] font-bold text-white/50">Meu Device</span>
                </div>
                
                {/* Physical Glass Tube showing actual floating liquid droplets */}
                <div className="flex-1 px-3.5 relative flex items-center justify-center">
                  <div className="relative h-4 w-full rounded-full bg-black/45 border border-white/10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] overflow-hidden flex items-center">
                    
                    {/* Glowing light flow filling */}
                    <div className={cn(
                      "absolute top-0 bottom-0 bg-sky-500/10 blur-[1px] transition-all duration-500",
                      activeTransfer ? "w-full" : "w-0"
                    )} />
                    
                    {/* Animated bubbles traveling inside */}
                    {activeTransfer && (
                      <div className="absolute inset-0 pointer-events-none">
                        {isSending ? (
                          <>
                            <div className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-sky-300/80 shadow-[0_0_4px_rgba(14,165,233,0.8)] animate-bubble-right-1 -translate-y-1/2" />
                            <div className="absolute top-1/2 w-2 h-2 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,1)] animate-bubble-right-2 -translate-y-1/2" />
                            <div className="absolute top-1/2 w-1 h-1 rounded-full bg-sky-200/70 shadow-[0_0_3px_rgba(125,211,252,0.6)] animate-bubble-right-3 -translate-y-1/2" />
                          </>
                        ) : (
                          <>
                            <div className="absolute top-1/2 w-1.5 h-1.5 rounded-full bg-sky-300/80 shadow-[0_0_4px_rgba(14,165,233,0.8)] animate-bubble-left-1 -translate-y-1/2" />
                            <div className="absolute top-1/2 w-2 h-2 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,1)] animate-bubble-left-2 -translate-y-1/2" />
                            <div className="absolute top-1/2 w-1 h-1 rounded-full bg-sky-200/70 shadow-[0_0_3px_rgba(125,211,252,0.6)] animate-bubble-left-3 -translate-y-1/2" />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                    <Laptop className="w-5 h-5 text-white/70" />
                  </div>
                  <span className="text-[8px] font-bold text-white/50">Remoto</span>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div 
                className={cn(
                  "border border-dashed rounded-2xl flex flex-col items-center justify-center p-6 transition-all duration-300 relative overflow-hidden",
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
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleFileSelect}
                  title=""
                />
                
                <div className="p-2.5 rounded-xl bg-white/[0.02] mb-2 border border-white/5">
                  <UploadCloud className="w-6 h-6 text-white/35 animate-float" />
                </div>
                <h3 className="text-xs font-semibold mb-0.5 text-white/80">Arraste arquivos aqui</h3>
                <p className="text-[9px] text-white/30">ou clique para selecionar</p>
              </div>

              {/* Transfers Queue */}
              {transfers.length > 0 && (
                <div className="mt-5 space-y-2 w-full">
                  <h4 className="text-[8px] font-bold text-white/30 uppercase tracking-widest pl-1">
                    Arquivos em Trânsito ({transfers.length})
                  </h4>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {transfers.map(transfer => {
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
                            
                            {/* Glass cylinder progress bar containing animated fluid waves inside */}
                            <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mt-1.5 relative border border-white/5 shadow-inner">
                              <div 
                                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-blue-600/80 to-sky-400/80 relative overflow-hidden"
                                style={{ width: `${transfer.progress}%` }}
                              >
                                {/* Dual-layer fluid wave animations */}
                                {transfer.status === 'transferring' && (
                                  <>
                                    {/* Front wave */}
                                    <div className="absolute inset-0 w-[200%] h-full animate-wave-flow opacity-30 text-white pointer-events-none">
                                      <svg className="h-full w-full" viewBox="0 0 200 20" preserveAspectRatio="none">
                                        <path d="M0,10 C50,15 50,5 100,10 C150,15 150,5 200,10 L200,20 L0,20 Z" fill="currentColor" />
                                      </svg>
                                    </div>
                                    {/* Back wave */}
                                    <div className="absolute inset-0 w-[200%] h-full animate-wave-flow-slow opacity-15 text-white pointer-events-none" style={{ animationDirection: 'reverse' }}>
                                      <svg className="h-full w-full" viewBox="0 0 200 20" preserveAspectRatio="none">
                                        <path d="M0,10 C50,5 50,15 100,10 C150,5 150,15 200,10 L200,20 L0,20 Z" fill="currentColor" />
                                      </svg>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-between mt-1 text-[9px] font-medium text-white/35">
                              <span className="uppercase tracking-wide">
                                {transfer.status === 'completed' ? (
                                  <span className="text-emerald-400">Concluído</span>
                                ) : (
                                  <>
                                    {transfer.direction === 'sending' ? 'Enviando' : 'Recebendo'} • {formatSpeed(transfer.speed)}
                                  </>
                                )}
                              </span>
                              <span className="text-white/60">
                                {transfer.status !== 'completed' && transfer.eta !== undefined && transfer.eta > 0 
                                  ? formatEta(transfer.eta) 
                                  : `${Math.round(transfer.progress)}%`
                                }
                              </span>
                            </div>
                          </div>

                          {/* Complete Actions */}
                          <div className="flex-shrink-0 ml-1">
                            {transfer.status === 'completed' && transfer.direction === 'receiving' && (
                              <button 
                                onClick={() => handleDownload(transfer)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                title="Baixar"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                            
                            {transfer.status === 'completed' && transfer.direction === 'sending' && (
                              <div className="p-1.5 rounded-lg bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                            
                            {transfer.status === 'transferring' && (
                              <div className="w-6 h-6 flex items-center justify-center">
                                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-sky-400 rounded-full animate-spin"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
