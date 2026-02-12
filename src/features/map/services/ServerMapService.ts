import type { IMapService } from "./IMapService";
import type { OccupancyGrid, RobotPose } from "../types";

export class ServerMapService implements IMapService {
	private serverUrl =
		import.meta.env.VITE_SERVER_URL || "http://localhost:3000/api/v1";
	private _mapInterval: number | undefined;
	private _poseInterval: number | undefined;

	constructor() {}

	onMapUpdate(callback: (map: OccupancyGrid) => void): void {
		const fetchMap = async () => {
			try {
				const response = await fetch(`${this.serverUrl}/map`);
				const result = await response.json();
				if (result.status === "success" && result.data) {
					const serverMap = result.data;

					// Convert server map format to OccupancyGrid
					// We need to create a dummy header/info structure that matches OccupancyGrid interface
					// effectively transforming the simplified server response back to a ROS-like structure
					// or at least what the UI expects.

					const grid: OccupancyGrid = {
						header: {
							frame_id: serverMap.frame || "map",
							stamp: { sec: 0, nanosec: 0 }, // Timestamp might not be crucial for display
						},
						info: {
							resolution: serverMap.resolution,
							width: serverMap.width,
							height: serverMap.height,
							origin: {
								position: {
									x: serverMap.origin?.x || 0,
									y: serverMap.origin?.y || 0,
									z: 0,
								},
								orientation: {
									x: 0,
									y: 0,
									z: 0,
									w: 1, // Simplified, actual orientation might need yaw->quat if used
								},
							},
						},
						data: serverMap.map,
					};
					callback(grid);
				}
			} catch (error) {
				console.error("Error fetching map:", error);
			}
		};

		fetchMap();
		// Poll every 5 seconds for map (map doesn't change often)
		this._mapInterval = setInterval(fetchMap, 5000) as unknown as number;
	}

	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		const fetchPose = async () => {
			try {
				const response = await fetch(`${this.serverUrl}/pose`);
				const result = await response.json();
				if (result.status === "success" && result.data) {
					const poseData = result.data;
					callback({
						x: poseData.x,
						y: poseData.y,
						rotation: poseData.yaw,
					});
				}
			} catch (error) {
				console.error("Error fetching pose:", error);
			}
		};

		fetchPose();
		// Poll every 100ms for pose (needs to be smooth)
		this._poseInterval = setInterval(fetchPose, 100) as unknown as number;
	}

	setGoal(x: number, y: number): void {
		fetch(`${this.serverUrl}/goal`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ x, y, yaw: 0 }),
		}).catch((error) => console.error("Error sending goal:", error));
	}

	dispose(): void {
		if (this._mapInterval) clearInterval(this._mapInterval);
		if (this._poseInterval) clearInterval(this._poseInterval);
	}
}
