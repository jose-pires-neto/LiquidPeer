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

export function usePeer(options?: UsePeerOptions) {
  const [peerId, setPeerId] = useState<string | null>(null);
  const [peer, setPeer] = useState<Peer | null>(null);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [state, setState] = useState<PeerState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [connectionStage, setConnectionStage] = useState<string>('');
  const [transfers, setTransfers] = useState<Record<string, FileTransfer>>({});
  const [messages, setMessages] = useState<PeerMessage[]>([]);

  const receiveBuffers = useRef<Record<string, Blob[]>>({});
  const receivingFiles = useRef<Record<string, ReceivingFileInfo>>({});

  const onConnectRef = useRef(options?.onConnect);
  const onDisconnectRef = useRef(options?.onDisconnect);

  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConnRef = useRef<DataConnection | null>(null);

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

  const handleIncomingData = useCallback((data: TransferMessage) => {
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

      setTransfers(prev => ({
        ...prev,
        [data.id]: {
          ...prev[data.id],
          progress,
          speed,
          eta,
        },
      }));
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
    } else if (data.type === 'text') {
      setMessages(prev => [
        ...prev,
        {
          id: data.id,
          content: data.content,
          direction: 'receiving',
          timestamp: data.timestamp,
        },
      ]);
    }
  }, []);

  const setupConnection = useCallback(
    (conn: DataConnection) => {
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
    },
    [handleIncomingData],
  );

  const initializePeer = useCallback(
    (id?: string) => {
      if (peer) {
        peer.destroy();
      }

      const newPeer = id ? new Peer(id) : new Peer();

      newPeer.on('open', (openedId) => {
        setPeerId(openedId);
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
    },
    [peer, setupConnection],
  );

  const connectToPeer = useCallback(
    (targetId: string) => {
      let activePeer = peer;

      setState('connecting');
      setError(null);
      setConnectionStage('Buscando dispositivo...');

      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }

      const performConnect = (p: Peer) => {
        const transitionTimer = setTimeout(() => {
          setConnectionStage('Estabelecendo canal seguro...');
        }, STAGE_TRANSITION_DELAY_MS);

        const conn = p.connect(targetId, { reliable: true });
        pendingConnRef.current = conn;
        setupConnection(conn);

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
    },
    [peer, initializePeer, setupConnection],
  );

  const sendFile = useCallback(
    async (file: File) => {
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
          eta: 0,
        },
      }));

      connection.send({
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
        connection.send({ type: 'file-chunk', id: fileId, chunk });

        offset += chunk.byteLength;

        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
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
            eta,
          },
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
              eta: 0,
            },
          }));
        }
      };

      readNextChunk();
    },
    [connection, state],
  );

  const sendText = useCallback(
    (content: string) => {
      if (!connection || state !== 'connected') return;

      const id = Math.random().toString(36).substring(7);
      const msg = {
        type: 'text' as const,
        id,
        content,
        timestamp: Date.now(),
      };
      connection.send(msg);

      setMessages(prev => [
        ...prev,
        { id, content, direction: 'sending', timestamp: msg.timestamp },
      ]);
    },
    [connection, state],
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
    setMessages([]);
    receivingFiles.current = {};
    receiveBuffers.current = {};
    onDisconnectRef.current?.();
  }, [connection, peer]);

  return {
    peerId,
    state,
    error,
    connectionStage,
    transfers: Object.values(transfers),
    messages,
    initializePeer,
    connectToPeer,
    sendFile,
    sendText,
    disconnect,
  };
}
