export interface OccupancyGrid {
	header: {
		frame_id: string;
		stamp: { sec: number; nanosec: number };
	};
	info: {
		resolution: number;
		width: number;
		height: number;
		origin: {
			position: { x: number; y: number; z: number };
			orientation: { x: number; y: number; z: number; w: number };
		};
	};
	data: number[];
}

export interface MapDataState {
	map: OccupancyGrid | null;
	isLoading: boolean;
	error: string | null;
}
