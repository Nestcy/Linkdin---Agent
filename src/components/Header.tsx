import React from 'react';
import { Sparkles, Trash2, RefreshCw, AlertCircle, Clock, PanelLeft } from 'lucide-react';
import { BackendHealth } from '../types';

interface HeaderProps {
  health: BackendHealth | null;
  healthLoading: boolean;
  healthError: string | null;
  onRefreshHealth: () => void;
  onClearChat: () => void;
  messageCount: number;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  healthLoading,
  healthError,
  onRefreshHealth,
  onClearChat,
  messageCount,
  sidebarOpen,
  onToggleSidebar,
}) => {
  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 bg-[#0f0f0f] shrink-0 z-30">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Toggle configuration sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        <div className="w-8 h-8 bg-[#0077b5] rounded-md flex items-center justify-center shrink-0 shadow-md shadow-[#0077b5]/20">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-gray-100 truncate">
              LinkedIn Reflection Agent
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0077b5]/10 text-[#0077b5] border border-[#0077b5]/20">
              <Sparkles className="w-2.5 h-2.5" />
              Groq Powered
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Backend Connected Indicator */}
        {healthLoading ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
            <span className="text-xs font-medium text-amber-400 hidden sm:inline">Connecting...</span>
          </div>
        ) : health ? (
          <div 
            className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full"
            title={`LLM: ${health.llm} • Model: ${health.model || 'Groq Fast'}`}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-400">
              <span className="hidden sm:inline">Backend </span>Connected
            </span>
          </div>
        ) : (
          <button
            onClick={onRefreshHealth}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 hover:text-rose-300 transition-colors text-xs font-medium"
            title={healthError || 'Backend unreachable. Click to retry.'}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Offline</span>
            <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform" />
          </button>
        )}

        {/* Clear Chat Button */}
        {messageCount > 0 && (
          <button
            id="clear-chat-button"
            onClick={onClearChat}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-colors text-xs flex items-center gap-1"
            title="Clear current conversation"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Clear</span>
          </button>
        )}
      </div>
    </header>
  );
};

