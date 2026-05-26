// Application view routing
export type ViewState = 'home' | 'host' | 'join' | 'transfer';

// Tab states for transfer view
export type TabState = 'transfer' | 'files' | 'chat';

// Peer connection states
export type PeerState = 'disconnected' | 'connecting' | 'connected' | 'error';

// File transfer tracking
export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'error';
  direction: 'sending' | 'receiving';
  data?: Blob;
  speed?: number;
  eta?: number;
  startTime?: number;
}

// Chat/notes message
export interface PeerMessage {
  id: string;
  content: string;
  direction: 'sending' | 'receiving';
  timestamp: number;
}

// Wire protocol messages
export type TransferMessage =
  | { type: 'file-start'; id: string; name: string; size: number }
  | { type: 'file-chunk'; id: string; chunk: ArrayBuffer }
  | { type: 'file-end'; id: string }
  | { type: 'text'; id: string; content: string; timestamp: number };

// Toast notification
export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

// Peer hook options
export interface UsePeerOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
}
