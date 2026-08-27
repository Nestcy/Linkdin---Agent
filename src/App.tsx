import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { PromptSuggestions, PROMPT_TEMPLATES } from './components/PromptSuggestions';
import { LinkedInPreviewModal } from './components/LinkedInPreviewModal';
import { BackendHealth, ChatMessage } from './types';
import { checkBackendHealth, generatePost } from './services/api';
import confetti from 'canvas-confetti';
import { Sparkles, Trash2, Info, ChevronRight, X, FileText } from 'lucide-react';

const STORAGE_KEY_MESSAGES = 'linkedin_reflection_messages_v1';

export default function App() {
  // Backend Health State
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Preview Modal State
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewCopied, setPreviewCopied] = useState<boolean>(false);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage (excluding in-flight sending states)
  useEffect(() => {
    try {
      const persistable = messages.filter((m) => m.status !== 'sending');
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(persistable));
    } catch {
      // Ignore
    }
  }, [messages]);

  // Check Backend Health on Mount
  const fetchHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await checkBackendHealth();
      setHealth(data);
    } catch (err: unknown) {
      setHealth(null);
      const msg = err instanceof Error ? err.message : 'Backend unreachable';
      setHealthError(msg);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Auto-scroll on new messages or loading changes
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send Message Logic
  const handleSendMessage = async (promptToSend?: string) => {
    const rawPrompt = (promptToSend || input).trim();
    if (!rawPrompt || isLoading) return;

    const userMsgId = `user_${Date.now()}`;
    const assistantMsgId = `assistant_${Date.now()}`;

    // Add user message
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: rawPrompt,
      timestamp: Date.now(),
      status: 'success',
    };

    // Add loading assistant placeholder
    const assistantPlaceholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'sending',
      rawPrompt: rawPrompt,
    };

    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    if (!promptToSend) {
      setInput('');
    }
    setIsLoading(true);

    const startTime = Date.now();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await generatePost(
        {
          prompt: rawPrompt,
        },
        abortController.signal
      );

      const durationMs = Date.now() - startTime;

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === assistantMsgId) {
            return {
              ...msg,
              content: response.final_post,
              iterations: response.iterations,
              reflectionHistory: response.reflection_history,
              status: 'success',
              requestDurationMs: durationMs,
            };
          }
          return msg;
        })
      );
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const isAbort = (err as { name?: string })?.name === 'AbortError';
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Something went wrong while refining your post. Please try again.';

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === assistantMsgId) {
            return {
              ...msg,
              content: '',
              status: 'error',
              errorMessage: isAbort ? 'Generation was cancelled.' : errorMessage,
              requestDurationMs: durationMs,
            };
          }
          return msg;
        })
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRetry = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleEditPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear all conversation history?')) {
      setMessages([]);
      try {
        localStorage.removeItem(STORAGE_KEY_MESSAGES);
      } catch {
        // Ignore
      }
    }
  };

  const handleOpenPreview = (content: string) => {
    setPreviewContent(content);
    setPreviewCopied(false);
  };

  const handleCopyPreview = async () => {
    if (!previewContent) return;
    try {
      await navigator.clipboard.writeText(previewContent);
      setPreviewCopied(true);
      try {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#0077b5', '#38bdf8', '#60a5fa'],
        });
      } catch {
        // Fallback silently
      }
      setTimeout(() => setPreviewCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0a0a0a] text-gray-100 selection:bg-[#0077b5]/30">
      {/* Top Header */}
      <Header
        health={health}
        healthLoading={healthLoading}
        healthError={healthError}
        onRefreshHealth={fetchHealth}
        onClearChat={handleClearChat}
        messageCount={messages.length}
        sidebarOpen={mobileSidebarOpen}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Desktop / Responsive Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-72 bg-[#0c0c0c] border-r border-white/5 p-6 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="space-y-6 overflow-y-auto pr-1">
            {/* Mobile close bar */}
            <div className="flex items-center justify-between lg:hidden pb-2 border-b border-white/5">
              <span className="text-xs font-semibold text-gray-300">Prompt Templates</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Starters */}
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#0077b5]" />
                <span>Prompt Templates</span>
              </div>
              <div className="space-y-1.5">
                {PROMPT_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(tpl.prompt);
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 hover:border-[#0077b5]/30 border border-transparent transition-all group flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-300 group-hover:text-white font-medium truncate pr-2">
                      {tpl.title}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#0077b5] shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Info card */}
            <div className="p-3.5 rounded-xl bg-[#0077b5]/5 border border-[#0077b5]/15 text-xs text-gray-400 space-y-2">
              <div className="flex items-center gap-1.5 text-gray-200 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#0077b5]" />
                <span>Automated Reflection</span>
              </div>
              <p className="text-[11px] leading-relaxed text-gray-400">
                The agent automatically drafts, critiques hooks, and self-reflects before producing your polished LinkedIn post.
              </p>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <Info className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span>Session stored locally in browser</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="w-full text-left text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1.5 py-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear session history</span>
              </button>
            )}
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs lg:hidden"
          />
        )}

        {/* Main Content Area (Chat + Input) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] relative">
          {/* Scrollable Messages Canvas */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <PromptSuggestions onSelectPrompt={(prompt) => setInput(prompt)} />
              </div>
            ) : (
              <div className="max-w-4xl w-full mx-auto space-y-2 flex-1">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onRetry={handleRetry}
                    onEditPrompt={handleEditPrompt}
                    onPreviewLinkedIn={handleOpenPreview}
                  />
                ))}
                <div ref={chatBottomRef} />
              </div>
            )}
          </main>

          {/* Bottom Chat Input */}
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={() => handleSendMessage()}
            isLoading={isLoading}
            onCancel={handleCancel}
          />
        </div>
      </div>

      {/* LinkedIn Feed Simulator Preview Modal */}
      <LinkedInPreviewModal
        isOpen={previewContent !== null}
        onClose={() => setPreviewContent(null)}
        postContent={previewContent || ''}
        onCopy={handleCopyPreview}
        copied={previewCopied}
      />
    </div>
  );
}

