"use client";

import { useEffect } from "react";

/**
 * Marks <html> while an admin screen is mounted. CSS uses it to hide the
 * public chat widget (injected into <body>) and to reset public body styles.
 */
export function useAdminMode() {
  useEffect(() => {
    document.documentElement.classList.add("admin-mode");
    return () => document.documentElement.classList.remove("admin-mode");
  }, []);
}
