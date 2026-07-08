import { useState, useEffect, useCallback } from "preact/hooks";

type Theme = "light" | "dark";

export function useTheme() {
	const [theme, setThemeState] = useState<Theme>("dark");
	const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");

	useEffect(() => {
		let storedTheme = localStorage.getItem("kiosk-theme") as string | null;
		if (storedTheme === "system") {
			storedTheme = "dark";
			localStorage.setItem("kiosk-theme", "dark");
		}
		if (storedTheme === "light" || storedTheme === "dark") {
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
		root.classList.add(theme);
		setResolvedTheme(theme);
	}, [theme]);

	return { theme, setTheme, resolvedTheme };
}
