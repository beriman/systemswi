export function isGoogleWorkspaceAuthError(error: unknown) {
  const message = String(error || "").toLowerCase();
  return (
    message.includes("invalid_grant") ||
    message.includes("invalid credentials") ||
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
