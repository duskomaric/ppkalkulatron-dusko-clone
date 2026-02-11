import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Koristi se na: app/root.tsx (globalni theme kontekst)
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem("theme") as Theme) || "system";
        }
        return "system";
    });

    const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (t: "dark" | "light") => {
            root.classList.remove("light", "dark");
            root.classList.add(t);
            setResolvedTheme(t);

            // Update meta theme-color for PWA
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute("content", t === "dark" ? "#0B0B0F" : "#F8FAFC");
            }
        };

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            applyTheme(systemTheme);
        } else {
            applyTheme(theme);
        }
    }, [theme]);

    // Sync with system preference changes
    useEffect(() => {
        if (theme !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const newSystemTheme = mediaQuery.matches ? "dark" : "light";
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(newSystemTheme);
            setResolvedTheme(newSystemTheme);
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
