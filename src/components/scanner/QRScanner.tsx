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
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 text-center space-y-2 max-w-[260px] sm:max-w-[280px]">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-rose-200 text-[11px] leading-relaxed">{error}</p>
        </div>
      ) : (
        <div className="relative w-full max-w-[220px] sm:max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl flex items-center justify-center">
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
        className="text-[11px] text-white/40 hover:text-white/80 flex items-center gap-1 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </button>
    </div>
  );
}
