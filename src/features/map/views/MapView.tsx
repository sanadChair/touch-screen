import { useMapData } from "../hooks/useMapData";
import { MapCanvas } from "../components/MapCanvas";
import { useState, useMemo } from "preact/hooks";
import useGoal from "../hooks/useGoal";
import { QuickNavPanel } from "../../quick-nav/components/QuickNavPanel";
import { useQuickNav } from "../../quick-nav/hooks/useQuickNav";

export function MapView() {
	const { map, robotPose, isLoading, error } = useMapData();
	const [manualOffset] = useState({ x: -0.85, y: 0.85 });
	const { handleGoalClick } = useGoal();
	const { destinations, navigateTo, activeDestinationId } = useQuickNav();

	const activePoint = useMemo(() => {
		if (!activeDestinationId) return null;
		const dest = destinations.find((d) => d.id === activeDestinationId);
		return dest ? { x: dest.point.x, y: dest.point.y } : null;
	}, [activeDestinationId, destinations]);

	return (
		<div className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-gray-50">
			<div className="w-full max-w-4xl h-full flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold text-gray-800">
						Navigation Map
					</h2>
				</div>

				<QuickNavPanel
					destinations={destinations}
					activeDestinationId={activeDestinationId}
					onNavigate={navigateTo}
				/>

				{isLoading && (
					<div className="flex-1 w-full bg-white animate-pulse shadow-sm rounded-2xl flex items-center justify-center border border-gray-100">
						<span className="text-gray-500 font-medium">
							Loading Map...
						</span>
					</div>
				)}

				{error && (
					<div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
						Error: {error}
					</div>
				)}

				{map && (
					<div className="flex-1 w-full bg-white shadow-sm border border-gray-100 rounded-3xl p-4 flex flex-col gap-4">
						<div className="flex-1 w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
							<MapCanvas
								mapData={map}
								robotPose={robotPose}
								poseOffset={manualOffset}
								className="w-full h-full object-contain"
								onGoalClick={handleGoalClick}
								externalGoal={activePoint}
							/>
						</div>

						<div className="text-sm font-mono flex justify-between px-2 bg-gray-50 py-3 rounded-xl border border-gray-100">
							<span className="text-gray-600">
								Res: {map.info.resolution.toFixed(3)} m/px |{" "}
								{map.info.width}x{map.info.height}
							</span>
							<span
								className={
									robotPose
										? "text-green-600 font-bold flex items-center gap-2"
										: "text-amber-500 flex items-center gap-2"
								}
							>
								{robotPose ? (
									<>
										<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
										LIVE
									</>
								) : (
									<>
										<span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
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
