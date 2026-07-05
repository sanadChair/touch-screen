import { clsx } from "clsx";
import {
	Lightbulb,
	Monitor,
	Music,
	Settings2,
	ShieldCheck,
	Thermometer,
	Wifi,
	Plus,
	RefreshCw,
	Check,
	AlertCircle,
	Loader2,
	ArrowRight,
} from "lucide-preact";
import { useState, useEffect } from "preact/hooks";
import { useRooms } from "../../map/hooks/useRooms";
import type { RoomAction } from "../../map/types";
import { getAllDevices, getRoomActions } from "../../map/lib/roomDevices";
import { SmartHomeServiceFactory } from "../services/SmartHomeServiceFactory";
import { useArrowNavigation } from "../../../shared/hooks/useArrowNavigation";
import { getServerHealth } from "../../../shared/hooks/useServerHealth";
import { useSmartHomeProvisioning } from "../hooks/useSmartHomeProvisioning";
import type { UnprovisionedDevice } from "../hooks/useSmartHomeProvisioning";
import { cn } from "../../../shared/lib/utils";
import { useOptimisticMap } from "../../../shared/hooks/useOptimistic";

const SECTION_META: Record<string, { icon: any; title: string }> = {
	lighting: { icon: Lightbulb, title: "Lighting" },
	climate: { icon: Thermometer, title: "Climate" },
	security: { icon: ShieldCheck, title: "Security" },
	media: { icon: Music, title: "Media" },
	other: { icon: Settings2, title: "Other Devices" },
};

const actionSection = (action: RoomAction): string => {
	if (action.category && SECTION_META[action.category]) {
		return action.category;
	}
	const label = `${action.deviceName} ${action.command}`.toLowerCase();
	if (label.includes("light") || label.includes("brightness")) return "lighting";
	if (label.includes("temp") || label.includes("ac") || label.includes("climate")) return "climate";
	if (label.includes("lock") || label.includes("door") || label.includes("security")) return "security";
	if (label.includes("speaker") || label.includes("volume") || label.includes("tv")) return "media";
	return "other";
};

export function SmartHomeView() {
	const { rooms, unassignedDevices, refreshRooms, isLoading } = useRooms();
	const { handleKeyDown } = useArrowNavigation();
	const smartHomeService = SmartHomeServiceFactory.getService();
	const [pendingActionIds, setPendingActionIds] = useState<Record<string, boolean>>({});
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isScanning, setIsScanning] = useState(false);

	// Provisioning Hook Integration
	const {
		discoveredDevices,
		isScanning: isScanningUnprovisioned,
		isProvisioning,
		provisioningStatus,
		error: provisioningError,
		savedSsid,
		savedPassword,
		scanUnprovisioned,
		provisionDevice,
	} = useSmartHomeProvisioning();

	const [selectedDevice, setSelectedDevice] = useState<UnprovisionedDevice | null>(null);
	const [registerName, setRegisterName] = useState("");
	const [registerDeviceType, setRegisterDeviceType] = useState("binary");
	const [registerCategory, setRegisterCategory] = useState("lighting");
	const [wifiSsid, setWifiSsid] = useState("");
	const [wifiPassword, setWifiPassword] = useState("");
	const [saveWifi, setSaveWifi] = useState(true);
	const [showAddPanel, setShowAddPanel] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Auto-refresh rooms when provisioning completes
	useEffect(() => {
		if (!isProvisioning) {
			refreshRooms();
		}
	}, [isProvisioning]);

	const handleSelectDevice = (device: UnprovisionedDevice) => {
		setSelectedDevice(device);
		setRegisterName(device.name);
		setWifiSsid(savedSsid);
		setWifiPassword(savedPassword);
	};

	const handleRegisterSubmit = async (e: Event) => {
		e.preventDefault();
		if (!selectedDevice) return;
		setSuccessMessage(null);
		try {
			const compositeControlType = `${registerDeviceType}:${registerCategory}`;
			await provisionDevice(
				selectedDevice.macAddress,
				registerName,
				undefined, // New devices start as unassigned
				wifiSsid,
				wifiPassword,
				saveWifi,
				compositeControlType
			);
			setSuccessMessage(`Successfully registered and queued ${registerName} for provisioning!`);
			setSelectedDevice(null);
			await refreshRooms();
		} catch (err: any) {
			console.error(err);
		}
	};

	const roomsForSmartHome = [...rooms];
	if (unassignedDevices.length > 0) {
		roomsForSmartHome.push({
			id: "unassigned",
			name: "Unassigned Devices",
			iconName: "Settings2",
			minX: 0,
			maxX: 0,
			minY: 0,
			maxY: 0,
			worldX: 0,
			worldY: 0,
			worldTheta: 0,
			devices: unassignedDevices,
		});
	}

	const actions = roomsForSmartHome.flatMap((room) => getRoomActions(room));
	const devices = getAllDevices(roomsForSmartHome);

	const currentValues = actions.reduce<Record<string, boolean | number>>((acc, action) => {
		acc[action.id] = action.value ?? false;
		return acc;
	}, {});

	const { getOptimisticValue, setOptimistic, clearOptimistic } = useOptimisticMap(currentValues);

	const groupedActions = actions.reduce<Record<string, RoomAction[]>>((acc, action) => {
		const key = actionSection(action);
		acc[key] = [...(acc[key] ?? []), action];
		return acc;
	}, {});

	console.log("SMART HOME VIEW RENDER:", {
		roomsCount: rooms.length,
		unassignedCount: unassignedDevices.length,
		roomsForSmartHomeCount: roomsForSmartHome.length,
		actionsCount: actions.length,
		groupedActionsKeys: Object.keys(groupedActions),
		unassignedDevicesList: unassignedDevices.map((d) => d.name),
	});

	const triggerAction = async (action: RoomAction, value?: boolean | number) => {
		if (value === undefined) return;
		setOptimistic(action.id, value);
		setPendingActionIds((prev) => ({ ...prev, [action.id]: true }));
		setErrorMessage(null);
		try {
			await smartHomeService.executeAction(action, value);
			await refreshRooms();
		} catch (error) {
			console.error("Failed to send smart home command", error);
			setErrorMessage("Device state did not confirm the latest command.");
			clearOptimistic(action.id);
		} finally {
			setPendingActionIds((prev) => ({ ...prev, [action.id]: false }));
		}
	};

	const handleDiscover = async () => {
		setIsScanning(true);
		setErrorMessage(null);
		try {
			const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5051/api/v1";
			const connType = import.meta.env.VITE_CONNECTION_TYPE || "NATIVE";

			if (connType === "MOCK" || getServerHealth() === "offline") {
				// Simulate offline discovery
				await new Promise((resolve) => setTimeout(resolve, 1500));
				console.log("Mock discovery scan complete.");
			} else {
				const response = await fetch(`${serverUrl}/smart-home/discover?timeoutMs=2000`);
				const result = await response.json();
				if (!response.ok) {
					throw new Error(result.error?.message || "Failed to scan network");
				}
				console.log("Discovery scan results:", result);
			}
			await refreshRooms();
		} catch (error: any) {
			console.error("Discovery scan failed:", error);
			setErrorMessage(error.message || "Failed to discover new devices.");
		} finally {
			setIsScanning(false);
		}
	};

	return (
		<div className="flex-1 h-full flex flex-col p-4 bg-gray-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-300 kiosk-view select-none">
			<div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
				<header className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
					<div className="flex flex-col gap-0.5">
						<h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Smart Home</h1>
						<p className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold">
							{devices.length} devices across {rooms.length} rooms
						</p>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handleDiscover}
							disabled={isScanning}
							className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 select-none text-[10px] min-h-[32px]"
							title="Scan for already connected devices on your network"
						>
							<Wifi size={12} className={isScanning ? "animate-pulse" : ""} />
							{isScanning ? "Scanning..." : "Refresh Network"}
						</button>
						<button
							onClick={() => {
								setShowAddPanel(!showAddPanel);
								setSuccessMessage(null);
							}}
							className={cn(
								"flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold shadow-sm transition-colors cursor-pointer select-none text-[10px] min-h-[32px]",
								showAddPanel
									? "bg-amber-600 hover:bg-amber-500 text-white"
									: "bg-blue-600 hover:bg-blue-500 text-white"
							)}
						>
							<Plus size={12} />
							{showAddPanel ? "Close Setup" : "Add Device"}
						</button>
					</div>
				</header>

				{showAddPanel && (
					<div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-indigo-950/20 p-5 rounded-3xl border border-blue-100 dark:border-slate-800/80 shadow-md flex flex-col gap-4 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
						<div className="flex items-center justify-between">
							<h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
								Device Provisioning Setup
							</h3>
							{isScanningUnprovisioned && (
								<span className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
									<Loader2 size={12} className="animate-spin" /> Scanning Wi-Fi...
								</span>
							)}
						</div>

						{/* Success or Error banners */}
						{successMessage && (
							<div className="p-3 text-xs rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 flex items-center gap-2">
								<Check size={14} className="text-emerald-500 shrink-0" />
								<span>{successMessage}</span>
							</div>
						)}
						{provisioningError && (
							<div className="p-3 text-xs rounded-xl border border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 flex items-center gap-2">
								<AlertCircle size={14} className="text-red-500 shrink-0" />
								<span>{provisioningError}</span>
							</div>
						)}

						{/* Provisioning progress state */}
						{isProvisioning && (
							<div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex flex-col gap-3 items-center text-center">
								<div className="relative flex items-center justify-center">
									<div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-900 rounded-full border-t-blue-600 dark:border-t-blue-400 animate-spin" />
									<Wifi size={16} className="absolute text-blue-500 animate-pulse" />
								</div>
								<div>
									<h4 className="text-xs font-black text-gray-900 dark:text-white">
										Provisioning in Progress
									</h4>
									<p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 max-w-sm">
										{provisioningStatus.isProcessing
											? "Connecting to device AP and transferring home Wi-Fi credentials. The device will reboot to connect to your network."
											: "Enqueued in background provisioning task manager. Waiting for worker slot..."}
									</p>
								</div>
								{provisioningStatus.queueSize > 0 && (
									<span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full text-[9px] font-bold">
										Queue size: {provisioningStatus.queueSize} pending device(s)
									</span>
								)}
							</div>
						)}

						{!isProvisioning && !selectedDevice && (
							<div className="flex flex-col gap-3">
								<div className="flex items-center gap-3">
									<button
										onClick={scanUnprovisioned}
										disabled={isScanningUnprovisioned}
										className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-all disabled:opacity-50 select-none"
									>
										<RefreshCw size={14} className={isScanningUnprovisioned ? "animate-spin" : ""} />
										{isScanningUnprovisioned ? "Scanning..." : "Scan for Unprovisioned Devices"}
									</button>
								</div>

								{/* Discovered devices list */}
								<div className="flex flex-col gap-2">
									<h4 className="text-[10px] font-bold text-gray-500 dark:text-slate-400">
										Discovered Devices ({discoveredDevices.length})
									</h4>
									{discoveredDevices.length === 0 ? (
										<div className="p-6 bg-white dark:bg-slate-900/50 border border-gray-150 dark:border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center gap-1">
											<Wifi size={24} className="text-gray-300 dark:text-slate-700" />
											<p className="text-xs font-bold text-gray-400 dark:text-slate-500">
												No unprovisioned devices found.
											</p>
											<p className="text-[9px] text-gray-400 dark:text-slate-600 max-w-[250px]">
												Make sure the smart home device is powered on and broadcasting its setup hotspot (SSID starts with 'smarthome_').
											</p>
										</div>
									) : (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
											{discoveredDevices.map((device) => (
												<div
													key={device.id}
													className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800/80 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-blue-300 dark:hover:border-blue-900/60 transition-colors"
												>
													<div className="min-w-0">
														<p className="text-xs font-black text-gray-900 dark:text-white truncate">
															{device.name}
														</p>
														<p className="text-[9px] font-mono text-gray-400 dark:text-slate-500">
															MAC: {device.macAddress}
														</p>
													</div>
													<button
														onClick={() => handleSelectDevice(device)}
														className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-xl text-[10px] font-extrabold cursor-pointer transition-colors"
													>
														Configure <ArrowRight size={12} />
													</button>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						)}

						{!isProvisioning && selectedDevice && (
							<form
								onSubmit={handleRegisterSubmit}
								className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex flex-col gap-3"
							>
								<div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-slate-800">
									<h4 className="text-xs font-black text-gray-800 dark:text-slate-200">
										Register Smart Device
									</h4>
									<button
										type="button"
										onClick={() => setSelectedDevice(null)}
										className="text-[10px] font-extrabold text-red-500 hover:text-red-400 cursor-pointer bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-lg"
									>
										Cancel
									</button>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<label className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400">
											Device Name
										</label>
										<input
											type="text"
											required
											value={registerName}
											onChange={(e) => setRegisterName(e.currentTarget.value)}
											placeholder="e.g. Smart Bulb"
											className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold"
										/>
									</div>

									<div className="flex flex-col gap-1">
										<label className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400">
											Device Type
										</label>
										<select
											value={registerDeviceType}
											onChange={(e) => setRegisterDeviceType(e.currentTarget.value)}
											className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
										>
											<option value="binary">Toggle Switch (Binary)</option>
											<option value="dimmer">Slider Control (Dimmer)</option>
										</select>
									</div>

									<div className="flex flex-col gap-1">
										<label className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400">
											Category
										</label>
										<select
											value={registerCategory}
											onChange={(e) => setRegisterCategory(e.currentTarget.value)}
											className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
										>
											<option value="lighting">Lighting</option>
											<option value="climate">Climate</option>
											<option value="security">Security</option>
											<option value="media">Media</option>
											<option value="other">Other Devices</option>
										</select>
									</div>

									<div className="flex flex-col gap-1">
										<label className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400">
											Home Wi-Fi SSID
										</label>
										<input
											type="text"
											required
											value={wifiSsid}
											onChange={(e) => setWifiSsid(e.currentTarget.value)}
											placeholder="Enter Wi-Fi name"
											className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold"
										/>
									</div>

									<div className="flex flex-col gap-1 col-span-2">
										<label className="text-[10px] font-extrabold text-gray-500 dark:text-slate-400">
											Wi-Fi Password
										</label>
										<input
											type="password"
											required
											value={wifiPassword}
											onChange={(e) => setWifiPassword(e.currentTarget.value)}
											placeholder="Enter Wi-Fi password"
											className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold"
										/>
									</div>
								</div>

								<div className="flex items-center gap-2 mt-1 select-none">
									<input
										type="checkbox"
										id="saveWifiCheck"
										checked={saveWifi}
										onChange={(e) => setSaveWifi(e.currentTarget.checked)}
										className="w-4 h-4 accent-blue-600 rounded border-gray-300 cursor-pointer"
									/>
									<label htmlFor="saveWifiCheck" className="text-[10px] font-bold text-gray-500 dark:text-slate-400 cursor-pointer">
										Save Wi-Fi credentials for subsequent setups
									</label>
								</div>

								<button
									type="submit"
									className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-all"
								>
									<Check size={14} /> Start Registration &amp; Provisioning
								</button>
							</form>
						)}
					</div>
				)}

				{errorMessage && (
					<div className="p-3 text-xs rounded-xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
						{errorMessage}
					</div>
				)}

				<div className="grid grid-cols-2 gap-3" onKeyDown={handleKeyDown}>
					{Object.entries(SECTION_META).map(([key, meta]) => {
						const sectionActions = groupedActions[key] ?? [];
						const Icon = meta.icon;

						return (
							<section key={key} className="flex flex-col gap-1.5">
								<div className="flex items-center gap-2 px-1">
									<Icon className="text-slate-500 dark:text-slate-400" size={16} aria-hidden="true" />
									<h2 className="text-sm font-extrabold text-gray-800 dark:text-gray-100 uppercase tracking-wider">{meta.title}</h2>
								</div>

								<div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm min-h-[80px]">
									{sectionActions.length === 0 ? (
										<div className="h-full py-4 flex items-center justify-center text-xs text-gray-400 dark:text-slate-500">
											{isLoading ? "Loading live devices..." : "No controls."}
										</div>
									) : (
										<div className="flex flex-col gap-2">
											{sectionActions.map((action) => {
												const isPending = pendingActionIds[action.id];
												return (
													<div key={action.id} className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 p-2.5 flex items-center justify-between gap-3">
														<div className="min-w-0 flex-1">
															<p className="text-xs font-bold text-gray-900 dark:text-white truncate">{action.deviceName}</p>
															<p className="text-[9px] text-gray-400 dark:text-slate-500 truncate">
																{action.label}
															</p>
															{smartHomeService.changeDeviceRoom && (
																<div className="mt-1 flex items-center gap-1">
																	<span className="text-[8px] text-gray-400 uppercase font-black">Room:</span>
																	<select
																		value={action.roomId || "unassigned"}
																		disabled={isPending}
																		onChange={async (e) => {
																			const targetRoomId = e.currentTarget.value;
																			setPendingActionIds((prev) => ({ ...prev, [action.id]: true }));
																			try {
																				if (smartHomeService.changeDeviceRoom) {
																					await smartHomeService.changeDeviceRoom(action.deviceId, targetRoomId);
																					await refreshRooms();
																				}
																			} catch (err: any) {
																				console.error("Failed to change room:", err);
																				setErrorMessage(err.message || "Failed to change device room.");
																			} finally {
																				setPendingActionIds((prev) => ({ ...prev, [action.id]: false }));
																			}
																		}}
																		className="bg-transparent text-[9px] text-blue-600 dark:text-blue-400 border-none outline-none font-bold cursor-pointer p-0 select-none h-4"
																	>
																		<option value="unassigned" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Unassigned</option>
																		{rooms
																			.filter((r) => r.id !== "unassigned")
																			.map((r) => (
																				<option key={r.id} value={r.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
																					{r.name}
																				</option>
																			))}
																	</select>
																</div>
															)}
														</div>
														<div className="flex items-center gap-2 shrink-0">
															{action.type === "toggle" && (() => {
																const resolvedValue = getOptimisticValue(action.id, !!action.value);
																return (
																	<button
																		onClick={() => triggerAction(action, !resolvedValue)}
																		className={clsx(
																			"w-11 h-6 rounded-full flex items-center p-0.5 transition-colors cursor-pointer",
																			resolvedValue ? "bg-emerald-500 justify-end" : "bg-gray-300 dark:bg-slate-700 justify-start",
																		)}
																	>
																		<div className="w-5 h-5 rounded-full bg-white shadow-md" />
																	</button>
																);
															})()}
															{action.type === "slider" && (() => {
																const resolvedValue = Number(getOptimisticValue(action.id, action.value ?? 0));
																return (
																	<div className="flex items-center gap-2">
																		<input
																			type="range"
																			min="0"
																			max={action.command.includes("temp") ? "30" : "100"}
																			value={resolvedValue}
																			onInput={(e) => {
																				setOptimistic(action.id, Number(e.currentTarget.value));
																			}}
																			onChange={(e) => {
																				const val = Number(e.currentTarget.value);
																				setOptimistic(action.id, val);
																				triggerAction(action, val);
																			}}
																			className="w-20 accent-blue-500 cursor-pointer h-1 bg-gray-250 dark:bg-slate-700 rounded-lg appearance-none"
																		/>
																		<span className="text-[10px] font-mono font-bold text-gray-600 dark:text-slate-300">
																			{resolvedValue}
																		</span>
																	</div>
																);
															})()}
															{action.type === "button" && (
																<button
																	onClick={() => triggerAction(action, true)}
																	disabled={isPending}
																	className="px-2.5 py-1 text-[10px] font-extrabold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 cursor-pointer"
																>
																	Run
																</button>
															)}
															{isPending && <Monitor size={12} className="animate-pulse text-blue-500" />}
														</div>
													</div>
												);
											})}
										</div>
									)}
								</div>
							</section>
						);
					})}
				</div>
			</div>
		</div>
	);
}
