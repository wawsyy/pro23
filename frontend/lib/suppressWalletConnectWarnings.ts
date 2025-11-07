/**
 * Suppress WalletConnect/Reown console warnings in development
 * These warnings are safe to ignore and don't affect functionality
 */
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  const originalWarn = console.warn;

  // Filter out WalletConnect/Reown related warnings
  const suppressedMessages = [
    "not found on Allowlist",
    "Failed to fetch remote project configuration",
    "HTTP status code: 403",
    "Analytics SDK:",
    "ERR_BLOCKED_BY_RESPONSE",
    "pulse.walletconnect",
    "api.web3modal.org",
    "cca-lite.coinbase.com",
    "ECONNRESET",
    "fetch failed",
    "[Reown Config]",
  ];

  console.error = (...args: unknown[]) => {
    const message = String(args[0] || "");
    if (!suppressedMessages.some((msg) => message.includes(msg))) {
      originalError.apply(console, args);
    }
  };

  console.warn = (...args: unknown[]) => {
    const message = String(args[0] || "");
    if (!suppressedMessages.some((msg) => message.includes(msg))) {
      originalWarn.apply(console, args);
    }
  };
}


