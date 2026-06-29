import { Map as MapIcon, Settings, Heart, Eye } from "lucide-preact";
import { useArrowNavigation } from "../../../shared/hooks/useArrowNavigation";

export function HomeView({ onNavigate }: { onNavigate: (id: "home" | "map" | "smarthome" | "settings" | "eyecontrol") => void }) {
	const { handleKeyDown } = useArrowNavigation();

	return (
		<div className="flex-1 h-full flex flex-col p-4 bg-gray-50 dark:bg-slate-900 transition-colors duration-300 kiosk-view justify-between overflow-hidden">
			<div className="max-w-4xl mx-auto w-full flex flex-col h-full justify-between gap-3">
				<header className="flex flex-col gap-1 shrink-0">
					<h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
						Welcome to Sanad Kiosk
					</h1>
					<p className="text-xs text-gray-500 dark:text-slate-400 leading-normal max-w-2xl">
						Interact with the autonomous robot system. Select navigation destinations, control smart home automation devices, or operate the wheelchair hands-free.
					</p>
				</header>

				<div 
					className="grid grid-cols-2 gap-4 flex-1 min-h-0 py-2" 
					role="list"
					onKeyDown={handleKeyDown}
				>
					<button 
						onClick={() => onNavigate("map")}
						className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md dark:hover:shadow-blue-500/10 transition-all duration-300 group cursor-pointer text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
						aria-label="Map Navigation"
						role="listitem"
						tabIndex={0}
					>
						<div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0" aria-hidden="true">
							<MapIcon size={24} strokeWidth={2.5} />
						</div>
						<div className="min-w-0">
							<h2 className="text-base font-bold text-gray-900 dark:text-white mb-0.5 truncate">
								Map Navigation
							</h2>
							<p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
								Real-time mapping, path tracking, and destination routing.
							</p>
						</div>
					</button>

					<button 
						onClick={() => onNavigate("eyecontrol")}
						className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md dark:hover:shadow-indigo-500/10 transition-all duration-300 group cursor-pointer text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30"
						aria-label="Hands-Free Control"
						role="listitem"
						tabIndex={-1}
					>
						<div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0" aria-hidden="true">
							<Eye size={24} strokeWidth={2.5} />
						</div>
						<div className="min-w-0">
							<h2 className="text-base font-bold text-gray-900 dark:text-white mb-0.5 truncate">
								Hands-Free Control
							</h2>
							<p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
								Operate the wheelchair and environment using gaze dwell control.
							</p>
						</div>
					</button>

					<button 
						onClick={() => onNavigate("smarthome")}
						className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md dark:hover:shadow-rose-500/10 transition-all duration-300 group cursor-pointer text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/30"
						aria-label="Smart Home Control"
						role="listitem"
						tabIndex={-1}
					>
						<div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0" aria-hidden="true">
							<Heart size={24} strokeWidth={2.5} />
						</div>
						<div className="min-w-0">
							<h2 className="text-base font-bold text-gray-900 dark:text-white mb-0.5 truncate">
								Smart Home
							</h2>
							<p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
								Toggle lights, adjust climate presets, and manage connected devices.
							</p>
						</div>
					</button>

					<button 
						onClick={() => onNavigate("settings")}
						className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md dark:hover:shadow-emerald-500/10 transition-all duration-300 group cursor-pointer text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30"
						aria-label="Kiosk Settings"
						role="listitem"
						tabIndex={-1}
					>
						<div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0" aria-hidden="true">
							<Settings size={24} strokeWidth={2.5} />
						</div>
						<div className="min-w-0">
							<h2 className="text-base font-bold text-gray-900 dark:text-white mb-0.5 truncate">
								System Settings
							</h2>
							<p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
								Configure network URLs, connection modes, and light/dark theme.
							</p>
						</div>
					</button>
				</div>
			</div>
		</div>
	);
}
