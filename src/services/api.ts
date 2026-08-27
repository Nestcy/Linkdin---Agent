import { BackendHealth, GenerateRequest, GenerateResponse } from '../types';

const BASE_URL = 'https://reflection-agent-groq.onrender.com';

export class ApiError extends Error {
  status?: number;
  detail?: string;

  constructor(message: string, status?: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Checks the health status of the reflection agent backend.
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(`Health check failed with status ${response.status}`, response.status);
    }

    const data: BackendHealth = await response.json();
    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    const isAbort = (err as { name?: string })?.name === 'AbortError';
    throw new ApiError(
      isAbort
        ? 'Backend response timed out (server might be starting up)'
        : 'Could not connect to backend server'
    );
  }
}

/**
 * Generates an iteratively refined LinkedIn post based on user prompt.
 */
export async function generatePost(
  payload: GenerateRequest,
  signal?: AbortSignal
): Promise<GenerateResponse> {
  const controller = new AbortController();
  
  // Combine custom signal if provided
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }

  // 150 second timeout for multiple LLM reflection iterations on free tier
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 150000);

  const iterationsCount = payload.max_iterations ?? 6;

  try {
    const response = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt: payload.prompt.trim(),
        max_iterations: iterationsCount,
        iterations: iterationsCount,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let detailMsg = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData.detail === 'string') {
          detailMsg = errorData.detail;
        }
      } catch {
        // Body was not JSON, fallback to status text
        if (response.statusText) {
          detailMsg = `${response.status} - ${response.statusText}`;
        }
      }
      throw new ApiError(detailMsg, response.status, detailMsg);
    }

    const rawData = await response.json();
    
    // Support versatile backend return schema naming (final_post, post, output, text, result)
    const finalPost = 
      typeof rawData.final_post === 'string' ? rawData.final_post :
      typeof rawData.post === 'string' ? rawData.post :
      typeof rawData.output === 'string' ? rawData.output :
      typeof rawData.text === 'string' ? rawData.text :
      typeof rawData.result === 'string' ? rawData.result :
      typeof rawData.response === 'string' ? rawData.response :
      '';

    if (!finalPost && typeof rawData !== 'string') {
      console.warn('Unexpected response format from backend:', rawData);
      // We will fallback to stringifying rawData below so it's not lost
    }

    const reflectionHistory = Array.isArray(rawData.reflection_history) 
      ? rawData.reflection_history 
      : Array.isArray(rawData.history) 
      ? rawData.history 
      : [];

    return {
      final_post: finalPost || (typeof rawData === 'string' ? rawData : JSON.stringify(rawData, null, 2)),
      iterations: rawData.iterations || rawData.iteration || (payload.max_iterations ?? 6),
      reflection_history: reflectionHistory,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) {
      throw err;
    }

    const isAbort = (err as { name?: string })?.name === 'AbortError';
    if (isAbort) {
      throw new ApiError(
        'Request timed out. The server may still be cold-starting or busy refining. Please try again.',
        408
      );
    }

    const message = err instanceof Error ? err.message : 'Network error or backend unreachable';
    throw new ApiError(
      `${message}. Please check your internet connection or try again in a few moments.`,
      0
    );
  }
}
