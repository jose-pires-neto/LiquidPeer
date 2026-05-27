import { useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function DropZone({ onFilesSelected }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFilesSelected(Array.from(e.dataTransfer.files));
      }
    },
    [onFilesSelected],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      className={cn(
        "border flex flex-col items-center justify-center min-h-[140px] sm:min-h-[170px] lg:min-h-[200px] p-4 sm:p-6 transition-all duration-500 relative overflow-hidden",
        isDragging
          ? "border-sky-400/45 bg-sky-500/10 scale-[1.02] shadow-[0_0_35px_rgba(56,189,248,0.25)] animate-liquid-ripple rounded-[42%_58%_72%_28%/52%_62%_38%_48%] border-solid"
          : "border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/20 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
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
        <div className="absolute inset-0 bg-[#040712]/75 backdrop-blur-[4px] flex flex-col items-center justify-center pointer-events-none z-30 animate-in fade-in duration-300">
          <div className="w-18 h-18 rounded-full bg-sky-500/25 border border-sky-400/40 animate-wobble-slow-2 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3),inset_0_4px_10px_rgba(255,255,255,0.2)]">
            <UploadCloud className="w-7 h-7 text-white animate-bounce" />
          </div>
          <span className="text-[11px] font-bold text-sky-200 mt-5 tracking-wide">
            Solte para Enviar
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pointer-events-none">
          {/* Miniature soap bubble for resting upload icon */}
          <div className="w-12 h-12 rounded-full liquid-soap-bubble flex items-center justify-center mb-3.5 animate-wobble-slow-1 shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-white/15">
            <UploadCloud className="w-5.5 h-5.5 text-sky-200 opacity-90" />
          </div>
          <h3 className="text-sm sm:text-xs font-bold mb-1 text-white/80">Arraste arquivos aqui</h3>
          <p className="text-[10px] text-white/35">ou clique para navegar</p>
        </div>
      )}
    </div>
  );
}
