import type { OccupancyGrid, RobotPose } from "../types";

export interface IMapService {
	fetchMap(): Promise<OccupancyGrid>;
	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void;
	offRobotPoseUpdate?(): void;
}
