import React, { useState, useEffect, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  RotateCcw, 
  AlertCircle, 
  Eye, 
  Brain, 
  CheckCircle2, 
  User, 
  Lightbulb,
  FileText,
  Clock,
} from 'lucide-react';
import { ChatMessage } from '../types';
import confetti from 'canvas-confetti';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (prompt: string, maxIterations?: number) => void;
  onEditPrompt?: (prompt: string) => void;
  onPreviewLinkedIn?: (content: string) => void;
}

/**
 * Extracts embedded <think>, <thought>, or <reasoning> tags, or explicit
 * Reflection Step markers from raw content so thinking process is segregated cleanly from the final LinkedIn post.
 * CRITICAL: Never hides or deletes text if parsing is ambiguous.
 */
function parseThinkingAndPost(rawContent: string, historyList: string[] = []) {
  const extractedThoughts: string[] = [];
  let cleanedPost = rawContent || '';

  if (!rawContent) {
    return {
      thoughts: historyList,
      cleanPost: '',
    };
  }

  // 1. Regex to extract closed <think>...</think>, <thought>...</thought>, <reasoning>...</reasoning>
  const thinkTagRegex = /<(?:think|thought|reasoning)>([\s\S]*?)<\/(?:think|thought|reasoning)>/gi;
  let match;
  while ((match = thinkTagRegex.exec(rawContent)) !== null) {
    if (match[1]?.trim()) {
      extractedThoughts.push(match[1].trim());
    }
  }

  // 2. Handle unclosed <think> tag if model was in the middle of thinking
  if (extractedThoughts.length === 0 && /<(?:think|thought|reasoning)>([\s\S]*)/i.test(rawContent)) {
    const unclosed = rawContent.match(/<(?:think|thought|reasoning)>([\s\S]*)/i);
    if (unclosed && unclosed[1]?.trim()) {
      extractedThoughts.push(unclosed[1].trim());
      // Strip only the think part for the clean post
      cleanedPost = rawContent.replace(/<(?:think|thought|reasoning)>[\s\S]*/i, '').trim();
    }
  } else if (extractedThoughts.length > 0) {
    cleanedPost = rawContent.replace(thinkTagRegex, '').trim();
  }

  // Combine explicit reflection history from API with extracted thought tokens
  const allThoughts = [...historyList, ...extractedThoughts];

  // SAFETY: If regex stripped everything because the entire model response was wrapped in think tags,
  // or if cleanPost is empty, preserve the raw output so nothing is cut off or lost on the frontend!
  if (!cleanedPost && rawContent) {
    cleanedPost = rawContent;
  }

  return {
    thoughts: allThoughts,
    cleanPost: cleanedPost.trim(),
  };
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onRetry,
  onEditPrompt,
  onPreviewLinkedIn,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedThinking, setCopiedThinking] = useState(false);
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer for loading state
  useEffect(() => {
    if (message.status === 'sending') {
      const interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [message.status]);

  // Parse out thinking tokens vs final clean post
  const { thoughts, cleanPost } = useMemo(() => {
    return parseThinkingAndPost(message.content, message.reflectionHistory || []);
  }, [message.content, message.reflectionHistory]);

  const displayPost = cleanPost || message.content;

  const handleCopyPost = async () => {
    if (!displayPost) return;
    try {
      await navigator.clipboard.writeText(displayPost);
      setCopied(true);
      
      try {
        confetti({
          particleCount: 25,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#0077b5', '#38bdf8', '#60a5fa'],
        });
      } catch {
        // Silent fallback
      }

      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyThinking = async () => {
    if (thoughts.length === 0) return;
    try {
      const thinkingText = thoughts.map((t, idx) => `[Iteration / Step ${idx + 1}]\n${t}`).join('\n\n');
      await navigator.clipboard.writeText(thinkingText);
      setCopiedThinking(true);
      setTimeout(() => setCopiedThinking(false), 2000);
    } catch {
      // Fallback
    }
  };

  const getLoadingStageText = (seconds: number) => {
    if (seconds < 5) return `Drafting initial post...`;
    if (seconds < 12) return `Running critique & self-reflection...`;
    if (seconds < 22) return `Polishing tone, hook & readability...`;
    if (seconds < 35) return `Refining structure & call to action...`;
    return `Finalizing draft...`;
  };

  // 1. User Message (Right-aligned, #0077b5)
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-[85%] sm:max-w-[80%] bg-[#0077b5] text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-lg shadow-blue-900/10 text-sm leading-relaxed whitespace-pre-wrap break-words selection:bg-[#005582]">
          <p>{message.content}</p>
        </div>
        <span className="text-[10px] text-gray-600 mt-1.5 uppercase tracking-wider font-mono">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  }

  // 2. Loading State Message (Elegant pulse & stages)
  if (message.status === 'sending') {
    const isColdStart = elapsedSeconds >= 12;

    return (
      <div className="flex flex-col items-start mb-6 animate-in fade-in duration-300">
        <div className="flex gap-3 max-w-[90%] w-full">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/5 text-gray-400 mt-1">
            <Lightbulb className="w-4 h-4 text-gray-400 animate-pulse" />
          </div>

          <div className="bg-[#161616] border border-white/5 p-5 rounded-2xl rounded-tl-none shadow-xl flex-1 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-[#0077b5] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#0077b5] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-[#0077b5] rounded-full animate-bounce"></div>
                </div>
                <span className="text-xs text-gray-300 font-medium">
                  {getLoadingStageText(elapsedSeconds)}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#0077b5] bg-[#0077b5]/10 px-2 py-0.5 rounded border border-[#0077b5]/20">
                {elapsedSeconds}s
              </span>
            </div>

            {/* Progress bar line */}
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0077b5] transition-all duration-500 ease-out"
                style={{ width: `${Math.min(95, Math.max(12, elapsedSeconds * 2.8))}%` }}
              />
            </div>

            {isColdStart && (
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-xs text-amber-300/90 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-amber-300">Waking up the server...</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Render free-tier instances sleep when idle. First response may take ~30–60s. Subsequent requests will be much faster.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <span className="text-[10px] text-gray-600 mt-2 ml-11 uppercase tracking-wider font-mono">
          Agent Reflection in Progress...
        </span>
      </div>
    );
  }

  // 3. Error State Message
  if (message.status === 'error') {
    return (
      <div className="flex flex-col items-start mb-6 animate-in fade-in duration-300">
        <div className="flex gap-3 max-w-[90%] w-full">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20 text-rose-400 mt-1">
            <AlertCircle className="w-4 h-4" />
          </div>

          <div className="bg-[#161616] border border-rose-500/20 p-5 rounded-2xl rounded-tl-none shadow-xl flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Generation Error
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <p className="text-xs text-gray-300 font-mono bg-[#0f0f0f] p-3 rounded-lg border border-white/5 whitespace-pre-wrap break-words">
              {message.errorMessage || 'Something went wrong, please try again'}
            </p>

            {message.errorMessage?.includes('500') && (
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] text-gray-400 space-y-1">
                <p className="font-semibold text-amber-400">Render 500 Error Troubleshooting:</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                  <li>Ensure <code className="text-amber-300 font-mono">GROQ_API_KEY</code> is set in Render Environment Variables.</li>
                  <li>Check the Python traceback in Render Logs for the exact exception details.</li>
                </ul>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {onRetry && message.rawPrompt && (
                <button
                  onClick={() => onRetry(message.rawPrompt!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0077b5] hover:bg-[#00669c] text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry Request
                </button>
              )}
              {onEditPrompt && message.rawPrompt && (
                <button
                  onClick={() => onEditPrompt(message.rawPrompt!)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
                >
                  Edit Prompt
                </button>
              )}
            </div>
          </div>
        </div>
        <span className="text-[10px] text-gray-600 mt-2 ml-11 uppercase tracking-wider font-mono">
          Assistant • Error
        </span>
      </div>
    );
  }

  // 4. Completed Assistant Reply (Refined Post & Thinking Dropdown)
  const totalIterations = message.iterations || (thoughts.length > 0 ? thoughts.length : 1);
  const wordCount = displayPost ? displayPost.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = displayPost ? displayPost.length : 0;

  return (
    <div className="flex flex-col items-start mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full">
      <div className="flex gap-3 max-w-[95%] sm:max-w-[90%] w-full">
        {/* Lightbulb Avatar */}
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/5 text-gray-400 mt-1">
          <Lightbulb className="w-4 h-4 text-gray-400" />
        </div>

        {/* Card Body */}
        <div className="bg-[#161616] border border-white/5 p-5 rounded-2xl rounded-tl-none shadow-xl flex-1 space-y-4 overflow-hidden">
          
          {/* Post Header Action Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs text-gray-400 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Refined Post
              </span>
              {thoughts.length > 0 && (
                <span className="text-[10px] font-mono text-[#0077b5] bg-[#0077b5]/10 px-1.5 py-0.5 rounded border border-[#0077b5]/20 hidden sm:inline">
                  {thoughts.length} critique step{thoughts.length > 1 ? 's' : ''}
                </span>
              )}
              {message.requestDurationMs && (
                <span className="text-[10px] font-mono text-gray-500 hidden md:inline">
                  • {(message.requestDurationMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onPreviewLinkedIn && displayPost && (
                <button
                  onClick={() => onPreviewLinkedIn(displayPost)}
                  className="flex items-center gap-1 text-gray-400 hover:text-white px-2.5 py-1 rounded hover:bg-white/5 transition-colors text-xs"
                  title="View formatted LinkedIn feed preview"
                >
                  <Eye className="w-3.5 h-3.5 text-[#0077b5]" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
              )}

              {displayPost && (
                <button
                  onClick={handleCopyPost}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    copied
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-[#0077b5] hover:bg-[#00669c] text-white shadow-sm'
                  }`}
                  title="Copy post text to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Thinking / Reflection Dropdown */}
          {thoughts.length > 0 && (
            <div className="rounded-xl bg-[#0e0e0e] border border-white/10 overflow-hidden transition-all">
              {/* Dropdown Trigger Header */}
              <button
                type="button"
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-white/5 transition-colors group"
                aria-expanded={isThinkingOpen}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-md bg-[#0077b5]/15 text-[#0077b5] shrink-0">
                    <Brain className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-semibold text-gray-200 group-hover:text-white truncate">
                      Thinking Process & Critique
                    </span>
                    <span className="text-[10px] font-mono text-[#0077b5] bg-[#0077b5]/10 px-1.5 py-0.2 rounded border border-[#0077b5]/20 shrink-0">
                      {thoughts.length} step{thoughts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-500 font-mono group-hover:text-gray-400 hidden sm:inline">
                    {isThinkingOpen ? 'Hide thoughts' : 'Show thoughts'}
                  </span>
                  <div className="p-1 text-gray-400 group-hover:text-white transition-transform">
                    {isThinkingOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Collapsible Dropdown Content Body */}
              {isThinkingOpen && (
                <div className="border-t border-white/5 px-4 py-3.5 bg-[#0a0a0a]/90 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#0077b5]" />
                      Self-reflection, critique notes, and reasoning passes:
                    </span>
                    <button
                      onClick={handleCopyThinking}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
                      title="Copy thinking reasoning log"
                    >
                      {copiedThinking ? (
                        <>
                          <Check className="w-3 h-3 text-green-400" />
                          <span className="text-green-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Log</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {thoughts.map((thoughtStep, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#141414] border border-white/5 text-xs text-gray-300 font-mono leading-relaxed break-words"
                      >
                        <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-white/5">
                          <span className="text-[#0077b5] font-bold text-[11px]">
                            Iteration #{idx + 1}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            Critique & Refinement Pass
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-gray-300 text-[11px]">
                          {thoughtStep}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Main LinkedIn Post Content */}
          <div className="space-y-3 pt-1">
            <div className="text-sm leading-relaxed text-gray-100 whitespace-pre-wrap break-words selection:bg-[#0077b5]/30">
              {displayPost || (
                <span className="text-gray-500 italic">No output text generated.</span>
              )}
            </div>

            {/* Post metadata bar */}
            {displayPost && (
              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500 font-mono border-t border-white/5">
                <div className="flex items-center gap-3">
                  <span>{charCount} chars</span>
                  <span>•</span>
                  <span>{wordCount} words</span>
                </div>
                <span>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Subtitle / Timestamp */}
      <span className="text-[10px] text-gray-600 mt-2 ml-11 uppercase tracking-wider font-mono">
        Assistant • Polished with self-reflection
        {message.requestDurationMs ? ` • ${(message.requestDurationMs / 1000).toFixed(1)}s` : ''}
      </span>
    </div>
  );
};

