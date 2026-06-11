import { X, Maximize } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { MapCanvas } from "../components/MapCanvas";
import { useMapData } from "../hooks/useMapData";
import useGoal from "../hooks/useGoal";
import { QuickNavPanel } from "../../quick-nav/components/QuickNavPanel";
import { useQuickNav } from "../../quick-nav/hooks/useQuickNav";

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
		<div className="flex-1 h-full flex flex-col items-center justify-center p-6 sm:p-12 bg-gray-50 dark:bg-slate-900 transition-colors duration-300 kiosk-view">
			<div className="w-full max-w-5xl h-full flex flex-col gap-6">
				<div className="flex items-center justify-between px-2">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Navigation Map</h2>
				</div>

				<QuickNavPanel destinations={destinations} activeDestinationId={activeDestinationId} onNavigate={navigateTo} />

				{isLoading && (
					<div className="flex-1 w-full bg-white dark:bg-slate-800 animate-pulse shadow-sm rounded-3xl flex items-center justify-center border border-gray-100 dark:border-slate-700">
						<span className="text-gray-500 dark:text-slate-400 font-medium text-lg">Loading Map Data...</span>
					</div>
				)}

				{error && (
					<div className="p-6 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-500/20 shadow-sm font-medium">
						<p className="flex items-center gap-2"><span className="font-bold">Error:</span> {error}</p>
					</div>
				)}

				{map && (
					<div className={isFullscreen ? "fixed inset-0 z-[100] bg-white dark:bg-slate-900 flex flex-col gap-4 p-0" : "flex-1 w-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 rounded-[2.5rem] p-5 flex flex-col gap-5 transition-colors duration-300"}>
						<div className={isFullscreen ? "flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700" : "w-full"}>
							<button
								onClick={() => setIsFullscreen((prev) => !prev)}
								className={isFullscreen ? "h-12 w-12 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center" : "w-full h-12 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold flex items-center justify-center gap-3"}
							>
								{isFullscreen ? <X size={22} /> : <><Maximize size={18} /> Full Screen Map</>}
							</button>
						</div>

						{!isFullscreen && (
						<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div className="md:col-span-2 rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-4 flex flex-col justify-between min-h-[110px]">
								<div>
									<p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Navigation Status</p>
									<p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">{navigationStatus.replaceAll("_", " ")}</p>
									<p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
										Goal: {activeGoal ? `${activeGoal.x.toFixed(2)}, ${activeGoal.y.toFixed(2)}` : "No active goal"}
									</p>
								</div>
								{navigationStatus !== "idle" && navigationStatus !== "succeeded" && navigationStatus !== "failed" && navigationStatus !== "canceled" && (
									<button
										onClick={cancelGoal}
										className="mt-3 w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm shadow-sm transition-colors cursor-pointer text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 select-none"
									>
										Cancel Navigation
									</button>
								)}
							</div>
							<div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-4">
								<p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">Remaining</p>
								<p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
									{lastFeedback?.distanceRemaining?.toFixed(2) ?? "--"} m
								</p>
							</div>
							<div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-4">
								<p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">ETA / Recoveries</p>
								<p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
									{lastFeedback?.estimatedTimeRemainingSec ?? "--"}s / {lastFeedback?.numberOfRecoveries ?? 0}
								</p>
							</div>
						</div>
						)}

						<div className={isFullscreen ? "flex-1 w-full overflow-hidden bg-gray-50 dark:bg-slate-950 group relative" : "flex-1 w-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 group relative"}>
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

						<div className={isFullscreen ? "text-sm font-mono flex justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900" : "text-sm font-mono flex justify-between px-4 bg-gray-50 dark:bg-slate-900/50 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors duration-300"}>
							<span className="text-gray-500 dark:text-slate-400">Res: {map.info.resolution.toFixed(3)} m/px | {map.info.width}x{map.info.height}</span>
							<span className={robotPose ? "text-green-600 dark:text-green-400 font-bold flex items-center gap-2" : "text-amber-500 dark:text-amber-400 flex items-center gap-2"}>
								{robotPose ? <><span className="w-2.5 h-2.5 rounded-full bg-green-500 dark:bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>LIVE</> : <><span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"></span>Waiting for Pose...</>}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
