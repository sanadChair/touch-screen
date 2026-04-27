import { useState, useEffect, useCallback } from "preact/hooks";

type Theme = "light" | "dark" | "system";

export function useTheme() {
	const [theme, setThemeState] = useState<Theme>("system");
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

	useEffect(() => {
		const storedTheme = localStorage.getItem("kiosk-theme") as Theme | null;
		if (storedTheme) {
			setThemeState(storedTheme);
		}

		const handleThemeChange = (e: Event) => {
			const customEvent = e as CustomEvent<Theme>;
			setThemeState(customEvent.detail);
		};

		window.addEventListener("kiosk-theme-change", handleThemeChange);
		return () => window.removeEventListener("kiosk-theme-change", handleThemeChange);
	}, []);

	const setTheme = useCallback((newTheme: Theme) => {
		setThemeState(newTheme);
		localStorage.setItem("kiosk-theme", newTheme);
		window.dispatchEvent(new CustomEvent("kiosk-theme-change", { detail: newTheme }));
	}, []);

	useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove("light", "dark");

		let exactTheme: "light" | "dark";
		if (theme === "system") {
			exactTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		} else {
			exactTheme = theme;
		}

		root.classList.add(exactTheme);
		setResolvedTheme(exactTheme);
	}, [theme]);

	return { theme, setTheme, resolvedTheme };
}
