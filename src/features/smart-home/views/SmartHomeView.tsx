import { clsx } from "clsx";
import {
	Lightbulb,
	Monitor,
	Music,
	Settings2,
	ShieldCheck,
	Thermometer,
	Wifi,
} from "lucide-preact";
import { useState } from "preact/hooks";
import { useRooms } from "../../map/hooks/useRooms";
import type { RoomAction } from "../../map/types";
import { getAllDevices, getRoomActions } from "../../map/lib/roomDevices";
import { SmartHomeServiceFactory } from "../services/SmartHomeServiceFactory";
import { useArrowNavigation } from "../../../shared/hooks/useArrowNavigation";
import { getServerHealth } from "../../../shared/hooks/useServerHealth";

const SECTION_META: Record<string, { icon: any; title: string }> = {
	lighting: { icon: Lightbulb, title: "Lighting" },
	climate: { icon: Thermometer, title: "Climate" },
	security: { icon: ShieldCheck, title: "Security" },
	media: { icon: Music, title: "Media" },
	other: { icon: Settings2, title: "Other Devices" },
};

const actionSection = (action: RoomAction): string => {
	const label = `${action.deviceName} ${action.command}`.toLowerCase();
	if (label.includes("light") || label.includes("brightness")) return "lighting";
	if (label.includes("temp") || label.includes("ac") || label.includes("climate")) return "climate";
	if (label.includes("lock") || label.includes("door") || label.includes("security")) return "security";
	if (label.includes("speaker") || label.includes("volume") || label.includes("tv")) return "media";
	return "other";
};

export function SmartHomeView() {
	const { rooms, refreshRooms, isLoading } = useRooms();
	const { handleKeyDown } = useArrowNavigation();
	const smartHomeService = SmartHomeServiceFactory.getService();
	const [pendingActionIds, setPendingActionIds] = useState<Record<string, boolean>>({});
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isScanning, setIsScanning] = useState(false);

	const actions = rooms.flatMap((room) => getRoomActions(room));
	const devices = getAllDevices(rooms);
	const groupedActions = actions.reduce<Record<string, RoomAction[]>>((acc, action) => {
		const key = actionSection(action);
		acc[key] = [...(acc[key] ?? []), action];
		return acc;
	}, {});

	const triggerAction = async (action: RoomAction, value?: boolean | number) => {
		setPendingActionIds((prev) => ({ ...prev, [action.id]: true }));
		setErrorMessage(null);
		try {
			await smartHomeService.executeAction(action, value);
			await refreshRooms();
		} catch (error) {
			console.error("Failed to send smart home command", error);
			setErrorMessage("Device state did not confirm the latest command.");
		} finally {
			setPendingActionIds((prev) => ({ ...prev, [action.id]: false }));
		}
	};

	const handleDiscover = async () => {
		setIsScanning(true);
		setErrorMessage(null);
		try {
			const serverUrl = import.meta.env.VITE_SERVER_URL || "http://piserver.local:5051/api/v1";
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
					<button
						onClick={handleDiscover}
						disabled={isScanning}
						className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 select-none text-[11px] min-h-[36px]"
					>
						<Wifi size={14} className={isScanning ? "animate-pulse" : ""} />
						{isScanning ? "Scanning..." : "Scan Network"}
					</button>
				</header>

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
														<div className="min-w-0">
															<p className="text-xs font-bold text-gray-900 dark:text-white truncate">{action.deviceName}</p>
															<p className="text-[9px] text-gray-400 dark:text-slate-500 truncate">
																{action.label} ({action.roomId.replaceAll("_", " ")})
															</p>
														</div>
														<div className="flex items-center gap-2 shrink-0">
															{action.type === "toggle" && (
																<button
																	onClick={() => triggerAction(action, !(action.value as boolean))}
																	disabled={isPending}
																	className={clsx(
																		"w-11 h-6 rounded-full flex items-center p-0.5 transition-colors cursor-pointer",
																		action.value ? "bg-emerald-500 justify-end" : "bg-gray-300 dark:bg-slate-700 justify-start",
																	)}
																>
																	<div className="w-5 h-5 rounded-full bg-white shadow-md" />
																</button>
															)}
															{action.type === "slider" && (
																<div className="flex items-center gap-2">
																	<input
																		type="range"
																		min="0"
																		max={action.command.includes("temp") ? "30" : "100"}
																		value={Number(action.value ?? 0)}
																		disabled={isPending}
																		onChange={(e) => triggerAction(action, Number(e.currentTarget.value))}
																		className="w-20 accent-blue-500 cursor-pointer h-1 bg-gray-250 dark:bg-slate-700 rounded-lg appearance-none"
																	/>
																	<span className="text-[10px] font-mono font-bold text-gray-600 dark:text-slate-300">
																		{Number(action.value ?? 0)}
																	</span>
																</div>
															)}
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
