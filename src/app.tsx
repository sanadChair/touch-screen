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

	return (
		<div className="w-screen h-screen flex bg-gray-100 dark:bg-slate-900 overflow-hidden font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
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
}
