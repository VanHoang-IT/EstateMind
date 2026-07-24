"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "estate-theme";
const THEME_CHANGE_EVENT = "estate-theme-change";

function getCurrentTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

function getServerTheme(): Theme {
  return "light";
}

function subscribe(callback: () => void) {
  const handleChange = () => {
    callback();
  };

  window.addEventListener(THEME_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(
      THEME_CHANGE_EVENT,
      handleChange
    );

    window.removeEventListener(
      "storage",
      handleChange
    );
  };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === "dark";

  root.classList.toggle("dark", isDark);
  root.style.colorScheme = theme;

  localStorage.setItem(
    THEME_STORAGE_KEY,
    theme
  );

  window.dispatchEvent(
    new Event(THEME_CHANGE_EVENT)
  );
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribe,
    getCurrentTheme,
    getServerTheme
  );

  const isDark = theme === "dark";

  function toggleTheme() {
    applyTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={
        isDark
          ? "Chuyển sang chế độ sáng"
          : "Chuyển sang chế độ tối"
      }
      aria-label={
        isDark
          ? "Chuyển sang chế độ sáng"
          : "Chuyển sang chế độ tối"
      }
      aria-pressed={isDark}
      className="
        inline-flex h-9 w-9 items-center justify-center
        rounded-full border border-gray-200
        bg-white text-gray-600
        transition-colors
        hover:bg-gray-100 hover:text-red-500
        dark:border-slate-700
        dark:bg-slate-900
        dark:text-slate-300
        dark:hover:bg-slate-800
        dark:hover:text-yellow-400
      "
    >
      {isDark ? (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
            strokeWidth="1.8"
          />

          <path
            strokeLinecap="round"
            strokeWidth="1.8"
            d="
              M12 2v2
              M12 20v2
              M4.93 4.93l1.42 1.42
              M17.66 17.66l1.41 1.41
              M2 12h2
              M20 12h2
              M4.93 19.07l1.42-1.41
              M17.66 6.34l1.41-1.41
            "
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="
              M21 12.79A9 9 0 1 1
              11.21 3
              7 7 0 0 0
              21 12.79Z
            "
          />
        </svg>
      )}
    </button>
  );
}