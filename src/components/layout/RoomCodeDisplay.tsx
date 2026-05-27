import { cn } from '../../lib/utils';

interface RoomCodeDisplayProps {
  code: string;
}

const WOBBLE_CLASSES = [
  'animate-wobble-slow-1',
  'animate-wobble-slow-2',
  'animate-wobble-slow-3',
] as const;

/**
 * Renders a room code as a row of animated glassmorphic letter bubbles.
 * Used in HostView and ShareRoomModal to avoid duplication.
 */
export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  return (
    <div className="flex gap-1 sm:gap-2 justify-center">
      {code.toUpperCase().split('').map((char, index) => (
        <div
          key={index}
          className={cn(
            'w-8 h-11 sm:w-10 sm:h-13 rounded-2xl flex items-center justify-center font-mono text-lg sm:text-xl font-extrabold text-sky-200 border border-white/20 bg-white/10 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.35),0_4px_10px_rgba(0,0,0,0.25)] relative overflow-hidden',
            WOBBLE_CLASSES[index % 3],
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.12] to-transparent pointer-events-none" />
          <span className="relative z-10">{char}</span>
        </div>
      ))}
    </div>
  );
}
