/**
 * Suppress server-side WalletConnect/Reown errors in development
 * These errors occur during SSR and don't affect functionality
 */
if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
  const originalConsoleError = console.error;
  
  console.error = (...args: unknown[]) => {
    const message = String(args[0] || "");
    const errorString = JSON.stringify(args);
    
    // Suppress Reown/WalletConnect server-side errors
    if (
      message.includes("[Reown Config]") ||
      message.includes("Failed to fetch remote project configuration") ||
      errorString.includes("ECONNRESET") ||
      errorString.includes("fetch failed") ||
      message.includes("Reown")
    ) {
      // Silently ignore these errors
      return;
    }
    
    originalConsoleError.apply(console, args);
  };
}

