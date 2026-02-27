"use client";

import { useEffect } from "react";

/**
 * Hook to prepend "[LOCAL]" to page title when running on localhost.
 * This helps differentiate between local development and production environments.
 */
export function usePageTitle() {
  useEffect(() => {
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.startsWith("192.168.") ||
        window.location.hostname.startsWith("10.") ||
        window.location.hostname.endsWith(".local"));

    if (isLocalhost && !document.title.startsWith("[LOCAL]")) {
      document.title = `[LOCAL] ${document.title}`;
    }
  }, []);
}
