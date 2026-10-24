import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#151a17" : "#f6f4ef");
  return theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "dark" : "light",
    );
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystem = () => {
      try {
        if (localStorage.getItem("still-story-theme")) return;
      } catch {
        /* Keep the toggle usable if storage is blocked. */
      }
      setTheme(applyTheme(media.matches ? "dark" : "light"));
    };
    const sync = (event: StorageEvent) => {
      if (event.key !== "still-story-theme" && event.key !== null) return;
      setTheme(
        applyTheme(
          event.newValue === "dark"
            ? "dark"
            : event.newValue === "light"
              ? "light"
              : media.matches
                ? "dark"
                : "light",
        ),
      );
    };
    media.addEventListener("change", followSystem);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", followSystem);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const label = `Switch to ${theme === "dark" ? "light" : "dark"} theme`;
  return (
    <button
      className="theme-toggle icon-button"
      aria-label={label}
      title={label}
      onClick={() => {
        const next = applyTheme(
          document.documentElement.dataset.theme === "dark" ? "light" : "dark",
        );
        setTheme(next);
        try {
          localStorage.setItem("still-story-theme", next);
        } catch {
          /* Theme still applies for this visit. */
        }
      }}
    >
      <Sun className="theme-sun" size={17} />
      <Moon className="theme-moon" size={17} />
    </button>
  );
}
