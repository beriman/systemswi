export function isGoogleWorkspaceAuthError(error: unknown) {
  const message = String(error || "").toLowerCase();
  return (
    message.includes("invalid_grant") ||
    message.includes("invalid credentials") ||
    message.includes("invalid authentication credentials") ||
    message.includes("token has been expired or revoked") ||
    message.includes("invalid_token")
  );
}

export function googleWorkspaceDegradedSource(source: string, error: unknown) {
  return {
    source,
    sourceStatus: "degraded" as const,
    warning:
      "Google Workspace OAuth token is expired/revoked, so systemswi is returning an empty read-only fallback instead of stale or invented data.",
    details: String(error),
  };
}

export function googleWorkspaceWriteBlockedSource(target: string, error: unknown) {
  return {
    source: target,
    sourceStatus: "blocked" as const,
    warning:
      "Google Workspace OAuth token is expired/revoked, so systemswi cannot complete this write safely. Re-authenticate Google Workspace before retrying; no fallback/mock write was performed.",
    details: String(error),
  };
}
