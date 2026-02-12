import { useMapData } from "./features/map/hooks/useMapData";
import { MapCanvas } from "./features/map/components/MapCanvas";
import { useState } from "preact/hooks";
import useGoal from "./features/map/hooks/useGoal";

export function App() {
	const { map, robotPose, isLoading, error } = useMapData();

	const [manualOffset] = useState({ x: -0.85, y: 0.85 });

	const { handleGoalClick } = useGoal();

	return (
		<div className="min-h-screen w-screen bg-gray-100 p-8 flex flex-col items-center justify-center gap-6">
			<h1 className="text-2xl font-bold text-gray-800">
				Robot Kiosk Interface
			</h1>

			<div className="w-full max-w-md">
				{isLoading && (
					<div className="h-64 w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
						<span className="text-gray-500">Loading Map...</span>
					</div>
				)}

				{error && (
					<div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
						Error: {error}
					</div>
				)}

				{map && (
					<div className="flex flex-col gap-2">
						<div className="max-w-4xl mx-auto w-full">
							<MapCanvas
								mapData={map}
								robotPose={robotPose}
								poseOffset={manualOffset}
								className="w-full"
								onGoalClick={handleGoalClick}
							/>
						</div>
						<div className="text-xs text-gray-500 font-mono flex justify-between">
							<span>
								Res: {map.info.resolution} m/px |{" "}
								{map.info.width}x{map.info.height}
							</span>
							<span
								className={
									robotPose
										? "text-green-600 font-bold"
										: "text-amber-500"
								}
							>
								{robotPose ? "● LIVE" : "○ Waiting for Odom..."}
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
