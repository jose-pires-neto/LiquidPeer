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
        "border border-dashed rounded-2xl flex flex-col items-center justify-center min-h-[190px] p-6 transition-all duration-300 relative overflow-hidden",
        isDragging
          ? "border-sky-400 bg-sky-400/5 scale-[1.01]"
          : "border-white/5 bg-black/20 hover:bg-white/[0.01]",
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
          <span className="text-[11px] font-bold text-sky-200 mt-6 tracking-wide">
            Solte para Enviar Líquido
          </span>
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
  );
}
