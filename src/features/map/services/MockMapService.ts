import type { IMapService } from "./IMapService";
import type { OccupancyGrid, RobotPose } from "../types";
import { MOCK_OCCUPANCY_GRID } from "../mocks/mockMap";

export class MockMapService implements IMapService {
	onMapUpdate(callback: (map: OccupancyGrid) => void): void {
		callback(MOCK_OCCUPANCY_GRID as OccupancyGrid);
	}
	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		callback({ x: 0, y: 0, rotation: 0 } as RobotPose);
	}
	setGoal(x: number, y: number): void {
		console.log(`🎯 Sending Goal: X=${x}, Y=${y}`);
	}
	dispose(): void {}
}
