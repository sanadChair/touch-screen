import {
	Bell,
	Smartphone,
	Settings as SettingsIcon,
	Wifi,
	Moon,
	Sun,
	Monitor,
	X,
} from "lucide-preact";
import { useState } from "preact/hooks";
import { useTheme } from "../../../shared/hooks/useTheme";
import { useArrowNavigation } from "../../../shared/hooks/useArrowNavigation";
import { getServerUrl, getConnectionType } from "../../../shared/lib/config";
import { useServerHealth } from "../../../shared/hooks/useServerHealth";

export function SettingsView() {
	const { theme, setTheme } = useTheme();
	const { handleKeyDown } = useArrowNavigation();
	const { isOffline } = useServerHealth();

	// Config States
	const [serverUrlVal, setServerUrlVal] = useState(getServerUrl());
	const [connTypeVal, setConnTypeVal] = useState(getConnectionType());
	const [notifEnabled, setNotifEnabled] = useState(
		localStorage.getItem("kiosk-notifications") !== "disabled"
	);

	// Modal States
	const [activeModal, setActiveModal] = useState<"none" | "connection" | "notifications">("none");

	// Connection form states
	const [tempUrl, setTempUrl] = useState(serverUrlVal);
	const [tempType, setTempType] = useState(connTypeVal);

	const handleSaveConnection = () => {
		localStorage.setItem("VITE_SERVER_URL", tempUrl);
		localStorage.setItem("VITE_CONNECTION_TYPE", tempType);
		// Reset offline health status on configuration change so that it retries connection
		localStorage.removeItem("kiosk-server-health");
		setServerUrlVal(tempUrl);
		setConnTypeVal(tempType);
		setActiveModal("none");
		// Reload page to re-initialize services with new settings
		window.location.reload();
	};

	const handleToggleNotifications = () => {
		const nextVal = !notifEnabled;
		setNotifEnabled(nextVal);
		localStorage.setItem("kiosk-notifications", nextVal ? "enabled" : "disabled");
	};



	const getStatusLabel = () => {
		if (connTypeVal === "MOCK") return "Mock (Demo)";
		if (isOffline) return "Offline (Demo)";
		if (connTypeVal === "SERVER") return "Connected (Server)";
		return "Connected (ROS)";
	};

	const getStatusColorClass = () => {
		if (isOffline) return "text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
		return "text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
	};

	return (
		<div className="flex-1 h-full flex flex-col p-6 sm:p-12 bg-gray-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-300 kiosk-view">
			<div className="max-w-3xl mx-auto w-full flex flex-col gap-6 sm:gap-8 kiosk-gap">
				<header>
					<h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
						Settings
					</h1>
					<p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
						Manage kiosk preferences and system configuration.
					</p>
				</header>

				<div className="space-y-6">
					{/* Appearance Section */}
					<section aria-labelledby="appearance-heading">
						<h2 id="appearance-heading" className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-4">
							Appearance
						</h2>
						<div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
							<div className="p-6 flex flex-col sm:flex-row sm:items-center gap-6 justify-between">
								<div className="flex items-center gap-4">
									<div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0" aria-hidden="true">
										<Smartphone size={24} />
									</div>
									<div>
										<h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
											Theme Mode
										</h3>
										<p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
											Select your preferred interface style
										</p>
									</div>
								</div>
								<div 
									className="flex items-center bg-gray-100 dark:bg-slate-900 rounded-xl p-1 gap-1 border border-gray-200 dark:border-slate-700 self-start sm:self-auto"
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
										className={`p-2.5 rounded-lg flex items-center justify-center transition-all focus:outline-none cursor-pointer ${
											theme === "light"
												? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold"
												: "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-200"
										}`}
									>
										<Sun size={20} aria-hidden="true" />
									</button>
									<button
										onClick={() => setTheme("system")}
										role="radio"
										aria-checked={theme === "system"}
										aria-label="System Theme"
										tabIndex={theme === "system" ? 0 : -1}
										className={`p-2.5 rounded-lg flex items-center justify-center transition-all focus:outline-none cursor-pointer ${
											theme === "system"
												? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold"
												: "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-200"
										}`}
									>
										<Monitor size={20} aria-hidden="true" />
									</button>
									<button
										onClick={() => setTheme("dark")}
										role="radio"
										aria-checked={theme === "dark"}
										aria-label="Dark Theme"
										tabIndex={theme === "dark" ? 0 : -1}
										className={`p-2.5 rounded-lg flex items-center justify-center transition-all focus:outline-none cursor-pointer ${
											theme === "dark"
												? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold"
												: "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-gray-200"
										}`}
									>
										<Moon size={20} aria-hidden="true" />
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
						<div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors duration-300">
							<div className="flex flex-col" role="list" onKeyDown={handleKeyDown}>
								<button 
									onClick={() => {
										setTempUrl(serverUrlVal);
										setTempType(connTypeVal);
										setActiveModal("connection");
									}}
									className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-4 sm:gap-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-slate-700 text-left focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-slate-700/50 min-h-[48px]"
									role="listitem"
									aria-label="Connection Settings"
								>
									<div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-sm shrink-0" aria-hidden="true">
										<Wifi size={24} />
									</div>
									<div className="flex-1">
										<h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
											Connection
										</h3>
										<p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
											ROS 2 Bridge and network settings
										</p>
									</div>
									<div className={`text-xs sm:text-sm font-semibold px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border ${getStatusColorClass()}`} aria-hidden="true">
										{getStatusLabel()}
									</div>
								</button>

								<button 
									onClick={() => setActiveModal("notifications")}
									className="p-6 flex items-center gap-4 sm:gap-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer active:bg-gray-100 dark:active:bg-slate-700 text-left focus:outline-none focus-visible:bg-gray-50 dark:focus-visible:bg-slate-700/50 min-h-[48px]"
									role="listitem"
									aria-label="Notification Settings"
								>
									<div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center shadow-sm shrink-0" aria-hidden="true">
										<Bell size={24} />
									</div>
									<div className="flex-1">
										<h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
											Notifications
										</h3>
										<p className="text-sm sm:text-base text-gray-500 dark:text-slate-400">
											Alerts for errors and status changes
										</p>
									</div>
									<div className={`text-xs sm:text-sm font-semibold px-3 py-1 rounded-full border ${notifEnabled ? "text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20" : "text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-650"}`} aria-hidden="true">
										{notifEnabled ? "Enabled" : "Disabled"}
									</div>
								</button>
							</div>
						</div>
					</section>
				</div>

				<div className="mt-8 flex justify-center">
					<p className="text-xs sm:text-sm text-gray-400 dark:text-slate-500 flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm">
						<SettingsIcon size={16} className="animate-spin-slow" aria-hidden="true" />
						Sanad Kiosk Interface v1.0.0
					</p>
				</div>
			</div>

			{/* ==================== CONNECTION MODAL ==================== */}
			{activeModal === "connection" && (
				<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
					<div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-md border border-gray-150 dark:border-slate-700 shadow-2xl flex flex-col gap-5">
						<div className="flex justify-between items-center">
							<h3 className="text-xl font-bold text-gray-900 dark:text-white">Connection Settings</h3>
							<button onClick={() => setActiveModal("none")} className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"><X size={20} /></button>
						</div>

						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<label className="text-sm font-bold text-gray-600 dark:text-slate-300">Connection Mode</label>
								<div className="grid grid-cols-3 gap-2">
									{(["NATIVE", "SERVER", "MOCK"] as const).map((mode) => (
										<button
											key={mode}
											onClick={() => setTempType(mode)}
											className={`py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${tempType === mode ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-50 border-gray-200 dark:bg-slate-900 dark:border-slate-700 text-gray-700 dark:text-slate-300"}`}
										>
											{mode}
										</button>
									))}
								</div>
							</div>

							{tempType === "SERVER" && (
								<div className="flex flex-col gap-2">
									<label htmlFor="server-url" className="text-sm font-bold text-gray-600 dark:text-slate-300">Server Endpoint URL</label>
									<input
										id="server-url"
										type="text"
										value={tempUrl}
										onChange={(e) => setTempUrl(e.currentTarget.value)}
										className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-750 dark:bg-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm font-mono"
									/>
								</div>
							)}
						</div>

						<div className="flex gap-3 mt-4">
							<button
								onClick={() => setActiveModal("none")}
								className="flex-1 py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-slate-300 font-bold text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-750"
							>
								Cancel
							</button>
							<button
								onClick={handleSaveConnection}
								className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-sm cursor-pointer shadow-md"
							>
								Save & Restart
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ==================== NOTIFICATIONS MODAL ==================== */}
			{activeModal === "notifications" && (
				<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
					<div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-sm border border-gray-150 dark:border-slate-700 shadow-2xl flex flex-col gap-5">
						<div className="flex justify-between items-center">
							<h3 className="text-xl font-bold text-gray-900 dark:text-white">Alert Preferences</h3>
							<button onClick={() => setActiveModal("none")} className="p-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"><X size={20} /></button>
						</div>

						<div className="flex items-center justify-between py-4 border-y border-gray-100 dark:border-slate-700">
							<div>
								<p className="font-bold text-gray-950 dark:text-white text-base">Desktop Alerts</p>
								<p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Toggle browser error dialogs</p>
							</div>
							<button
								onClick={handleToggleNotifications}
								className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors cursor-pointer ${notifEnabled ? "bg-emerald-500 justify-end" : "bg-gray-300 dark:bg-slate-600 justify-start"}`}
							>
								<div className="w-6 h-6 rounded-full bg-white shadow-md" />
							</button>
						</div>

						<button
							onClick={() => setActiveModal("none")}
							className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm cursor-pointer"
						>
							Dismiss
						</button>
					</div>
				</div>
			)}


		</div>
	);
}
