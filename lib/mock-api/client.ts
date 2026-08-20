// Shared helpers for the in-browser mock API layer: artificial latency,
// a lightweight request/response log (feeds the future QA Workbench Network
// Viewer), and typed "HTTP-like" errors so callers can branch on status code
// the same way they would against a real REST backend.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export interface NetworkLogEntry {
  id: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: string;
  requestBody?: unknown;
  responseBody?: unknown;
}

const MAX_LOG_ENTRIES = 200;
const log: NetworkLogEntry[] = [];
const listeners = new Set<() => void>();

export function getNetworkLog(): NetworkLogEntry[] {
  return log;
}

export function subscribeToNetworkLog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function pushLogEntry(entry: NetworkLogEntry) {
  log.unshift(entry);
  log.length = Math.min(log.length, MAX_LOG_ENTRIES);
  listeners.forEach((l) => l());
}

/** Simulates network latency, similar to a real backend under load. */
function simulatedLatencyMs(): number {
  return 80 + Math.random() * 220;
}

/**
 * Wraps a mock endpoint implementation with simulated latency and network
 * logging, so every call in the mock API "feels" like a real HTTP request.
 */
export async function withApiSimulation<T>(
  method: string,
  path: string,
  handler: () => Promise<T>,
  requestBody?: unknown,
): Promise<T> {
  const start = performance.now();
  await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs()));
  try {
    const result = await handler();
    pushLogEntry({
      id: crypto.randomUUID(),
      method,
      path,
      status: 200,
      durationMs: Math.round(performance.now() - start),
      timestamp: new Date().toISOString(),
      requestBody,
      responseBody: result,
    });
    return result;
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    pushLogEntry({
      id: crypto.randomUUID(),
      method,
      path,
      status,
      durationMs: Math.round(performance.now() - start),
      timestamp: new Date().toISOString(),
      requestBody,
      responseBody: err instanceof Error ? { error: err.message } : err,
    });
    throw err;
  }
}
