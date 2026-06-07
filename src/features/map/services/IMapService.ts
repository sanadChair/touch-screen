import type {
	GoalPoint,
	NavigationState,
	OccupancyGrid,
	RobotPose,
} from "../types";

export interface IMapService {
	onMapUpdate(callback: (map: OccupancyGrid) => void): void;
	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void;
	onNavigationStateUpdate(callback: (state: NavigationState) => void): void;
	setGoal(x: number, y: number, label?: string): void;
	setExternalNavigationGoal?(goal: GoalPoint | null): void;
	dispose(): void;
}
