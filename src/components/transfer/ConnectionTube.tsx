import { useState, useEffect, useRef } from 'react';
import { Smartphone, Laptop, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import type { FileTransfer } from '../../types';
import { cn } from '../../lib/utils';

interface ConnectionTubeProps {
  activeTransfer?: FileTransfer;
  isSending: boolean;
  transfers?: FileTransfer[];
  peers: { id: string; deviceType: 'mobile' | 'desktop'; osName: string; initials: string }[];
  onSendFile: (file: File, targetPeerId: string) => void;
  onInviteClick?: () => void;
}

interface PhysicsNode {
  id: string;
  isLocal: boolean;
  initials: string;
  osName: string;
  deviceType: 'mobile' | 'desktop';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface PhysicsParticle {
  id: string;
  transferId: string;
  sourceId: string;
  targetId: string;
  t: number;
  speed: number;
  size: number;
  offsetX: number;
  offsetY: number;
}

interface BurstParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export function ConnectionTube({
  transfers = [],
  peers = [],
  onSendFile,
  onInviteClick,
}: ConnectionTubeProps) {
  const [isLocalMobile] = useState(() => 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
  
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<PhysicsNode[]>([]);
  const particlesRef = useRef<PhysicsParticle[]>([]);
  const burstsRef = useRef<BurstParticle[]>([]);
  const prevTransfersRef = useRef<Record<string, string>>({});
  const draggedNodeIdRef = useRef<string | null>(null);

  // Refs for tracking drag coordinates to ignore clicks during drag-to-move
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Hidden file input refs for click-to-share
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPeerIdRef = useRef<string | null>(null);

  const handlePeerBubbleClick = (peerId: string) => {
    selectedPeerIdRef.current = peerId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedPeerIdRef.current) {
      const peerId = selectedPeerIdRef.current;
      Array.from(e.target.files).forEach(file => {
        onSendFile(file, peerId);
      });
    }
  };

  const [nodesState, setNodesState] = useState<PhysicsNode[]>([]);
  const [particlesState, setParticlesState] = useState<PhysicsParticle[]>([]);
  const [burstsState, setBurstsState] = useState<BurstParticle[]>([]);
  const [hoveredPeerId, setHoveredPeerId] = useState<string | null>(null);
  const [isDraggingOverContainer, setIsDraggingOverContainer] = useState(false);

  // Sync prop changes to refs for the physics loop to read without resetting the animation loop
  const transfersRef = useRef(transfers);
  useEffect(() => {
    transfersRef.current = transfers;
  }, [transfers]);

  // Reconcile graph nodes whenever peers or layout parameters change
  useEffect(() => {
    const requiredIds = new Set<string>();
    requiredIds.add('local');
    peers.forEach(p => requiredIds.add(p.id));

    // If there are no peers, add an interactive Invite node to the graph
    const hasPeers = peers.length > 0;
    if (!hasPeers) {
      requiredIds.add('invite');
    }

    // Filter out removed nodes
    const currentNodes = nodesRef.current.filter(n => requiredIds.has(n.id));

    const W = containerRef.current?.clientWidth || 600;
    const H = containerRef.current?.clientHeight || 280;

    // Add new nodes or update existing node properties
    requiredIds.forEach(id => {
      const exists = currentNodes.some(n => n.id === id);
      if (!exists) {
        if (id === 'local') {
          currentNodes.push({
            id: 'local',
            isLocal: true,
            initials: 'Você',
            osName: 'Seu Dispositivo',
            deviceType: isLocalMobile ? 'mobile' : 'desktop',
            x: W / 2,
            y: H / 2 + 25,
            vx: 0,
            vy: 0,
            radius: 44,
          });
        } else if (id === 'invite') {
          currentNodes.push({
            id: 'invite',
            isLocal: false,
            initials: '+',
            osName: 'Convidar',
            deviceType: 'desktop',
            x: W / 2 + 80,
            y: H / 2 - 35,
            vx: 0,
            vy: 0,
            radius: 36,
          });
        } else {
          const peer = peers.find(p => p.id === id);
          if (peer) {
            // Spawn new peers in a random offset near the center
            const angle = Math.random() * Math.PI * 2;
            const distance = 90 + Math.random() * 40;
            currentNodes.push({
              id: peer.id,
              isLocal: false,
              initials: peer.initials,
              osName: peer.osName,
              deviceType: peer.deviceType,
              x: W / 2 + Math.cos(angle) * distance,
              y: H / 2 + Math.sin(angle) * distance - 25,
              vx: 0,
              vy: 0,
              radius: 40,
            });
          }
        }
      } else {
        // Update peer dynamic initials/OS details if modified
        const node = currentNodes.find(n => n.id === id);
        if (node && id !== 'local' && id !== 'invite') {
          const peer = peers.find(p => p.id === id);
          if (peer) {
            node.initials = peer.initials;
            node.osName = peer.osName;
            node.deviceType = peer.deviceType;
          }
        }
      }
    });

    nodesRef.current = currentNodes;
    setNodesState([...currentNodes]);
  }, [peers, isLocalMobile]);

  // Dynamic 2D Physics Loop (Verlet-like Euler spring simulation + boundary collisions)
  useEffect(() => {
    let animFrameId: number;
    let ticks = 0;

    const updatePhysics = () => {
      ticks++;
      if (!containerRef.current) {
        animFrameId = requestAnimationFrame(updatePhysics);
        return;
      }

      const W = containerRef.current.clientWidth;
      const H = containerRef.current.clientHeight;
      const cx = W / 2;
      const cy = H / 2;

      const nodes = [...nodesRef.current];

      // 1. Force Calculations (Center attraction gravity + mutual repulsion)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (draggedNodeIdRef.current === node.id) continue;

        // Weak pull to center of layout to keep clusters floating together
        const dx = cx - node.x;
        const dy = cy - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const gravity = node.isLocal ? 0.025 : 0.045;
        
        node.vx += (dx / dist) * gravity;
        node.vy += (dy / dist) * gravity;

        // Repel from all other nodes to prevent bubbles overlap
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const rdx = other.x - node.x;
          const rdy = other.y - node.y;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy) + 0.001;
          const minDist = node.radius + other.radius + 38; // spacing

          if (rdist < minDist) {
            const overlap = minDist - rdist;
            const force = overlap * 0.12; // Repulsion spring stiffness
            const ax = (rdx / rdist) * force;
            const ay = (rdy / rdist) * force;

            if (draggedNodeIdRef.current !== node.id) {
              node.vx -= ax;
              node.vy -= ay;
            }
            if (draggedNodeIdRef.current !== other.id) {
              other.vx += ax;
              other.vy += ay;
            }
          }
        }
      }

      // 2. Integration and Border Bound Collisions
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (draggedNodeIdRef.current === node.id) continue;

        // Apply air resistance / friction
        node.vx *= 0.84;
        node.vy *= 0.84;

        node.x += node.vx;
        node.y += node.vy;

        // Collide against left/right container boundaries
        if (node.x < node.radius + 8) {
          node.x = node.radius + 8;
          node.vx = -node.vx * 0.15;
        } else if (node.x > W - node.radius - 8) {
          node.x = W - node.radius - 8;
          node.vx = -node.vx * 0.15;
        }

        // Collide against top/bottom container boundaries
        if (node.y < node.radius + 8) {
          node.y = node.radius + 8;
          node.vy = -node.vy * 0.15;
        } else if (node.y > H - node.radius - 8) {
          node.y = H - node.radius - 8;
          node.vy = -node.vy * 0.15;
        }
      }

      nodesRef.current = nodes;
      setNodesState([...nodes]);

      // 3. Spawning and Moving Iridescent Particles (File Transfer Streams)
      let particles = [...particlesRef.current];
      const activeTransfers = transfersRef.current;

      activeTransfers.forEach(transfer => {
        if (transfer.status !== 'transferring' || !transfer.peerId) return;

        const sourceId = transfer.direction === 'sending' ? 'local' : transfer.peerId;
        const targetId = transfer.direction === 'sending' ? transfer.peerId : 'local';

        const sourceNode = nodes.find(n => n.id === sourceId);
        const targetNode = nodes.find(n => n.id === targetId);
        if (!sourceNode || !targetNode) return;

        // Accelerated spawn density: spawn more frequently as progress grows
        const progressVal = transfer.progress || 0;
        const spawnInterval = Math.max(3, Math.floor(25 - progressVal * 0.2));

        if (ticks % spawnInterval === 0) {
          particles.push({
            id: Math.random().toString(36).substring(7),
            transferId: transfer.id,
            sourceId,
            targetId,
            t: 0,
            speed: 0.007 + (progressVal / 100) * 0.016, // Accelerated speed
            size: 2.5 + Math.random() * 4.5,
            offsetX: (Math.random() - 0.5) * 14,
            offsetY: (Math.random() - 0.5) * 14,
          });
        }
      });

      // Update particle progress positions
      particles = particles.map(p => ({
        ...p,
        t: p.t + p.speed,
      }));

      // Detect arrivals at target to create small splash bursts
      const remainingParticles: PhysicsParticle[] = [];
      const newBursts: BurstParticle[] = [];

      particles.forEach(p => {
        if (p.t >= 1.0) {
          const targetNode = nodes.find(n => n.id === p.targetId);
          if (targetNode) {
            // Spawn 3 micro-splashes on impact
            for (let k = 0; k < 3; k++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 0.6 + Math.random() * 1.6;
              newBursts.push({
                id: Math.random().toString(36).substring(7),
                x: targetNode.x,
                y: targetNode.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.4,
                size: 1.5 + Math.random() * 2,
                alpha: 0.9,
                color: '#38bdf8',
              });
            }
          }
        } else {
          remainingParticles.push(p);
        }
      });

      particlesRef.current = remainingParticles;
      setParticlesState(remainingParticles);

      // 4. Trigger Major Burst Splash on File Transfer Completion
      activeTransfers.forEach(transfer => {
        const prevStatus = prevTransfersRef.current[transfer.id];
        if (transfer.status === 'completed' && prevStatus && prevStatus !== 'completed') {
          const targetId = transfer.direction === 'sending' ? transfer.peerId : 'local';
          const targetNode = nodes.find(n => n.id === targetId);

          if (targetNode) {
            // Spawn 18 large radial splash burst particles
            for (let i = 0; i < 18; i++) {
              const angle = (i / 18) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
              const speed = 1.6 + Math.random() * 3.6;
              newBursts.push({
                id: Math.random().toString(36).substring(7),
                x: targetNode.x,
                y: targetNode.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.8, // slight upward float bias
                size: 2.2 + Math.random() * 3.8,
                alpha: 1.0,
                color: '#7dd3fc',
              });
            }
          }
        }
        prevTransfersRef.current[transfer.id] = transfer.status;
      });

      // 5. Update active splash burst states (fades out and descends slightly)
      let bursts = [...burstsRef.current, ...newBursts];
      bursts = bursts
        .map(b => ({
          ...b,
          x: b.x + b.vx,
          y: b.y + b.vy,
          vy: b.vy + 0.05, // gravity drift
          vx: b.vx * 0.94, // dampening
          alpha: b.alpha - 0.024, // fading
        }))
        .filter(b => b.alpha > 0);

      burstsRef.current = bursts;
      setBurstsState(bursts);

      animFrameId = requestAnimationFrame(updatePhysics);
    };

    animFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  // Handle Dragging of Bubbles
  const handleStartDrag = (nodeId: string) => {
    if (!containerRef.current) return;
    draggedNodeIdRef.current = nodeId;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggedNodeIdRef.current || !containerRef.current) return;
      const moveX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const moveY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const r = containerRef.current.getBoundingClientRect();
      
      const px = moveX - r.left;
      const py = moveY - r.top;

      // Track drag movement to avoid triggering bubble click when dragging
      if (dragStartPosRef.current) {
        const dx = moveX - dragStartPosRef.current.x;
        const dy = moveY - dragStartPosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 6) {
          hasMovedRef.current = true;
        }
      }

      nodesRef.current = nodesRef.current.map(n => {
        if (n.id === draggedNodeIdRef.current) {
          return { ...n, x: px, y: py, vx: 0, vy: 0 };
        }
        return n;
      });
    };

    const handleEnd = () => {
      draggedNodeIdRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
  };

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingOverContainer(true);
      }}
      onDragLeave={() => {
        setIsDraggingOverContainer(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOverContainer(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          Array.from(e.dataTransfer.files).forEach(file => {
            onSendFile(file, 'all'); // Dragged to general area -> Broadcast to all
          });
        }
      }}
      className={cn(
        "min-h-[290px] w-full flex flex-col justify-between items-center relative rounded-3xl p-4 sm:p-6 bg-white/[0.01] border overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.4),inset_0_1px_1.5px_rgba(255,255,255,0.15)] backdrop-blur-xl transition-colors duration-300 select-none",
        isDraggingOverContainer ? "border-sky-500/40 bg-sky-500/[0.02]" : "border-white/10"
      )}
    >
      {/* Liquid background accent blobs */}
      <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* SVG Canvas for Mesh lines and particle flows */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="liquid-line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.25)" />
            <stop offset="100%" stopColor="rgba(14, 165, 233, 0.05)" />
          </linearGradient>
        </defs>

        {/* Complete mesh network links connecting all nodes */}
        {nodesState.map((nodeA, idxA) =>
          nodesState.slice(idxA + 1).map(nodeB => {
            const isInviteLink = nodeA.id === 'invite' || nodeB.id === 'invite';
            return (
              <line
                key={`${nodeA.id}-${nodeB.id}`}
                x1={nodeA.x}
                y1={nodeA.y}
                x2={nodeB.x}
                y2={nodeB.y}
                stroke="url(#liquid-line-gradient)"
                strokeWidth={isInviteLink ? "1.2" : "1.8"}
                strokeDasharray={isInviteLink ? "4 4" : undefined}
                className="transition-all duration-100"
              />
            );
          })
        )}

        {/* Transfer stream bubble particles */}
        {particlesState.map(p => {
          const source = nodesState.find(n => n.id === p.sourceId);
          const target = nodesState.find(n => n.id === p.targetId);
          if (!source || !target) return null;

          const px = source.x + (target.x - source.x) * p.t + p.offsetX;
          const py = source.y + (target.y - source.y) * p.t + p.offsetY;

          return (
            <circle
              key={p.id}
              cx={px}
              cy={py}
              r={p.size}
              fill="#38bdf8"
              filter="drop-shadow(0 0 3px rgba(56, 189, 248, 0.75))"
            />
          );
        })}

        {/* Burst splash micro-bubbles */}
        {burstsState.map(b => (
          <circle
            key={b.id}
            cx={b.x}
            cy={b.y}
            r={b.size}
            fill={b.color}
            opacity={b.alpha}
            filter="drop-shadow(0 0 2px rgba(125, 211, 252, 0.8))"
          />
        ))}
      </svg>

      {/* HTML Render layer for interactive glassmorphic nodes */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-10">
        {nodesState.map(node => {
          // Identify transfer states
          const nodeActiveTransfer = transfers.find(
            t => t.peerId === node.id && t.status === 'transferring'
          );
          const activeReceivingTransfer = transfers.find(
            t => t.direction === 'receiving' && t.status === 'transferring'
          );
          const activeSendingTransfer = transfers.find(
            t => t.direction === 'sending' && t.status === 'transferring'
          );

          const progress = node.isLocal
            ? (activeReceivingTransfer ? Math.round(activeReceivingTransfer.progress) : 0)
            : (nodeActiveTransfer ? Math.round(nodeActiveTransfer.progress) : 0);

          const direction = node.isLocal
            ? (activeReceivingTransfer ? 'receiving' : activeSendingTransfer ? 'sending' : undefined)
            : (nodeActiveTransfer?.direction);

          const isHovered = hoveredPeerId === node.id;
          const wobbleClass = node.isLocal
            ? "animate-wobble-slow-1"
            : node.id === 'invite'
              ? "animate-pulse-slow"
              : "animate-wobble-slow-2";

          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 select-none"
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                zIndex: node.isLocal ? 30 : 20,
              }}
              onMouseDown={(e) => {
                if (node.id === 'invite') return;
                e.preventDefault();
                dragStartPosRef.current = { x: e.clientX, y: e.clientY };
                hasMovedRef.current = false;
                handleStartDrag(node.id);
              }}
              onTouchStart={(e) => {
                if (node.id === 'invite') return;
                dragStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                hasMovedRef.current = false;
                handleStartDrag(node.id);
              }}
              onDragOver={(e) => {
                if (node.isLocal || node.id === 'invite') return;
                e.preventDefault();
                setHoveredPeerId(node.id);
              }}
              onDragLeave={() => {
                setHoveredPeerId(null);
              }}
              onDrop={(e) => {
                if (node.isLocal || node.id === 'invite') return;
                e.preventDefault();
                e.stopPropagation(); // Stop propagation to container
                setHoveredPeerId(null);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  Array.from(e.dataTransfer.files).forEach(file => {
                    onSendFile(file, node.id); // Dragged to specific bubble -> Targeted send
                  });
                }
              }}
              onClick={() => {
                if (hasMovedRef.current) return; // Prevent click triggering on drag release
                if (node.id === 'invite' && onInviteClick) {
                  onInviteClick();
                } else if (!node.isLocal && node.id !== 'invite') {
                  handlePeerBubbleClick(node.id);
                }
              }}
            >
              {/* The Bubble Card */}
              <div
                className={cn(
                  "rounded-full flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 border",
                  node.id === 'invite'
                    ? "border-dashed border-sky-400/35 hover:border-sky-400 bg-white/[0.01] hover:bg-sky-500/5 cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]"
                    : node.isLocal
                      ? "border-white/25"
                      : isHovered
                        ? "border-sky-400 bg-sky-500/15 scale-[1.08] shadow-[0_0_25px_rgba(56,189,248,0.35),inset_0_1px_1.5px_rgba(255,255,255,0.35)] animate-liquid-ripple border-solid"
                        : "border-white/20 hover:scale-105",
                  node.id !== 'invite' && "liquid-soap-bubble",
                  wobbleClass
                )}
                style={{ width: `${node.radius * 2}px`, height: `${node.radius * 2}px` }}
              >
                {/* Wave Progress Overlay */}
                {progress > 0 && direction && (
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 transition-all duration-300 pointer-events-none",
                      direction === 'sending' ? "bg-sky-400/25" : "bg-cyan-400/25"
                    )}
                    style={{ height: `${progress}%` }}
                  >
                    <div className="absolute top-0 left-1/2 w-[220%] h-[220%] bg-sky-300/15 rounded-[38%] -translate-y-[88%] animate-wave-spin pointer-events-none" />
                  </div>
                )}

                {/* Inner Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  {node.id === 'invite' ? (
                    <>
                      <Plus className="w-5 h-5 text-sky-300/80 group-hover:text-sky-200 transition-colors" />
                      <span className="text-[7.5px] font-black text-white/35 tracking-wider uppercase mt-0.5">
                        Convidar
                      </span>
                    </>
                  ) : node.isLocal ? (
                    <>
                      {isLocalMobile ? (
                        <Smartphone className="w-5 h-5 text-sky-200 opacity-80" />
                      ) : (
                        <Laptop className="w-5 h-5 text-sky-200 opacity-80" />
                      )}
                      {progress > 0 ? (
                        <span className="text-[9px] font-black text-white tracking-wide animate-pulse mt-0.5">
                          {progress}%
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-bold text-white/50 tracking-wider uppercase mt-0.5">
                          Você
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-extrabold text-sky-200 tracking-wider">
                        {node.initials}
                      </span>
                      {progress > 0 ? (
                        <span className="text-[8px] font-black text-white tracking-wide animate-pulse flex items-center gap-0.5 mt-0.5">
                          {direction === 'sending' ? (
                            <ArrowUp className="w-2 h-2 text-sky-300" />
                          ) : (
                            <ArrowDown className="w-2 h-2 text-cyan-300" />
                          )}
                          {progress}%
                        </span>
                      ) : (
                        <span className="text-[7.5px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
                          Par
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Device type badge for connected peers */}
                {!node.isLocal && node.id !== 'invite' && (
                  <div className="absolute bottom-1 right-1 w-4.5 h-4.5 rounded-full bg-[#050814]/85 border border-white/10 flex items-center justify-center shadow-md">
                    {node.deviceType === 'mobile' ? (
                      <Smartphone className="w-2 h-2 text-sky-300/80" />
                    ) : (
                      <Laptop className="w-2 h-2 text-sky-300/80" />
                    )}
                  </div>
                )}
              </div>

              {/* Label underneath */}
              {node.id !== 'invite' && (
                <div className="mt-1 flex flex-col items-center pointer-events-none">
                  <span className="text-[8px] font-bold text-white/40 truncate max-w-[85px] text-center">
                    {node.isLocal ? 'Você' : node.osName}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden file input for specific peer click-to-share */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />
    </div>
  );
}
