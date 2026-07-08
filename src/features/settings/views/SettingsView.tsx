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
		<div className="flex-1 h-full flex flex-col p-4 bg-gray-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-300 kiosk-view select-none">
			<div className="max-w-xl mx-auto w-full flex flex-col gap-4">
				<header className="border-b border-gray-200 dark:border-slate-800 pb-2">
					<h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
						Settings
					</h1>
					<p className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold">
						Manage kiosk preferences and system configuration.
					</p>
				</header>

				<div className="space-y-4">
					{/* Appearance Section */}
					<section aria-labelledby="appearance-heading" className="flex flex-col gap-1.5">
						<h2 id="appearance-heading" className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-2">
							Appearance
						</h2>
						<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
							<div className="p-4 flex items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0" aria-hidden="true">
										<Smartphone size={20} />
									</div>
									<div>
										<h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
											Theme Mode
										</h3>
										<p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
											Select interface style
										</p>
									</div>
								</div>
								<div 
									className="flex items-center bg-gray-100 dark:bg-slate-900 rounded-lg p-0.5 gap-0.5 border border-gray-200 dark:border-slate-700"
									role="radiogroup"
									aria-label="Select Theme"
									onKeyDown={handleKeyDown}
								>
									{[(["light", Sun] as const), (["system", Monitor] as const), (["dark", Moon] as const)].map(([t, Icon]) => {
										const isSelected = theme === t;
										return (
											<button
												key={t}
												onClick={() => setTheme(t)}
												role="radio"
												aria-checked={isSelected}
												aria-label={`${t} theme`}
												tabIndex={isSelected ? 0 : -1}
												className={`p-2 rounded-md flex items-center justify-center transition-all focus:outline-none cursor-pointer ${
													isSelected
														? "bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold"
														: "text-gray-400 dark:text-slate-500 hover:text-gray-800 dark:hover:text-gray-200"
												}`}
											>
												<Icon size={16} aria-hidden="true" />
											</button>
										);
									})}
								</div>
							</div>
						</div>
					</section>

					{/* System Section */}
					<section aria-labelledby="system-heading" className="flex flex-col gap-1.5">
						<h2 id="system-heading" className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest pl-2">
							System
						</h2>
						<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
							<div className="flex flex-col" role="list" onKeyDown={handleKeyDown}>
								<button 
									onClick={() => {
										setTempUrl(serverUrlVal);
										setTempType(connTypeVal);
										setActiveModal("connection");
									}}
									className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left focus:outline-none min-h-[48px]"
									role="listitem"
									aria-label="Connection Settings"
								>
									<div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-sm shrink-0" aria-hidden="true">
										<Wifi size={20} />
									</div>
									<div className="flex-1">
										<h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
											Connection
										</h3>
										<p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
											ROS 2 Bridge and network URL settings
										</p>
									</div>
									<div className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusColorClass()}`} aria-hidden="true">
										{getStatusLabel()}
									</div>
								</button>

								<button 
									onClick={() => setActiveModal("notifications")}
									className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left focus:outline-none min-h-[48px]"
									role="listitem"
									aria-label="Notification Settings"
								>
									<div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center shadow-sm shrink-0" aria-hidden="true">
										<Bell size={20} />
									</div>
									<div className="flex-1">
										<h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
											Notifications
										</h3>
										<p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
											Alerts for errors and status changes
										</p>
									</div>
									<div className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${notifEnabled ? "text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20" : "text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700"}`} aria-hidden="true">
										{notifEnabled ? "Enabled" : "Disabled"}
									</div>
								</button>
							</div>
						</div>
					</section>
				</div>

				<div className="mt-4 flex justify-center">
					<p className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm font-bold">
						<SettingsIcon size={12} className="animate-spin-slow" aria-hidden="true" />
						Sanad Kiosk Interface v1.0.0
					</p>
				</div>
			</div>

			{/* ==================== CONNECTION MODAL ==================== */}
			{activeModal === "connection" && (
				<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
					<div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-md border border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col gap-5">
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
									<div className="flex gap-2 mt-1">
										<button
											type="button"
											onClick={() => setTempUrl("https://9905-156-217-194-214.ngrok-free.app/api/v1")}
											className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition-all cursor-pointer border border-indigo-200/50 dark:border-indigo-500/20"
										>
											⚡ Use Ngrok Tunnel URL
										</button>
										<button
											type="button"
											onClick={() => setTempUrl("http://localhost:5051/api/v1")}
											className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-900 dark:hover:bg-slate-750 text-gray-600 dark:text-slate-400 rounded-lg text-xs font-bold transition-all cursor-pointer border border-gray-200/50 dark:border-slate-700/50"
										>
											Use Localhost
										</button>
									</div>
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
					<div className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-sm border border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col gap-5">
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
