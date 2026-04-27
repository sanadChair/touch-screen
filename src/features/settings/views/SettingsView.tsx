import {
	Bell,
	Shield,
	Smartphone,
	Settings as SettingsIcon,
	Wifi,
	Moon,
	Sun,
	Monitor,
} from "lucide-preact";
import { useTheme } from "../../../shared/hooks/useTheme";
import { useArrowNavigation } from "../../../shared/hooks/useArrowNavigation";

export function SettingsView() {
	const { theme, setTheme } = useTheme();
	const { handleKeyDown } = useArrowNavigation();

	return (
		<div className="flex-1 h-full flex flex-col p-8 md:p-12 bg-gray-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-300">
			<div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
				<header>
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
						Settings
					</h1>
					<p className="text-gray-500 dark:text-slate-400">
						Manage kiosk preferences and system configuration.
					</p>
				</header>

				<div className="space-y-6">
					{/* Appearance Section */}
					<section aria-labelledby="appearance-heading">
						<h2 id="appearance-heading" className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-4">
							Appearance
						</h2>
						<div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
							<div className="p-6 flex items-center gap-6">
								<div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
									<Smartphone size={28} />
								</div>
								<div className="flex-1">
									<h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
										Theme Mode
									</h3>
									<p className="text-base text-gray-500 dark:text-slate-400">
										Select your preferred interface style
									</p>
								</div>
								<div 
									className="flex items-center bg-gray-100 dark:bg-slate-900 rounded-xl p-1 gap-1 border border-gray-200 dark:border-slate-700"
									role="radiogroup"
									aria-label="Select Theme"
									onKeyDown={handleKeyDown}
								>
									<button
										onClick={() => setTheme("light")}
										role="radio"
										aria-checked={theme === "light"}
										aria-label="Light Theme"
										tabIndex={theme === "light" ? 0 : -1}
										className={`p-3 rounded-lg flex items-center justify-center transition-all focus:outline-none ${
											theme === "light"
												? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400"
												: "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-200"
										}`}
									>
										<Sun size={24} aria-hidden="true" />
									</button>
									<button
										onClick={() => setTheme("system")}
										role="radio"
										aria-checked={theme === "system"}
										aria-label="System Theme"
										tabIndex={theme === "system" ? 0 : -1}
										className={`p-3 rounded-lg flex items-center justify-center transition-all focus:outline-none ${
											theme === "system"
												? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400"
												: "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-200"
										}`}
									>
										<Monitor size={24} aria-hidden="true" />
									</button>
									<button
										onClick={() => setTheme("dark")}
										role="radio"
										aria-checked={theme === "dark"}
										aria-label="Dark Theme"
										tabIndex={theme === "dark" ? 0 : -1}
										className={`p-3 rounded-lg flex items-center justify-center transition-all focus:outline-none ${
											theme === "dark"
												? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400"
												: "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-200"
										}`}
									>
										<Moon size={24} aria-hidden="true" />
									</button>
								</div>
							</div>
						</div>
					</section>

					{/* System Section */}
					<section aria-labelledby="system-heading">
						<h2 id="system-heading" className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-4">
							System
						</h2>
						<div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
							<div className="flex flex-col" role="list" onKeyDown={handleKeyDown}>
								<button 
									className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-slate-700 text-left focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-slate-700/50"
									role="listitem"
									aria-label="Connection Settings: ROS 2 Bridge and network settings. Currently connected."
								>
									<div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-sm shrink-0" aria-hidden="true">
										<Wifi size={28} />
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
											Connection
										</h3>
										<p className="text-base text-gray-500 dark:text-slate-400">
											ROS 2 Bridge and network settings
										</p>
									</div>
									<div className="text-base font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20" aria-hidden="true">
										Connected
									</div>
								</button>

								<button 
									className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-slate-700 text-left focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-slate-700/50"
									role="listitem"
									aria-label="Notification Settings: Alerts for errors and status changes"
								>
									<div className="w-14 h-14 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center shadow-sm shrink-0" aria-hidden="true">
										<Bell size={28} />
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
											Notifications
										</h3>
										<p className="text-base text-gray-500 dark:text-slate-400">
											Alerts for errors and status changes
										</p>
									</div>
								</button>

								<button 
									className="p-6 flex items-center gap-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-slate-700 text-left focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-slate-700/50"
									role="listitem"
									aria-label="Security Settings: Access control and permissions"
								>
									<div className="w-14 h-14 bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-stone-300 rounded-2xl flex items-center justify-center shadow-sm shrink-0" aria-hidden="true">
										<Shield size={28} />
									</div>
									<div className="flex-1">
										<h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
											Security
										</h3>
										<p className="text-base text-gray-500 dark:text-slate-400">
											Access control and permissions
										</p>
									</div>
								</button>
							</div>
						</div>
					</section>
				</div>

				<div className="mt-8 flex justify-center">
					<p className="text-sm text-gray-400 dark:text-slate-500 flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm">
						<SettingsIcon size={16} className="animate-spin-slow" aria-hidden="true" />
						Sanad Kiosk Interface v1.0.0
					</p>
				</div>
			</div>
		</div>
	);
}
