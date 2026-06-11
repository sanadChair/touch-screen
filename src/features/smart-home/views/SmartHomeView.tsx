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
		<div className="flex-1 h-full flex flex-col p-6 sm:p-12 bg-gray-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-300 kiosk-view">
			<div className="max-w-6xl mx-auto w-full flex flex-col gap-6 sm:gap-10 kiosk-gap">
				<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex flex-col gap-1">
						<h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">Smart Home</h1>
						<p className="text-sm text-gray-500 dark:text-slate-400">
							{devices.length} devices across {rooms.length} rooms
						</p>
					</div>
					<button
						onClick={handleDiscover}
						disabled={isScanning}
						className="flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl font-bold shadow-md transition-colors cursor-pointer disabled:opacity-50 select-none text-center self-start sm:self-auto min-h-[48px]"
					>
						<Wifi size={20} className={isScanning ? "animate-pulse" : ""} />
						{isScanning ? "Scanning..." : "Scan Network"}
					</button>
				</header>

				{errorMessage && (
					<div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
						{errorMessage}
					</div>
				)}

				<div className="grid grid-cols-1 xl:grid-cols-2 gap-6" onKeyDown={handleKeyDown}>
					{Object.entries(SECTION_META).map(([key, meta]) => {
						const sectionActions = groupedActions[key] ?? [];
						const Icon = meta.icon;

						return (
							<section key={key} className="flex flex-col gap-4">
								<div className="flex items-center gap-3 px-2">
									<Icon className="text-slate-500 dark:text-slate-300" size={22} aria-hidden="true" />
									<h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{meta.title}</h2>
								</div>

								<div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm min-h-48">
									{sectionActions.length === 0 ? (
										<div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-slate-400">
											{isLoading ? "Loading live devices..." : "No live controls in this category."}
										</div>
									) : (
										<div className="flex flex-col gap-4">
											{sectionActions.map((action) => {
												const isPending = pendingActionIds[action.id];
												return (
													<div key={action.id} className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-4 flex items-center justify-between gap-4">
														<div className="min-w-0">
															<p className="text-base font-bold text-gray-900 dark:text-white truncate">{action.deviceName}</p>
															<p className="text-sm text-gray-500 dark:text-slate-400 truncate">
																{action.label} in {action.roomId.replaceAll("_", " ")}
															</p>
														</div>
														<div className="flex items-center gap-3 shrink-0">
															{action.type === "toggle" && (
																<button
																	onClick={() => triggerAction(action, !(action.value as boolean))}
																	disabled={isPending}
																	className={clsx(
																		"w-16 h-10 rounded-full flex items-center p-1 transition-colors",
																		action.value ? "bg-emerald-500 justify-end" : "bg-gray-300 dark:bg-slate-600 justify-start",
																	)}
																>
																	<div className="w-8 h-8 rounded-full bg-white shadow-md" />
																</button>
															)}
															{action.type === "slider" && (
																<div className="flex items-center gap-3">
																	<input
																		type="range"
																		min="0"
																		max={action.command.includes("temp") ? "30" : "100"}
																		value={Number(action.value ?? 0)}
																		disabled={isPending}
																		onChange={(e) => triggerAction(action, Number(e.currentTarget.value))}
																		className="w-32 accent-blue-500"
																	/>
																	<span className="w-10 text-right text-sm font-mono text-gray-600 dark:text-slate-300">
																		{Number(action.value ?? 0)}
																	</span>
																</div>
															)}
															{action.type === "button" && (
																<button
																	onClick={() => triggerAction(action, true)}
																	disabled={isPending}
																	className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900"
																>
																	Run
																</button>
															)}
															{isPending && <Monitor size={16} className="animate-pulse text-blue-500" />}
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
