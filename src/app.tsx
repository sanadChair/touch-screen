import { useState } from "preact/hooks";
import { Sidebar } from "./features/navigation/components/Sidebar";
import type { NavTab } from "./features/navigation/types";
import { Home, Map as MapIcon, Settings } from "lucide-preact";

import { HomeView } from "./features/home/views/HomeView";
import { MapView } from "./features/map/views/MapView";
import { SettingsView } from "./features/settings/views/SettingsView";

const TABS: NavTab[] = [
	{ id: "home", label: "Home", icon: <Home size={28} /> },
	{ id: "map", label: "Navigation", icon: <MapIcon size={28} /> },
	{ id: "settings", label: "Settings", icon: <Settings size={28} /> },
];

export function App() {
	const [activeTabId, setActiveTabId] = useState<string>("home");

	return (
		<div className="w-screen h-screen flex bg-gray-100 overflow-hidden font-sans">
			<Sidebar
				tabs={TABS}
				activeTabId={activeTabId}
				onTabChange={setActiveTabId}
			/>

			<main className="flex-1 h-full relative overflow-hidden bg-white">
				{/* Use display:none to preserve map state when switching tabs! */}
				<div
					className={
						activeTabId === "home" ? "w-full h-full flex" : "hidden"
					}
				>
					<HomeView />
				</div>
				<div
					className={
						activeTabId === "map" ? "w-full h-full flex" : "hidden"
					}
				>
					<MapView />
				</div>
				<div
					className={
						activeTabId === "settings"
							? "w-full h-full flex"
							: "hidden"
					}
				>
					<SettingsView />
				</div>
			</main>
		</div>
	);
}
