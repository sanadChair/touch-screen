import type { IMapService } from "./IMapService";
import { MOCK_OCCUPANCY_GRID } from "../mocks/mockMap";
import type { NavigationState, OccupancyGrid, RobotPose } from "../types";

export class MockMapService implements IMapService {
	onMapUpdate(callback: (map: OccupancyGrid) => void): void {
		callback(MOCK_OCCUPANCY_GRID as OccupancyGrid);
	}

	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		callback({ x: 0, y: 0, rotation: 0 });
	}

	onNavigationStateUpdate(callback: (state: NavigationState) => void): void {
		callback({
			status: "idle",
			activeGoal: null,
			lastFeedback: null,
			pathHistory: [],
		});
	}

	setGoal(): void {}

	dispose(): void {}
}
