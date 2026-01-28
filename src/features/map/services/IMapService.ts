import type { OccupancyGrid } from "../types";

export interface IMapService {
	fetchMap(): Promise<OccupancyGrid>;
}
