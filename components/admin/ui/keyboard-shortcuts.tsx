"use client";

import { useEffect } from "react";

export default function AdminKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K or / to focus search (if a search input exists)
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        const searchInput = document.querySelector(
          '[data-admin-search], input[type="search"], input[aria-label="Search"]'
        ) as HTMLInputElement | null;
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
        }
      }

      // ? to show shortcuts help
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = document.activeElement?.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        alert(
          "Admin shortcuts:\n" +
            "Ctrl+K — Focus search\n" +
            "R — Refresh current tab\n" +
            "Esc — Close dialogs / clear selection"
        );
      }

      // R to refresh (when not typing)
      if (
        e.key === "r" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !["input", "textarea", "select"].includes(document.activeElement?.tagName.toLowerCase() || "")
      ) {
        const refreshBtn = document.querySelector(
          '[data-admin-refresh], button[aria-label="Refresh"]'
        ) as HTMLButtonElement | null;
        if (refreshBtn) {
          e.preventDefault();
          refreshBtn.click();
        }
      }

      // Esc to close overlays
      if (e.key === "Escape") {
        const closeBtn = document.querySelector(
          '[data-admin-close], [aria-label="Close"]'
        ) as HTMLButtonElement | null;
        closeBtn?.click();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return null;
}
