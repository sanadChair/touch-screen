import { useMapData } from "../hooks/useMapData";
import { MapCanvas } from "../components/MapCanvas";
import { useState, useMemo } from "preact/hooks";
import useGoal from "../hooks/useGoal";
import { QuickNavPanel } from "../../quick-nav/components/QuickNavPanel";
import { useQuickNav } from "../../quick-nav/hooks/useQuickNav";

export function MapView() {
	const { map, robotPose, isLoading, error, isMapStable } = useMapData();
	const [manualOffset] = useState({ x: -0.85, y: 0.85 });
	const { handleGoalClick } = useGoal();
	const { destinations, navigateTo, activeDestinationId } = useQuickNav();

	const activePoint = useMemo(() => {
		if (!activeDestinationId) return null;
		const dest = destinations.find((d) => d.id === activeDestinationId);
		return dest ? { x: dest.point.x, y: dest.point.y } : null;
	}, [activeDestinationId, destinations]);

	return (
		<div className="flex-1 h-full flex flex-col items-center justify-center p-8 md:p-12 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
			<div className="w-full max-w-5xl h-full flex flex-col gap-6">
				<div className="flex items-center justify-between px-2">
					<h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
						Navigation Map
					</h2>
				</div>

				<QuickNavPanel
					destinations={destinations}
					activeDestinationId={activeDestinationId}
					onNavigate={navigateTo}
				/>

				{isLoading && (
					<div className="flex-1 w-full bg-white dark:bg-slate-800 animate-pulse shadow-sm rounded-3xl flex items-center justify-center border border-gray-100 dark:border-slate-700">
						<span className="text-gray-500 dark:text-slate-400 font-medium text-lg">
							Loading Map Data...
						</span>
					</div>
				)}

				{error && (
					<div className="p-6 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-3xl border border-red-100 dark:border-red-500/20 shadow-sm font-medium">
						<p className="flex items-center gap-2">
							<span className="font-bold">Error:</span> {error}
						</p>
					</div>
				)}

				{map && (
					<div className="flex-1 w-full bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 rounded-[2.5rem] p-5 flex flex-col gap-5 transition-colors duration-300">
						<div className="flex-1 w-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 group relative">
							<MapCanvas
								mapData={map}
								robotPose={robotPose}
								poseOffset={manualOffset}
								className="w-full h-full object-contain"
								onGoalClick={handleGoalClick}
								externalGoal={activePoint}
								isMapStable={isMapStable}
							/>
						</div>

						<div className="text-sm font-mono flex justify-between px-4 bg-gray-50 dark:bg-slate-900/50 py-4 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors duration-300">
							<span className="text-gray-500 dark:text-slate-400">
								Res: {map.info.resolution.toFixed(3)} m/px |{" "}
								{map.info.width}x{map.info.height}
							</span>
							<span
								className={
									robotPose
										? "text-green-600 dark:text-green-400 font-bold flex items-center gap-2"
										: "text-amber-500 dark:text-amber-400 flex items-center gap-2"
								}
							>
								{robotPose ? (
									<>
										<span className="w-2.5 h-2.5 rounded-full bg-green-500 dark:bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
										LIVE
									</>
								) : (
									<>
										<span className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"></span>
										Waiting for Odom...
									</>
								)}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
