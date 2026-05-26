import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import type {
  PeerState,
  FileTransfer,
  PeerMessage,
  TransferMessage,
  UsePeerOptions,
} from '../types';
import {
  CHUNK_SIZE,
  CONNECTION_TIMEOUT_MS,
  STAGE_TRANSITION_DELAY_MS,
} from '../constants';

export type { FileTransfer, PeerMessage };

interface ReceivingFileInfo {
  id: string;
  name: string;
  size: number;
  received: number;
  startTime: number;
}

let sessionInitials: string | null = null;

// Generate device metadata (type, OS, system initials)
export const getLocalMetadata = () => {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  
  let os = 'OS Desconhecido';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iPhone';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Chrome';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';

  const osName = `${os} ${browser}`;

  // Generate 2 random letters for unique device identification in the room
  if (!sessionInitials) {
    try {
      const saved = localStorage.getItem('liquidpeer_initials');
      if (saved && saved.length === 2) {
        sessionInitials = saved;
      } else {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const first = chars[Math.floor(Math.random() * chars.length)];
        const second = chars[Math.floor(Math.random() * chars.length)];
        sessionInitials = `${first}${second}`;
        localStorage.setItem('liquidpeer_initials', sessionInitials);
      }
    } catch {
      // Fallback if localStorage fails or is disabled
      sessionInitials = isMobile ? 'MB' : 'DK';
    }
  }

  return {
    deviceType: (isMobile ? 'mobile' : 'desktop') as 'mobile' | 'desktop',
    osName,
    initials: sessionInitials,
  };
};

export function usePeer(options?: UsePeerOptions) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connections, setConnections] = useState<Record<string, DataConnection>>({});
  const [peersRegistry, setPeersRegistry] = useState<Record<string, { id: string; deviceType: 'mobile' | 'desktop'; osName: string; initials: string }>>({});
  const [state, setState] = useState<PeerState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [connectionStage, setConnectionStage] = useState<string>('');
  const [transfers, setTransfers] = useState<Record<string, FileTransfer>>({});
  const [messages, setMessages] = useState<PeerMessage[]>([]);

  // Refs for tracking mutable state in event listeners to avoid stale closures
  const peerIdRef = useRef<string | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Record<string, DataConnection>>({});
  const peersRegistryRef = useRef<Record<string, { id: string; deviceType: 'mobile' | 'desktop'; osName: string; initials: string }>>({});

  useEffect(() => {
    peerIdRef.current = peerId;
  }, [peerId]);

  useEffect(() => {
    peerRef.current = peer;
  }, [peer]);

  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  useEffect(() => {
    peersRegistryRef.current = peersRegistry;
  }, [peersRegistry]);

  const receiveBuffers = useRef<Record<string, Blob[]>>({});
  const receivingFiles = useRef<Record<string, ReceivingFileInfo>>({});

  // Throttle refs: timestamps of last progress setState per transfer ID
  // Prevents flooding React with hundreds of setTransfers/s during chunk sending/receiving.
  const sendProgressThrottleRef = useRef<Record<string, number>>({});
  const recvProgressThrottleRef = useRef<Record<string, number>>({});
  const PROGRESS_THROTTLE_MS = 100; // max 10 UI updates/s per transfer

  const onConnectRef = useRef(options?.onConnect);
  const onDisconnectRef = useRef(options?.onDisconnect);

  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConnRef = useRef<DataConnection | null>(null);
  const setupConnectionRef = useRef<(conn: DataConnection) => void>(() => {});

  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    onConnectRef.current = options?.onConnect;
    onDisconnectRef.current = options?.onDisconnect;
  }, [options?.onConnect, options?.onDisconnect]);

  const handleIncomingData = useCallback((data: TransferMessage, senderPeerId: string) => {
    if (data.type === 'file-start') {
      const now = Date.now();
      receivingFiles.current[data.id] = {
        id: data.id,
        name: data.name,
        size: data.size,
        received: 0,
        startTime: now,
      };
      receiveBuffers.current[data.id] = [];

      setTransfers(prev => ({
        ...prev,
        [data.id]: {
          id: data.id,
          name: data.name,
          size: data.size,
          progress: 0,
          status: 'transferring',
          direction: 'receiving',
          startTime: now,
          speed: 0,
          eta: 0,
          peerId: senderPeerId,
          peerName: peersRegistryRef.current[senderPeerId]?.osName || 'Par',
        },
      }));
    } else if (data.type === 'file-chunk') {
      const fileInfo = receivingFiles.current[data.id];
      if (!fileInfo) return;

      const chunk = new Blob([data.chunk]);
      if (!receiveBuffers.current[data.id]) {
        receiveBuffers.current[data.id] = [];
      }
      receiveBuffers.current[data.id].push(chunk);
      fileInfo.received += chunk.size;

      const now = Date.now();
      const elapsed = (now - fileInfo.startTime) / 1000;
      const speed = elapsed > 0 ? fileInfo.received / elapsed : 0;
      const remainingBytes = fileInfo.size - fileInfo.received;
      const eta = speed > 0 ? remainingBytes / speed : 0;
      const progress = (fileInfo.received / fileInfo.size) * 100;

      // Throttle: only update React state every PROGRESS_THROTTLE_MS on receiving side
      const lastRecvUpdate = recvProgressThrottleRef.current[data.id] || 0;
      if (now - lastRecvUpdate >= PROGRESS_THROTTLE_MS) {
        recvProgressThrottleRef.current[data.id] = now;
        setTransfers(prev => ({
          ...prev,
          [data.id]: {
            ...prev[data.id],
            progress,
            speed,
            eta,
          },
        }));
      }
    } else if (data.type === 'file-end') {
      const fileInfo = receivingFiles.current[data.id];
      if (!fileInfo) return;

      const fileBlob = new Blob(receiveBuffers.current[data.id] || []);
      setTransfers(prev => ({
        ...prev,
        [data.id]: {
          ...prev[data.id],
          progress: 100,
          status: 'completed',
          data: fileBlob,
          speed: 0,
          eta: 0,
        },
      }));

      delete receivingFiles.current[data.id];
      delete receiveBuffers.current[data.id];
      delete recvProgressThrottleRef.current[data.id];
    } else if (data.type === 'text') {
      setMessages(prev => [
        ...prev,
        {
          id: data.id,
          content: data.content,
          direction: 'receiving',
          timestamp: data.timestamp,
          peerId: senderPeerId,
          peerName: peersRegistryRef.current[senderPeerId]?.osName || 'Par',
        },
      ]);
    }
  }, []);

  const handleIncomingDataRef = useRef(handleIncomingData);
  useEffect(() => {
    handleIncomingDataRef.current = handleIncomingData;
  }, [handleIncomingData]);

  const setupConnection = useCallback(
    (conn: DataConnection) => {
      conn.on('open', () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        pendingConnRef.current = null;

        // Register the active connection
        setConnections(prev => {
          const next = { ...prev, [conn.peer]: conn };
          
          // Host (6-character ID) broadcasts the updated peer registry list to all nodes
          const isHost = peerIdRef.current && peerIdRef.current.length === 6;
          if (isHost) {
            const hostMeta = getLocalMetadata();
            const allPeers = [
              { id: peerIdRef.current!, ...hostMeta },
              ...Object.keys(next).map(id => {
                const meta = (next[id].metadata || {}) as { deviceType?: 'mobile' | 'desktop'; osName?: string; initials?: string };
                return {
                  id,
                  deviceType: meta.deviceType || 'desktop',
                  osName: meta.osName || 'Par',
                  initials: meta.initials || 'PC',
                };
              }),
            ];
            
            Object.values(next).forEach(c => {
              c.send({
                type: 'peer-list',
                peers: allPeers,
              });
            });
          }

          return next;
        });

        // Add metadata to local registry
        const meta = (conn.metadata || { deviceType: 'desktop', osName: 'Par', initials: 'PC' }) as { deviceType?: 'mobile' | 'desktop'; osName?: string; initials?: string };
        setPeersRegistry(prev => ({
          ...prev,
          [conn.peer]: {
            id: conn.peer,
            deviceType: meta.deviceType || 'desktop',
            osName: meta.osName || 'Par',
            initials: meta.initials || 'PC',
          },
        }));

        setState('connected');
        onConnectRef.current?.();
      });

      conn.on('data', (data: unknown) => {
        const msg = data as TransferMessage;
        if (msg.type === 'peer-list') {
          const receivedPeers = msg.peers;
          
          setPeersRegistry(prev => {
            const next = { ...prev };
            receivedPeers.forEach(p => {
              // Ensure we strictly filter out the user's own peerId to prevent self-connection
              if (p.id !== peerIdRef.current) {
                next[p.id] = p;
              }
            });
            return next;
          });

          // WebRTC mesh direct peer connection (Tie-breaker using ID comparison)
          receivedPeers.forEach(p => {
            if (
              p.id !== peerIdRef.current && 
              p.id !== conn.peer && 
              peerIdRef.current && 
              peerIdRef.current < p.id
            ) {
              setConnections(currentConns => {
                if (!currentConns[p.id] && peerRef.current) {
                  const targetConn = peerRef.current.connect(p.id, { 
                    reliable: true,
                    metadata: getLocalMetadata(),
                  });
                  setupConnectionRef.current(targetConn);
                }
                return currentConns;
              });
            }
          });
        } else {
          handleIncomingDataRef.current(msg, conn.peer);
        }
      });

      conn.on('close', () => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        pendingConnRef.current = null;

        setConnections(prev => {
          const next = { ...prev };
          delete next[conn.peer];

          // Host broadcasts the updated peer registry list on disconnect
          const isHost = peerIdRef.current && peerIdRef.current.length === 6;
          if (isHost) {
            const hostMeta = getLocalMetadata();
            const allPeers = [
              { id: peerIdRef.current!, ...hostMeta },
              ...Object.keys(next).map(id => {
                const meta = (next[id].metadata || {}) as { deviceType?: 'mobile' | 'desktop'; osName?: string; initials?: string };
                return {
                  id,
                  deviceType: meta.deviceType || 'desktop',
                  osName: meta.osName || 'Par',
                  initials: meta.initials || 'PC',
                };
              }),
            ];
            
            Object.values(next).forEach(c => {
              c.send({
                type: 'peer-list',
                peers: allPeers,
              });
            });
          }

          if (Object.keys(next).length === 0) {
            setState('disconnected');
            onDisconnectRef.current?.();
          }

          return next;
        });

        setPeersRegistry(prev => {
          const next = { ...prev };
          delete next[conn.peer];
          return next;
        });
      });

      conn.on('error', (err) => {
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        pendingConnRef.current = null;
        setError(err.message);
        setState('error');
      });
    },
    [],
  );

  useEffect(() => {
    setupConnectionRef.current = setupConnection;
  }, [setupConnection]);

  const initializePeer = useCallback(
    (id?: string) => {
      if (peerRef.current) {
        peerRef.current.destroy();
      }

      const newPeer = id ? new Peer(id) : new Peer();

      newPeer.on('open', (openedId) => {
        setPeerId(openedId);
        setPeer(newPeer);
      });

      newPeer.on('connection', (conn) => {
        // Enforce max 6 participants check (5 active connections)
        setConnections(currentConns => {
          if (Object.keys(currentConns).length >= 5) {
            conn.on('open', () => {
              conn.send({
                type: 'text',
                id: 'system',
                content: 'A sala está cheia! (Máximo de 6 participantes)',
                timestamp: Date.now(),
              });
              setTimeout(() => conn.close(), 1000);
            });
          } else {
            setupConnectionRef.current(conn);
          }
          return currentConns;
        });
      });

      newPeer.on('error', (err) => {
        setError(err.message);
        setState('error');
      });

      return newPeer;
    },
    [],
  );

  const connectToPeer = useCallback(
    (targetId: string) => {
      let activePeer = peerRef.current;

      setState('connecting');
      setError(null);
      setConnectionStage('Buscando dispositivo...');

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }

      const performConnect = (p: Peer) => {
        if (Object.keys(connectionsRef.current).length >= 5) {
          setError('A sala está cheia! (Máximo de 6 participantes)');
          setState('error');
          return;
        }

        const transitionTimer = setTimeout(() => {
          setConnectionStage('Estabelecendo canal seguro...');
        }, STAGE_TRANSITION_DELAY_MS);

        const conn = p.connect(targetId, { 
          reliable: true,
          metadata: getLocalMetadata(),
        });
        pendingConnRef.current = conn;
        setupConnectionRef.current(conn);

        connectionTimeoutRef.current = setTimeout(() => {
          clearTimeout(transitionTimer);
          if (pendingConnRef.current === conn) {
            conn.close();
            pendingConnRef.current = null;
            setError('Não foi possível encontrar o dispositivo. Verifique se o código está correto.');
            setState('error');
          }
        }, CONNECTION_TIMEOUT_MS);
      };

      if (!activePeer) {
        activePeer = initializePeer();
      }

      // Guard against double-connect: performConnect is called at most once,
      // regardless of whether the peer was already open or fires 'open' later.
      let hasConnected = false;
      const safePerformConnect = (p: Peer) => {
        if (hasConnected) return;
        hasConnected = true;
        performConnect(p);
      };

      if (activePeer.open) {
        safePerformConnect(activePeer);
      } else {
        activePeer.once('open', () => {
          safePerformConnect(activePeer!);
        });
        activePeer.once('error', (err) => {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          setError(err.message);
          setState('error');
        });
      }
    },
    [initializePeer],
  );

  const sendFile = useCallback(
    async (file: File, targetPeerId?: string) => {
      // Use ref snapshots to always read the latest connections,
      // avoiding stale closure issues when new peers join between renders.
      const currentConns = connectionsRef.current;
      const currentRegistry = peersRegistryRef.current;

      const targets = targetPeerId && targetPeerId !== 'all'
        ? (currentConns[targetPeerId] ? [currentConns[targetPeerId]] : [])
        : Object.values(currentConns);

      if (targets.length === 0) return;

      targets.forEach(async (conn) => {
        // Timestamp prefix ensures uniqueness across concurrent transfers
        const fileId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;
        const startTime = Date.now();
        
        setTransfers(prev => ({
          ...prev,
          [fileId]: {
            id: fileId,
            name: file.name,
            size: file.size,
            progress: 0,
            status: 'transferring',
            direction: 'sending',
            startTime,
            speed: 0,
            eta: 0,
            peerId: conn.peer,
            peerName: currentRegistry[conn.peer]?.osName || 'Par',
          },
        }));

        conn.send({
          type: 'file-start',
          id: fileId,
          name: file.name,
          size: file.size,
        });

        let offset = 0;
        const reader = new FileReader();

        const readNextChunk = () => {
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          reader.readAsArrayBuffer(slice);
        };

        reader.onload = (e) => {
          if (e.target?.readyState !== FileReader.DONE) return;

          const chunk = e.target.result as ArrayBuffer;
          conn.send({ type: 'file-chunk', id: fileId, chunk });

          offset += chunk.byteLength;

          const now = Date.now();
          const elapsed = (now - startTime) / 1000;
          const speed = elapsed > 0 ? offset / elapsed : 0;
          const remainingBytes = file.size - offset;
          const eta = speed > 0 ? remainingBytes / speed : 0;
          const progress = (offset / file.size) * 100;

          if (offset < file.size) {
            // Throttle: only update React state every PROGRESS_THROTTLE_MS on sending side
            const lastSendUpdate = sendProgressThrottleRef.current[fileId] || 0;
            if (now - lastSendUpdate >= PROGRESS_THROTTLE_MS) {
              sendProgressThrottleRef.current[fileId] = now;
              setTransfers(prev => ({
                ...prev,
                [fileId]: { ...prev[fileId], progress, speed, eta },
              }));
            }
            setTimeout(readNextChunk, 1);
          } else {
            delete sendProgressThrottleRef.current[fileId];
            conn.send({ type: 'file-end', id: fileId });
            setTransfers(prev => ({
              ...prev,
              [fileId]: {
                ...prev[fileId],
                progress: 100,
                status: 'completed',
                speed: 0,
                eta: 0,
              },
            }));
          }
        };

        readNextChunk();
      });
    },
    [],
  );

  const sendText = useCallback(
    (content: string) => {
      const activeConns = Object.values(connections);
      if (activeConns.length === 0) return;

      const id = Math.random().toString(36).substring(7);
      const msg = {
        type: 'text' as const,
        id,
        content,
        timestamp: Date.now(),
      };
      
      activeConns.forEach(conn => {
        conn.send(msg);
      });

      setMessages(prev => [
        ...prev,
        { id, content, direction: 'sending', timestamp: msg.timestamp },
      ]);
    },
    [connections],
  );

  const disconnect = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (pendingConnRef.current) {
      pendingConnRef.current.close();
      pendingConnRef.current = null;
    }
    Object.values(connections).forEach(conn => {
      conn.close();
    });
    if (peer) {
      peer.destroy();
    }
    setState('disconnected');
    setPeerId(null);
    setPeer(null);
    setConnections({});
    setPeersRegistry({});
    setTransfers({});
    setMessages([]);
    receivingFiles.current = {};
    receiveBuffers.current = {};
    onDisconnectRef.current?.();
  }, [connections, peer]);

  return {
    peerId,
    state,
    error,
    connectionStage,
    transfers: Object.values(transfers),
    messages,
    peers: Object.values(peersRegistry),
    initializePeer,
    connectToPeer,
    sendFile,
    sendText,
    disconnect,
  };
}
