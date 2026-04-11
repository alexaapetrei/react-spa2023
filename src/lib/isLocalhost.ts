export function isLocalhostHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "::1" ||
    hostname.startsWith("127.")
  );
}

export function isLocalRuntime(): boolean {
  return typeof window !== "undefined" && isLocalhostHost(window.location.hostname);
}
