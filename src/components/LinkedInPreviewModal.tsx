import React, { useMemo } from 'react';
import { X, Copy, Check, ThumbsUp, MessageSquare, Repeat2, Send, Globe, MoreHorizontal, User } from 'lucide-react';

interface LinkedInPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  postContent: string;
  onCopy: () => void;
  copied: boolean;
}

function cleanPostForFeed(content: string): string {
  if (!content) return '';
  // Strip <think>...</think>, <thought>...</thought>, <reasoning>...</reasoning>
  return content
    .replace(/<(?:think|thought|reasoning)>[\s\S]*?<\/(?:think|thought|reasoning)>/gi, '')
    .replace(/<(?:think|thought|reasoning)>[\s\S]*/gi, '')
    .trim();
}

export const LinkedInPreviewModal: React.FC<LinkedInPreviewModalProps> = ({
  isOpen,
  onClose,
  postContent,
  onCopy,
  copied,
}) => {
  const displayPost = useMemo(() => cleanPostForFeed(postContent), [postContent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[#161616] border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5 bg-[#0f0f0f]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white bg-[#0077b5] text-xs px-2 py-0.5 rounded">
              in
            </span>
            <h3 className="text-sm font-semibold text-gray-100">Feed Simulation Preview</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copied
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-[#0077b5] hover:bg-[#00669c] text-white shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Post</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Feed Card */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0a0a0a]">
          <div className="rounded-xl border border-white/10 bg-[#161616] shadow-xl overflow-hidden max-w-lg mx-auto">
            {/* Author Header */}
            <div className="p-4 flex items-start justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0077b5]/20 border border-[#0077b5]/40 flex items-center justify-center text-[#0077b5] font-semibold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-semibold text-gray-100 text-sm">You</h4>
                    <span className="text-[11px] text-gray-500">• 1st</span>
                  </div>
                  <p className="text-xs text-gray-400">Founder & Technologist</p>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                    <span>Just now</span>
                    <span>•</span>
                    <Globe className="w-3 h-3 text-gray-500" />
                  </div>
                </div>
              </div>
              <button className="text-gray-500 hover:text-gray-300 p-1">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Content */}
            <div className="p-4 sm:p-5 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words font-sans selection:bg-[#0077b5]/30">
              {displayPost}
            </div>

            {/* Reactions / Stats Bar */}
            <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="flex -space-x-1">
                  <span className="w-4 h-4 rounded-full bg-[#0077b5] flex items-center justify-center text-[9px] text-white">👍</span>
                  <span className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center text-[9px] text-white">💡</span>
                  <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[9px] text-white">❤️</span>
                </span>
                <span>428</span>
              </div>
              <div className="flex items-center gap-2">
                <span>36 comments</span>
                <span>•</span>
                <span>14 reposts</span>
              </div>
            </div>

            {/* Action Buttons Mockup */}
            <div className="px-3 py-1.5 border-t border-white/5 grid grid-cols-4 gap-1 text-gray-400 text-xs font-medium">
              <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-white/5 hover:text-gray-200 transition-colors">
                <ThumbsUp className="w-4 h-4 text-gray-400" />
                <span className="hidden sm:inline">Like</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-white/5 hover:text-gray-200 transition-colors">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="hidden sm:inline">Comment</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-white/5 hover:text-gray-200 transition-colors">
                <Repeat2 className="w-4 h-4 text-gray-400" />
                <span className="hidden sm:inline">Repost</span>
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-white/5 hover:text-gray-200 transition-colors">
                <Send className="w-4 h-4 text-gray-400" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

