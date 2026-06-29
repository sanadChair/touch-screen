import { X, Maximize } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { MapCanvas } from "../components/MapCanvas";
import { useMapData } from "../hooks/useMapData";
import useGoal from "../hooks/useGoal";
import { QuickNavPanel } from "../../quick-nav/components/QuickNavPanel";
import { useQuickNav } from "../../quick-nav/hooks/useQuickNav";
import { useServerHealth } from "../../../shared/hooks/useServerHealth";
import { useRooms } from "../hooks/useRooms";
import { cn } from "../../../shared/lib/utils";

export function MapView() {
	const {
		map,
		robotPose,
		isLoading,
		error,
		isMapStable,
		navigationStatus,
		activeGoal,
		lastFeedback,
		pathHistory,
		setExternalNavigationGoal,
		cancelGoal,
	} = useMapData();
	const { handleGoalClick } = useGoal();
	const { destinations, navigateTo, activeDestinationId } = useQuickNav();
	const { isOffline, setOffline, setConnected } = useServerHealth();
	const { refreshRooms } = useRooms();
	const [isFullscreen, setIsFullscreen] = useState(false);

	const activePoint = useMemo(() => {
		if (!activeDestinationId) return null;
		const destination = destinations.find((item) => item.id === activeDestinationId);
		return destination ? { x: destination.point.x, y: destination.point.y, label: destination.label } : null;
	}, [activeDestinationId, destinations]);

	useEffect(() => {
		setExternalNavigationGoal(activePoint);
	}, [activePoint, setExternalNavigationGoal]);

	return (
		<div className="flex-1 h-full flex flex-row p-3 gap-3 bg-gray-50 dark:bg-slate-900 transition-colors duration-300 kiosk-view overflow-hidden select-none">
			{/* Left Column: Controls & Status */}
			<div className="w-40 flex flex-col gap-3 shrink-0 h-full overflow-y-auto pr-1">
				<div className="flex flex-col gap-1.5 px-1">
					<h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none">Navigation</h2>
					<button
						onClick={() => {
							if (isOffline) {
								setConnected();
								void refreshRooms();
							} else {
								setOffline();
							}
						}}
						className={cn(
							"px-2.5 py-1.5 rounded-full border text-[10px] font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer select-none w-fit",
							isOffline
								? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400"
								: "bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400"
						)}
					>
						<span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isOffline ? "bg-amber-500" : "bg-green-500")} />
						{isOffline ? "Offline (Simulated)" : "Connected"}
					</button>
				</div>

				{/* Quick Nav Panel */}
				<QuickNavPanel destinations={destinations} activeDestinationId={activeDestinationId} onNavigate={navigateTo} />

				{/* Navigation Status Card */}
				<div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-3 flex flex-col gap-2 shadow-sm shrink-0">
					<div>
						<p className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 dark:text-slate-500">Status</p>
						<p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight truncate">{navigationStatus.replaceAll("_", " ")}</p>
						<p className="mt-0.5 text-[10px] text-gray-500 dark:text-slate-400 truncate">
							Goal: {activeGoal ? `${activeGoal.x.toFixed(2)}, ${activeGoal.y.toFixed(2)}` : "No active goal"}
						</p>
					</div>

					{lastFeedback && (
						<div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800 text-[10px] font-medium text-gray-500 dark:text-slate-400 shrink-0">
							<div>
								<span className="block text-[8px] uppercase tracking-tight text-gray-400">Remaining</span>
								<span className="font-bold text-gray-800 dark:text-gray-200">{lastFeedback.distanceRemaining?.toFixed(2) ?? "--"} m</span>
							</div>
							<div>
								<span className="block text-[8px] uppercase tracking-tight text-gray-400">ETA / Recov.</span>
								<span className="font-bold text-gray-800 dark:text-gray-200">{lastFeedback.estimatedTimeRemainingSec ?? "--"}s / {lastFeedback.numberOfRecoveries ?? 0}</span>
							</div>
						</div>
					)}

					{navigationStatus !== "idle" && navigationStatus !== "succeeded" && navigationStatus !== "failed" && navigationStatus !== "canceled" && (
						<button
							onClick={cancelGoal}
							className="w-full py-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg font-bold text-[10px] shadow-sm transition-colors cursor-pointer text-center focus:outline-none select-none mt-1"
						>
							Cancel Navigation
						</button>
					)}
				</div>
			</div>

			{/* Right Column: Map Canvas Viewport */}
			<div className="flex-1 h-full flex flex-col gap-2 min-w-0 relative">
				{isLoading && (
					<div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl border border-gray-100 dark:border-slate-700">
						<span className="text-gray-500 dark:text-slate-400 font-bold text-sm animate-pulse">Loading Map...</span>
					</div>
				)}

				{error && (
					<div className="absolute top-2 left-2 right-2 z-50 p-2.5 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-500/20 shadow-sm text-[10px] font-semibold">
						<p><span className="font-bold">Error:</span> {error}</p>
					</div>
				)}

				{map && (
					<div className={isFullscreen ? "fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col p-2" : "flex-1 min-h-0 flex flex-col gap-2"}>
						<div className="absolute top-2 left-2 z-50">
							<button
								onClick={() => setIsFullscreen((prev) => !prev)}
								className="h-8 px-2.5 rounded-lg bg-slate-900/80 text-white dark:bg-slate-800/80 border border-slate-700/50 flex items-center justify-center gap-1 text-[10px] font-bold shadow-lg backdrop-blur-md cursor-pointer"
							>
								{isFullscreen ? <><X size={12} /> Close</> : <><Maximize size={12} /> Full Screen</>}
							</button>
						</div>

						<div className="flex-1 rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 group relative min-h-0">
							<MapCanvas
								mapData={map}
								robotPose={robotPose}
								className="w-full h-full object-contain"
								onGoalClick={handleGoalClick}
								externalGoal={activeGoal}
								isMapStable={isMapStable}
								pathHistory={pathHistory}
							/>
						</div>

						<div className="text-[10px] font-mono flex justify-between px-3 bg-gray-100/60 dark:bg-slate-900/60 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800/50 shrink-0">
							<span className="text-gray-500 dark:text-slate-400">Res: {map.info.resolution.toFixed(3)} m/px | {map.info.width}x{map.info.height}</span>
							<span className={robotPose ? "text-green-600 dark:text-green-400 font-bold flex items-center gap-1" : "text-amber-500 dark:text-amber-400 flex items-center gap-1"}>
								{robotPose ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)] animate-pulse"></span>LIVE</> : <><span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse"></span>Waiting Pose...</>}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
