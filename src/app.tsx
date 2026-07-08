import { useState, useEffect } from "preact/hooks";
import { Sidebar } from "./features/navigation/components/Sidebar";
import type { NavTab } from "./features/navigation/types";
import { Home as HomeIcon, Map as MapIcon, Settings as SettingsIcon, Heart, Eye } from "lucide-preact";

import { HomeView } from "./features/home/views/HomeView";
import { MapView } from "./features/map/views/MapView";
import { SmartHomeView } from "./features/smart-home/views/SmartHomeView";
import { SettingsView } from "./features/settings/views/SettingsView";
import { EyeControlView } from "./features/eye-control/views/EyeControlView";
import { OfflineBanner } from "./shared/components/OfflineBanner";

import { useTheme } from "./shared/hooks/useTheme";

type TabId = "home" | "map" | "smarthome" | "settings" | "eyecontrol";

const TABS: NavTab[] = [
	{ id: "home", label: "Home", icon: <HomeIcon size={28} /> },
	{ id: "map", label: "Navigation", icon: <MapIcon size={28} /> },
	{ id: "smarthome", label: "Smart Home", icon: <Heart size={28} /> },
	{ id: "eyecontrol", label: "Eye Control", icon: <Eye size={28} /> },
	{ id: "settings", label: "Settings", icon: <SettingsIcon size={28} /> },
];

export function App() {
	const [activeTabId, setActiveTabId] = useState<TabId>("home");
	const [windowSize, setWindowSize] = useState({
		width: typeof window !== "undefined" ? window.innerWidth : 800,
		height: typeof window !== "undefined" ? window.innerHeight : 480,
	});

	useEffect(() => {
		const handleResize = () => {
			setWindowSize({
				width: window.innerWidth,
				height: window.innerHeight,
			});
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const handleGlobalArrows = (e: KeyboardEvent) => {
			if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
			
			if (!document.activeElement || document.activeElement === document.body) {
				const sidebar = document.querySelector('[role="tablist"]');
				const activeTab = sidebar?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
				activeTab?.focus();
				e.preventDefault();
			}
		};

		window.addEventListener("keydown", handleGlobalArrows);
		return () => window.removeEventListener("keydown", handleGlobalArrows);
	}, []);

	useTheme();

	const targetWidth = 800;
	const targetHeight = 480;

	// Automatically run in standard fullscreen mode if the screen is at or smaller than the kiosk dimensions
	const isKioskSize = windowSize.width <= targetWidth && windowSize.height <= targetHeight;

	// Calculate scaling factor to fit the target kiosk container inside the viewport
	const scaleX = windowSize.width / targetWidth;
	const scaleY = windowSize.height / targetHeight;
	const scale = Math.min(scaleX, scaleY);

	const appContent = (
		<div className="w-full h-full flex bg-gray-100 dark:bg-slate-900 overflow-hidden font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
			<Sidebar
				tabs={TABS}
				activeTabId={activeTabId}
				onTabChange={(id) => setActiveTabId(id as TabId)}
			/>

			<main className="flex-1 h-full relative overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300 flex flex-col">
				<OfflineBanner />

				{/* Use display:none to preserve map state when switching tabs! */}
				<div
					id="tab-panel-home"
					role="tabpanel"
					aria-labelledby="tab-home"
					className={
						activeTabId === "home" ? "w-full h-full flex flex-1 min-h-0" : "hidden"
					}
				>
					<HomeView onNavigate={(id) => setActiveTabId(id)} />
				</div>
				<div
					id="tab-panel-map"
					role="tabpanel"
					aria-labelledby="tab-map"
					className={
						activeTabId === "map" ? "w-full h-full flex flex-1 min-h-0" : "hidden"
					}
				>
					<MapView />
				</div>
				<div
					id="tab-panel-smarthome"
					role="tabpanel"
					aria-labelledby="tab-smarthome"
					className={
						activeTabId === "smarthome" ? "w-full h-full flex flex-1 min-h-0" : "hidden"
					}
				>
					<SmartHomeView />
				</div>
				<div
					id="tab-panel-eyecontrol"
					role="tabpanel"
					aria-labelledby="tab-eyecontrol"
					className={
						activeTabId === "eyecontrol" ? "w-full h-full flex flex-1 min-h-0" : "hidden"
					}
				>
					<EyeControlView />
				</div>
				<div
					id="tab-panel-settings"
					role="tabpanel"
					aria-labelledby="tab-settings"
					className={
						activeTabId === "settings" ? "w-full h-full flex flex-1 min-h-0" : "hidden"
					}
				>
					<SettingsView />
				</div>
			</main>
		</div>
	);

	if (isKioskSize) {
		return (
			<div className="w-screen h-screen overflow-hidden">
				{appContent}
			</div>
		);
	}

	return (
		<div className="w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden relative">
			{/* Modern subtle ambient glow matching design aesthetics */}
			<div 
				className="absolute inset-0 pointer-events-none opacity-30 blur-[120px] transition-colors duration-500"
				style={{
					backgroundImage: "radial-gradient(circle at center, var(--color-indigo-500, #6366f1) 0%, transparent 65%)"
				}}
			/>

			{/* Centered Kiosk Screen Container */}
			<div
				style={{
					width: `${targetWidth}px`,
					height: `${targetHeight}px`,
					transform: `scale(${scale})`,
					transformOrigin: "center center",
				}}
				className="relative shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-slate-200/10 dark:border-slate-800/80 rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shrink-0"
			>
				{appContent}
			</div>
		</div>
	);
}
