import React, { useRef, useEffect } from 'react';
import { Send, Square, CornerDownLeft, Sparkles } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  onCancel?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isLoading,
  onCancel,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-[#0f0f0f] border-t border-white/5 shrink-0 z-20">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Input Box */}
        <div className="relative">
          <textarea
            id="chat-prompt-input"
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your initial LinkedIn post draft or topic idea..."
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 pb-12 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#0077b5] resize-none transition-colors leading-relaxed min-h-[72px] max-h-[200px]"
            disabled={isLoading}
          />

          {/* Controls Bar inside Textarea */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            {/* Left Status */}
            <div className="flex items-center gap-2 pointer-events-auto">
              <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0c0c0c] border border-white/5">
                <Sparkles className="w-3 h-3 text-[#0077b5]" />
                {input.length > 0 ? `${input.length} chars` : 'Ready'}
              </span>
            </div>

            {/* Right Action Button */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {isLoading ? (
                <button
                  id="cancel-generation-button"
                  type="button"
                  onClick={onCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  id="send-prompt-button"
                  type="button"
                  onClick={onSend}
                  disabled={!input.trim()}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors shadow-sm ${
                    input.trim()
                      ? 'bg-[#0077b5] hover:bg-[#00669c] text-white active:scale-95'
                      : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                  }`}
                >
                  <span>Refine Post</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer shortcuts note */}
        <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest px-1 font-mono">
          <span className="flex items-center gap-1 normal-case tracking-normal text-gray-400">
            <CornerDownLeft className="w-3 h-3 text-gray-500" />
            <span>Enter to Send • Shift+Enter for newline</span>
          </span>
          <span className="hidden sm:inline">
            Groq Multi-Pass Refinement
          </span>
        </div>
      </div>
    </div>
  );
};

