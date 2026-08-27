export interface BackendHealth {
  status: string;
  llm: string;
  model: string;
  api_configured: boolean;
}

export interface GenerateRequest {
  prompt: string;
  max_iterations?: number;
}

export interface GenerateResponse {
  final_post: string;
  iterations: number;
  reflection_history: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reflectionHistory?: string[];
  iterations?: number;
  timestamp: number;
  status?: 'sending' | 'success' | 'error';
  errorMessage?: string;
  rawPrompt?: string;
  requestDurationMs?: number;
  iterationsConfigured?: number;
}

export interface AgentSettings {
  maxIterations: number;
  previewMode: 'standard' | 'feed-card';
  autoScroll: boolean;
}
