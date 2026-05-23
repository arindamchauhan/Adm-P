"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

type ThemeToggleButtonProps = {
  className?: string;
  mobileLabel?: boolean;
};

export default function ThemeToggleButton({ className = "", mobileLabel = false }: ThemeToggleButtonProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      style={{ backgroundColor: "var(--surface-soft)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      {mobileLabel ? <span>{isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}</span> : null}
      {isDark ? <Sun size={mobileLabel ? 18 : 20} /> : <Moon size={mobileLabel ? 18 : 20} />}
    </button>
  );
}
