import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { QR_SCANNER_FPS, QR_BOX_RATIO, CAMERA_START_DELAY_MS } from '../../constants';

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
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
            fps: QR_SCANNER_FPS,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * QR_BOX_RATIO;
              return { width: size, height: size };
            },
          },
          (qrCodeMessage) => {
            if (qrCodeMessage) {
              onScan(qrCodeMessage);
            }
          },
          () => {},
        );
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
      }
    };

    const timer = setTimeout(() => {
      startCamera();
    }, CAMERA_START_DELAY_MS);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(err =>
          console.error("Error stopping scanner during unmount:", err),
        );
      }
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center justify-between h-full space-y-6 animate-in fade-in duration-300">
      <div className="text-center space-y-0.5">
        <h2 className="text-sm sm:text-base font-bold text-white">Escanear QR Code</h2>
        <p className="text-white/40 text-[11px]">Posicione o QR Code no centro da tela.</p>
      </div>

      {error ? (
        <div className="p-4 rounded-2xl bg-rose-500/[0.03] border border-rose-500/20 text-center space-y-2 max-w-[260px] sm:max-w-[280px] shadow-[0_8px_20px_rgba(244,63,94,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-sm relative overflow-hidden">
          {/* Specular sheen on error card */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto relative z-10" />
          <p className="text-rose-200 text-[11px] leading-relaxed relative z-10 font-medium">{error}</p>
        </div>
      ) : (
        <div className="relative w-full max-w-[220px] sm:max-w-[260px] aspect-square rounded-[36px] overflow-hidden border border-white/20 bg-[#040712]/50 shadow-[0_15px_35px_rgba(0,0,0,0.4),inset_0_-8px_20px_rgba(3,105,161,0.2),inset_0_8px_16px_rgba(255,255,255,0.2)] backdrop-blur-md flex items-center justify-center">
          {/* Glowing scanner corner frame */}
          <div className="absolute inset-6 border border-sky-400/25 rounded-[28px] pointer-events-none z-20 shadow-[0_0_15px_rgba(56,189,248,0.1),inset_0_0_15px_rgba(56,189,248,0.1)]">
            <div className="absolute top-0 left-0 w-4.5 h-4.5 border-t-2 border-l-2 border-sky-400 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-4.5 h-4.5 border-t-2 border-r-2 border-sky-400 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-4.5 h-4.5 border-b-2 border-l-2 border-sky-400 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-4.5 h-4.5 border-b-2 border-r-2 border-sky-400 rounded-br-xl" />
          </div>
          {/* Laser scanning line */}
          <div className="absolute left-6 right-6 h-[2.5px] bg-gradient-to-r from-transparent via-sky-400/70 to-transparent top-1/2 -translate-y-1/2 animate-pulse z-20 pointer-events-none shadow-[0_0_12px_rgba(56,189,248,0.5)]" />
          {/* Glass glare highlight */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 pointer-events-none z-20" />
          
          <div id="qr-reader" className="w-full h-full object-cover z-10" />
        </div>
      )}

      <button
        onClick={onClose}
        className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/15 text-white/50 hover:text-white/80 transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-sm"
      >
        <ArrowLeft className="w-3 h-3" /> Voltar
      </button>
    </div>
  );
}
