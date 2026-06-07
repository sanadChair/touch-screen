export interface RosDevice {
	id: string;
	name: string;
	type: string;
	action: string[];
	state_keys: string[];
	state_values: string[];
}

export interface DeviceStateMap {
	[key: string]: string;
}

export interface RoomDevice {
	id: string;
	roomId: string;
	roomName: string;
	name: string;
	type: string;
	actions: string[];
	state: DeviceStateMap;
}

export interface DefinedRoom {
	id: string;
	name: string;
	iconName: string;
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	worldX: number;
	worldY: number;
	worldTheta: number;
	devices: RoomDevice[];
}

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

export interface GoalPoint {
	x: number;
	y: number;
	label?: string;
}

export interface PathPoint extends RobotPose {
	timestamp: number;
}

export type NavigationStatus =
	| "idle"
	| "goal_sent"
	| "navigating"
	| "succeeded"
	| "failed"
	| "canceled";

export interface NavigationFeedback {
	currentPose?: RobotPose | null;
	distanceRemaining?: number;
	estimatedTimeRemainingSec?: number;
	navigationTimeSec?: number;
	numberOfRecoveries?: number;
}

export interface NavigationState {
	status: NavigationStatus;
	activeGoal: GoalPoint | null;
	lastFeedback: NavigationFeedback | null;
	pathHistory: PathPoint[];
}

export interface MapDataState {
	map: OccupancyGrid | null;
	robotPose: RobotPose | null;
	isLoading: boolean;
	error: string | null;
	navigationStatus: NavigationStatus;
	activeGoal: GoalPoint | null;
	lastFeedback: NavigationFeedback | null;
	pathHistory: PathPoint[];
}

export interface RoomAction {
	id: string;
	roomId: string;
	deviceId: string;
	deviceName: string;
	label: string;
	iconName: string;
	type: "toggle" | "slider" | "button";
	command: string;
	value?: boolean | number;
}

export interface RoomWithActions extends DefinedRoom {
	actions: RoomAction[];
}
