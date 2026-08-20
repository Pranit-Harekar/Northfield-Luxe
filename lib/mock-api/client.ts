// Shared helpers for the in-browser mock API layer: artificial latency and
// typed "HTTP-like" errors so callers can branch on status code the same way
// they would against a real REST backend. QA engineers should use the
// browser's own Network tab / devtools to inspect requests.

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/** Simulates network latency, similar to a real backend under load. */
function simulatedLatencyMs(): number {
  return 80 + Math.random() * 220;
}

/**
 * Wraps a mock endpoint implementation with simulated latency, so every call
 * in the mock API "feels" like a real HTTP request.
 */
export async function withApiSimulation<T>(
  method: string,
  path: string,
  handler: () => Promise<T>,
  requestBody?: unknown,
): Promise<T> {
  void method;
  void path;
  void requestBody;
  await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs()));
  return handler();
}
