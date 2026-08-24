import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (type: 'info' | 'success' | 'warning' | 'error', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message }]);
    setTimeout(() => {
      dismissToast(id);
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    let rawSocketUrl = ((import.meta as any).env?.VITE_API_URL || 'http://localhost:5000').trim();
    if (rawSocketUrl && !rawSocketUrl.startsWith('http://') && !rawSocketUrl.startsWith('https://')) {
      rawSocketUrl = `https://${rawSocketUrl}`;
    }
    const newSocket = io(rawSocketUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('transaction:updated', (data) => {
      const tx = data.transaction;
      if (tx?.status === 'COMMITTED') {
        addToast('success', 'Transaction Committed', `${tx.transactionNumber} allocated ${tx.resourceType} ${tx.resourceId}`);
      } else if (tx?.status === 'ESCALATED') {
        addToast('warning', 'Transaction Escalated', `${tx.transactionNumber} escalated due to priority conflict`);
      } else if (tx?.status === 'ROLLED_BACK') {
        addToast('error', 'Transaction Rolled Back', `${tx.transactionNumber} compensation completed, state rolled back`);
      }
    });

    newSocket.on('conflict:created', (data) => {
      addToast('error', 'Conflict Alert', data.conflict?.reason || 'Resource Conflict Detected!');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, toasts, dismissToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-xl border flex items-start justify-between text-white transition-all transform animate-bounce-short ${
              toast.type === 'success'
                ? 'bg-emerald-800 border-emerald-600'
                : toast.type === 'warning'
                ? 'bg-amber-800 border-amber-600'
                : toast.type === 'error'
                ? 'bg-rose-900 border-rose-600'
                : 'bg-sky-800 border-sky-600'
            }`}
          >
            <div>
              <div className="font-bold text-sm">{toast.title}</div>
              <div className="text-xs opacity-90 mt-1">{toast.message}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-3 text-white/80 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
}
