import { useState, useCallback } from 'react';
import type { Toast } from '../types';
import { TOAST_DURATION_MS } from '../constants';

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  return { toasts, showToast };
}
