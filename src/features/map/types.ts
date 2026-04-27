import type { DefinedRoom } from "./hooks/useRooms";

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

export interface RobotPose {
	x: number;
	y: number;
	rotation: number;
}

export interface MapDataState {
	map: OccupancyGrid | null;
	robotPose: RobotPose | null;
	isLoading: boolean;
	error: string | null;
}
export interface RoomAction {
	id: string;
	label: string;
	iconName: string;
	type: "toggle" | "slider" | "button";
	value?: boolean | number;
}

export interface RoomWithActions extends DefinedRoom {
	actions: RoomAction[];
}
