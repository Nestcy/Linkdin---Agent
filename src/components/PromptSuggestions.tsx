import React from 'react';
import { Sparkles, Rocket, Lightbulb, TrendingUp, Award } from 'lucide-react';

interface PromptSuggestionsProps {
  onSelectPrompt: (text: string) => void;
}

export const PROMPT_TEMPLATES = [
  {
    icon: Rocket,
    title: 'Product Launch',
    prompt: 'Write a compelling LinkedIn post announcing that I just launched an open-source developer tool after 6 months of weekend building. Make the hook irresistible and share 3 core problems it solves.',
    tag: 'Launch',
  },
  {
    icon: Lightbulb,
    title: 'Hard Career Lesson',
    prompt: 'Draft a vulnerable yet actionable LinkedIn post about the biggest mistake I made as a tech lead (saying yes to every feature request) and how learning to say no saved our roadmap.',
    tag: 'Leadership',
  },
  {
    icon: TrendingUp,
    title: 'Milestone / Traction',
    prompt: 'Create an engaging LinkedIn update celebrating hitting our first 10,000 active users with zero paid marketing. Break down the 3 organic growth channels that actually worked.',
    tag: 'Growth',
  },
  {
    icon: Award,
    title: 'Career Advancement',
    prompt: 'Craft a humble and grateful announcement about being promoted to Staff Engineer. Thank my mentors, reflect on the journey from junior dev, and share advice for aspiring engineers.',
    tag: 'Career',
  },
];

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ onSelectPrompt }) => {
  return (
    <div className="max-w-2xl mx-auto my-auto px-4 py-8 text-center space-y-6 animate-in fade-in duration-300">
      {/* Intro hero badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0077b5]/10 border border-[#0077b5]/20 text-xs text-[#0077b5] font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Iterative Groq Reflection Loop</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-100 tracking-tight">
          Transform raw ideas into viral LinkedIn posts
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          Type your topic or draft below. The agent will draft, critique, and self-reflect over multiple iterations to maximize engagement.
        </p>
      </div>

      {/* Suggested Template Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
        {PROMPT_TEMPLATES.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group p-4 rounded-xl bg-[#161616] hover:bg-[#1c1c1c] border border-white/5 hover:border-[#0077b5]/40 text-left transition-all shadow-sm flex flex-col justify-between gap-3 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-gray-200 group-hover:text-[#0077b5] transition-colors">
                  <Icon className="w-3.5 h-3.5 text-[#0077b5]" />
                  {item.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 font-mono">
                  {item.tag}
                </span>
              </div>
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed group-hover:text-gray-300">
                "{item.prompt}"
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

