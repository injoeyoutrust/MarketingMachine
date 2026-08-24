"use client";

import { useEffect, useState } from "react";
import { getStoredTheme, getSystemTheme, setStoredTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(getStoredTheme() ?? getSystemTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setStoredTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
    >
      {theme === "dark" ? (
        <>
          <span aria-hidden>☀️</span> Light mode
        </>
      ) : (
        <>
          <span aria-hidden>🌙</span> Dark mode
        </>
      )}
    </button>
  );
}
