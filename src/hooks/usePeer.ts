import { useState, useCallback, useRef, useEffect } from 'react';
import Peer, { type DataConnection } from 'peerjs';

export type PeerState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'error';
  direction: 'sending' | 'receiving';
  data?: Blob;
  speed?: number; // bytes per second
  eta?: number;   // seconds remaining
  startTime?: number;
}

export type TransferMessage = 
  | { type: 'file-start'; id: string; name: string; size: number }
  | { type: 'file-chunk'; chunk: ArrayBuffer }
  | { type: 'file-end'; id: string };

export interface UsePeerOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function usePeer(options?: UsePeerOptions) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [state, setState] = useState<PeerState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [connectionStage, setConnectionStage] = useState<string>('');
  const [transfers, setTransfers] = useState<Record<string, FileTransfer>>({});

  const receiveBuffer = useRef<Blob[]>([]);
  const currentReceivingFile = useRef<{id: string, name: string, size: number, received: number, startTime: number} | null>(null);

  const onConnectRef = useRef(options?.onConnect);
  const onDisconnectRef = useRef(options?.onDisconnect);
  
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConnRef = useRef<DataConnection | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, []);

  // Keep callbacks up-to-date to avoid dependency changes
  useEffect(() => {
    onConnectRef.current = options?.onConnect;
    onDisconnectRef.current = options?.onDisconnect;
  }, [options?.onConnect, options?.onDisconnect]);

  // Handle incoming chunks and progress tracking
  const handleIncomingData = useCallback((data: TransferMessage) => {
    if (data.type === 'file-start') {
      const now = Date.now();
      currentReceivingFile.current = {
        id: data.id,
        name: data.name,
        size: data.size,
        received: 0,
        startTime: now
      };
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
          eta: 0
        }
      }));
      receiveBuffer.current = [];
    } else if (data.type === 'file-chunk') {
      if (!currentReceivingFile.current) return;
      
      const chunk = new Blob([data.chunk]);
      receiveBuffer.current.push(chunk);
      currentReceivingFile.current.received += chunk.size;
      
      const now = Date.now();
      const elapsed = (now - currentReceivingFile.current.startTime) / 1000; // seconds
      const speed = elapsed > 0 ? currentReceivingFile.current.received / elapsed : 0;
      const remainingBytes = currentReceivingFile.current.size - currentReceivingFile.current.received;
      const eta = speed > 0 ? remainingBytes / speed : 0;
      
      const progress = (currentReceivingFile.current.received / currentReceivingFile.current.size) * 100;
      
      const fileId = currentReceivingFile.current.id;
      setTransfers(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          progress,
          speed,
          eta
        }
      }));
    } else if (data.type === 'file-end') {
      if (!currentReceivingFile.current) return;
      
      const fileId = currentReceivingFile.current.id;
      const fileBlob = new Blob(receiveBuffer.current);
      setTransfers(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          progress: 100,
          status: 'completed',
          data: fileBlob,
          speed: 0,
          eta: 0
        }
      }));
      
      currentReceivingFile.current = null;
      receiveBuffer.current = [];
    }
  }, []);

  // Set up connection event handlers
  const setupConnection = useCallback((conn: DataConnection) => {
    conn.on('open', () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      pendingConnRef.current = null;
      setConnection(conn);
      setState('connected');
      onConnectRef.current?.();
    });

    conn.on('data', (data: unknown) => {
      handleIncomingData(data as TransferMessage);
    });

    conn.on('close', () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      pendingConnRef.current = null;
      setConnection(null);
      setState('disconnected');
      onDisconnectRef.current?.();
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
  }, [handleIncomingData]);

  // Initialize Peer
  const initializePeer = useCallback((id?: string) => {
    // If a peer already exists, destroy it before creating a new one to prevent orphaned connections
    if (peer) {
      peer.destroy();
    }

    const newPeer = id ? new Peer(id) : new Peer();
    
    newPeer.on('open', (id) => {
      setPeerId(id);
      setPeer(newPeer);
    });

    newPeer.on('connection', (conn) => {
      setupConnection(conn);
    });

    newPeer.on('error', (err) => {
      setError(err.message);
      setState('error');
    });

    return newPeer;
  }, [peer, setupConnection]);

  // Connect to target peer with asynchronous initialization safety
  const connectToPeer = useCallback((targetId: string) => {
    let activePeer = peer;
    
    setState('connecting');
    setError(null);
    setConnectionStage('Buscando dispositivo...');

    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
    
    const performConnect = (p: Peer) => {
      // Transition stage message after 1.5 seconds to "Estabelecendo canal seguro..."
      const transitionTimer = setTimeout(() => {
        setConnectionStage('Estabelecendo canal seguro...');
      }, 1500);

      const conn = p.connect(targetId, { reliable: true });
      pendingConnRef.current = conn;
      setupConnection(conn);

      // Start 12-second timeout
      connectionTimeoutRef.current = setTimeout(() => {
        clearTimeout(transitionTimer);
        if (pendingConnRef.current === conn) {
          conn.close();
          pendingConnRef.current = null;
          setError('Não foi possível encontrar o dispositivo. Verifique se o código está correto.');
          setState('error');
        }
      }, 12000);
    };

    if (!activePeer) {
      activePeer = initializePeer();
    }

    if (activePeer.open) {
      performConnect(activePeer);
    } else {
      activePeer.once('open', () => {
        performConnect(activePeer!);
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
  }, [peer, initializePeer, setupConnection]);

  // Slice and transmit file
  const sendFile = useCallback(async (file: File) => {
    if (!connection || state !== 'connected') return;

    const fileId = Math.random().toString(36).substring(7);
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
        eta: 0
      }
    }));

    connection.send({
      type: 'file-start',
      id: fileId,
      name: file.name,
      size: file.size
    });

    const chunkSize = 16384; // 16KB chunk size (reliable for WebRTC)
    let offset = 0;

    const reader = new FileReader();

    const readNextChunk = () => {
      const slice = file.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      if (e.target?.readyState !== FileReader.DONE) return;
      
      const chunk = e.target.result as ArrayBuffer;
      connection.send({
        type: 'file-chunk',
        chunk
      });

      offset += chunk.byteLength;
      
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // seconds
      const speed = elapsed > 0 ? offset / elapsed : 0;
      const remainingBytes = file.size - offset;
      const eta = speed > 0 ? remainingBytes / speed : 0;
      
      const progress = (offset / file.size) * 100;
      setTransfers(prev => ({
        ...prev,
        [fileId]: {
          ...prev[fileId],
          progress,
          speed,
          eta
        }
      }));

      if (offset < file.size) {
        setTimeout(readNextChunk, 1);
      } else {
        connection.send({ type: 'file-end', id: fileId });
        setTransfers(prev => ({
          ...prev,
          [fileId]: {
            ...prev[fileId],
            progress: 100,
            status: 'completed',
            speed: 0,
            eta: 0
          }
        }));
      }
    };

    readNextChunk();
  }, [connection, state]);

  // Clean disconnect
  const disconnect = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (pendingConnRef.current) {
      pendingConnRef.current.close();
      pendingConnRef.current = null;
    }
    if (connection) {
      connection.close();
    }
    if (peer) {
      peer.destroy();
    }
    setState('disconnected');
    setPeerId(null);
    setPeer(null);
    setConnection(null);
    setTransfers({});
    onDisconnectRef.current?.();
  }, [connection, peer]);

  return {
    peerId,
    state,
    error,
    connectionStage,
    transfers: Object.values(transfers),
    initializePeer,
    connectToPeer,
    sendFile,
    disconnect
  };
}
