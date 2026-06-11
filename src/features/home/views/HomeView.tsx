import { Bot, Map as MapIcon, Settings } from "lucide-preact";
import { useArrowNavigation } from "../../../shared/hooks/useArrowNavigation";

export function HomeView({ onNavigate }: { onNavigate: (id: "home" | "map" | "smarthome" | "settings" | "eyecontrol") => void }) {
	const { handleKeyDown } = useArrowNavigation();

	return (
		<div className="flex-1 h-full flex flex-col p-6 sm:p-12 bg-gray-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-300 kiosk-view">
			<div className="max-w-4xl mx-auto w-full flex flex-col gap-6 sm:gap-10 kiosk-gap">
				<header className="flex flex-col gap-2 sm:gap-3">
					<h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
						Welcome to Sanad Kiosk
					</h1>
					<p className="text-base sm:text-xl text-gray-500 dark:text-slate-400 max-w-2xl leading-relaxed">
						Interact with the autonomous robot system. Select a
						destination, monitor the current status, and manage
						settings through this interface.
					</p>
				</header>

				<div 
					className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" 
					role="list"
					onKeyDown={handleKeyDown}
				>
					<button 
						onClick={() => onNavigate("map")}
						className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-4 sm:gap-5 hover:shadow-xl dark:hover:shadow-indigo-500/10 transition-all duration-300 group cursor-pointer text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 shrink-0 min-h-[140px]"
						aria-label="View Robot Status: Monitor current robot health, battery, and operation status."
						role="listitem"
						tabIndex={0}
					>
						<div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0" aria-hidden="true">
							<Bot size={28} strokeWidth={2.5} />
						</div>
						<div>
							<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
								Robot Status
							</h2>
							<p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 font-medium">
								Check battery, connectivity, and hardware health.
							</p>
						</div>
					</button>

					<button 
						onClick={() => onNavigate("map")}
						className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-4 sm:gap-5 hover:shadow-xl dark:hover:shadow-blue-500/10 transition-all duration-300 group cursor-pointer text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30 shrink-0 min-h-[140px]"
						aria-label="View Navigation: View real-time map, current pose, and set navigation goals."
						role="listitem"
						tabIndex={-1}
					>
						<div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0" aria-hidden="true">
							<MapIcon size={28} strokeWidth={2.5} />
						</div>
						<div>
							<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
								Navigation
							</h2>
							<p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 font-medium">
								Real-time mapping and point-to-point movement.
							</p>
						</div>
					</button>

					<button 
						onClick={() => onNavigate("settings")}
						className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-4 sm:gap-5 hover:shadow-xl dark:hover:shadow-emerald-500/10 transition-all duration-300 group cursor-pointer text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 shrink-0 min-h-[140px]"
						aria-label="View Settings: Manage kiosk preferences and system configuration."
						role="listitem"
						tabIndex={-1}
					>
						<div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0" aria-hidden="true">
							<Settings size={28} strokeWidth={2.5} />
						</div>
						<div>
							<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
								Settings
							</h2>
							<p className="text-sm sm:text-base text-gray-500 dark:text-slate-400 font-medium">
								Configure interface, network, and security.
							</p>
						</div>
					</button>
				</div>

				<button 
					onClick={() => onNavigate("map")}
					className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden mt-4 text-left w-full hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 group cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
					role="button"
					aria-label="Get Started: Open Navigation Map"
				>
					<div className="relative z-10 flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center justify-between">
						<div>
							<h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-3 tracking-tight">
								Ready to Start?
							</h2>
							<p className="text-blue-100 max-w-md text-sm sm:text-lg leading-relaxed font-medium">
								Navigate to the Map tab to begin exploring the
								environment and assigning tasks.
							</p>
						</div>
						<div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0 self-start md:self-auto" aria-hidden="true">
							<MapIcon
								size={32}
								className="text-white drop-shadow-lg"
							/>
						</div>
					</div>
					<div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/4"></div>
				</button>
			</div>
		</div>
	);
}
