"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  storageKey?: string;
  themes?: string[];
  forcedTheme?: string;
  disableTransitionOnChange?: boolean;
  enableColorScheme?: boolean;
  value?: Record<string, string>;
  nonce?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  forcedTheme?: string;
  resolvedTheme: ResolvedTheme;
  themes: string[];
  systemTheme?: ResolvedTheme;
};

const STORAGE_KEY = "theme";
const THEMES: Theme[] = ["light", "dark", "system"];

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getThemeFromStorage(key: string, fallback: Theme): Theme {
  if (typeof window === "undefined") return fallback;
  try {
    return (localStorage.getItem(key) as Theme) || fallback;
  } catch {
    return fallback;
  }
}

function applyTheme(
  theme: string,
  attribute: string | string[],
  value?: Record<string, string>,
) {
  const root = document.documentElement;
  const attrs = Array.isArray(attribute) ? attribute : [attribute];

  attrs.forEach((attr) => {
    if (attr === "class") {
      const classes = value ? Object.values(value) : ["light", "dark"];
      root.classList.remove(...classes);
      const className = value?.[theme] || theme;
      root.classList.add(className);
    } else {
      root.setAttribute(attr, value?.[theme] || theme);
    }
  });
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined,
);

export function ThemeProvider({
  children,
  attribute = "data-theme",
  defaultTheme = "system",
  enableSystem = true,
  storageKey = STORAGE_KEY,
  themes = THEMES,
  forcedTheme,
  disableTransitionOnChange = false,
  enableColorScheme = true,
  value,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getThemeFromStorage(storageKey, defaultTheme),
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const resolvedTheme: ResolvedTheme =
    (forcedTheme as ResolvedTheme) ||
    (theme === "system" ? systemTheme : theme);

  useEffect(() => {
    const stored = getThemeFromStorage(storageKey, defaultTheme);
    setThemeState(stored);

    applyTheme(
      forcedTheme ||
        (stored === "system" ? getSystemTheme() : stored),
      attribute,
      value,
    );

    if (enableColorScheme) {
      document.documentElement.style.colorScheme = resolvedTheme;
    }
  }, []);

  useEffect(() => {
    if (!enableSystem) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const newSystemTheme = e.matches ? "dark" : "light";
      setSystemTheme(newSystemTheme);
      if (theme === "system" && !forcedTheme) {
        applyTheme(newSystemTheme, attribute, value);
      }
    };
    mq.addEventListener("change", handler);
    setSystemTheme(mq.matches ? "dark" : "light");
    return () => mq.removeEventListener("change", handler);
  }, [theme, forcedTheme, enableSystem, attribute]);

  useEffect(() => {
    if (forcedTheme) {
      applyTheme(forcedTheme as ResolvedTheme, attribute, value);
    } else {
      applyTheme(resolvedTheme, attribute, value);
    }
    if (enableColorScheme) {
      document.documentElement.style.colorScheme = resolvedTheme;
    }
  }, [resolvedTheme, forcedTheme, attribute]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {}
    },
    [storageKey],
  );

  const value_ = useMemo(
    (): ThemeProviderState => ({
      theme,
      setTheme,
      forcedTheme,
      resolvedTheme,
      themes,
      systemTheme: enableSystem ? systemTheme : undefined,
    }),
    [theme, setTheme, forcedTheme, resolvedTheme, themes, enableSystem, systemTheme],
  );

  return (
    <ThemeProviderContext.Provider value={value_}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    return {
      theme: "system" as Theme,
      setTheme: (_: Theme) => {},
      themes: THEMES,
      resolvedTheme: "light" as ResolvedTheme,
    };
  }
  return context;
}
