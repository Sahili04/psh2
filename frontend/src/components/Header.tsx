import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Activity, LogOut, ShieldCheck, User } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  return (
    <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-xl text-white shadow">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">MediVerse</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-sky-100 text-sky-700 border border-sky-200 rounded-full">
                AUTHENTICATED
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isConnected ? 'Real-Time Broadcaster Active' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Role Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-sky-600" />
          <span className="text-slate-600">Role: <strong className="text-sky-700 font-mono">{user?.role}</strong></span>
        </div>

        {/* User Profile Info & Sign Out */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900">{user?.name}</div>
            <div className="text-[11px] text-slate-500 font-mono">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 bg-rose-50/50 rounded-xl border border-rose-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
