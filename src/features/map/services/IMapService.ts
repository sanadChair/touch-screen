import type { OccupancyGrid, RobotPose } from "../types";

export interface IMapService {
	onMapUpdate(callback: (map: OccupancyGrid) => void): void;
	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void;
	setGoal(x: number, y: number): void;
	dispose(): void;
}
