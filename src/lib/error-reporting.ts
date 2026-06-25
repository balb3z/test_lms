// Generic error reporting — replaces lovable-error-reporting.ts
// Drop in Sentry or another provider here if desired.

export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  if (typeof window === "undefined") return;
  // Log to console in production; swap for a real provider as needed.
  console.error("[AppError]", error, context);
}
