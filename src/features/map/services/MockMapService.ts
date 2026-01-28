import type { IMapService } from "./IMapService";
import type { OccupancyGrid } from "../types";
import { MOCK_OCCUPANCY_GRID } from "../mocks/mockMap";

export class MockMapService implements IMapService {
	async fetchMap(): Promise<OccupancyGrid> {
		return new Promise((resolve) => {
			setTimeout(() => {
				console.log("[MockService] Map data delivered.");
				resolve(MOCK_OCCUPANCY_GRID as OccupancyGrid);
			}, 1500);
		});
	}
}
