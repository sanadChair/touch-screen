import type {
	DefinedRoom,
	DeviceStateMap,
	RoomAction,
	RoomDevice,
	RosDevice,
} from "../types";

const ROOM_ICON_MAP: Record<string, string> = {
	kitchen: "Utensils",
	bedroom: "BedDouble",
	living_room: "Sofa",
	living: "Sofa",
	office: "Briefcase",
};

const ACTION_ICON_MAP: Record<string, string> = {
	light: "Lightbulb",
	speaker: "Volume2",
	tv: "Monitor",
	ac: "Thermometer",
	climate: "Thermometer",
	door: "Lock",
	lock: "Lock",
	security: "ShieldCheck",
	coffee: "Coffee",
};

const NUMERIC_STATE_KEYS = ["brightness", "volume", "temperature", "temp"];

const toStateMap = (device: RosDevice): DeviceStateMap =>
	device.state_keys.reduce<DeviceStateMap>((acc, key, index) => {
		acc[key] = device.state_values[index] ?? "";
		return acc;
	}, {});

const getRoomIcon = (roomName: string): string =>
	ROOM_ICON_MAP[roomName.toLowerCase()] || "Home";

const normalizeRoomBounds = (room: any) => {
	const minX = Number(room.min_x ?? 0);
	const maxX = Number(room.max_x ?? 0);
	const minY = Number(room.min_y ?? 0);
	const maxY = Number(room.max_y ?? 0);
	const poseX = Number(room.pose_x ?? 0);
	const poseY = Number(room.pose_y ?? 0);
	const width = Math.max(0.5, Math.abs(maxX - minX));
	const height = Math.max(0.5, Math.abs(maxY - minY));
	const poseInsideBounds =
		poseX >= Math.min(minX, maxX) &&
		poseX <= Math.max(minX, maxX) &&
		poseY >= Math.min(minY, maxY) &&
		poseY <= Math.max(minY, maxY);

	if (poseInsideBounds) {
		return { minX, maxX, minY, maxY };
	}

	return {
		minX: poseX - width / 2,
		maxX: poseX + width / 2,
		minY: poseY - height / 2,
		maxY: poseY + height / 2,
	};
};

const getActionIcon = (device: RoomDevice, command: string): string => {
	if (command.includes("temp")) return "Thermometer";
	if (command.includes("brightness")) return "Lightbulb";
	if (command.includes("volume")) return "Volume2";
	return ACTION_ICON_MAP[device.type.toLowerCase()] || "Settings2";
};

const getNumericValue = (device: RoomDevice, command: string): number => {
	const stateEntry = Object.entries(device.state).find(([key, value]) => {
		if (!NUMERIC_STATE_KEYS.includes(key.toLowerCase())) return false;
		return !Number.isNaN(Number(value));
	});

	if (command.includes("brightness")) {
		return Number(device.state.brightness ?? stateEntry?.[1] ?? 0);
	}

	if (command.includes("volume")) {
		return Number(device.state.volume ?? stateEntry?.[1] ?? 0);
	}

	if (command.includes("temp")) {
		return Number(
			device.state.temperature ?? device.state.temp ?? stateEntry?.[1] ?? 22,
		);
	}

	return Number(stateEntry?.[1] ?? 0);
};

const getToggleValue = (device: RoomDevice): boolean => {
	const power = device.state.power ?? device.state.locked ?? device.state.armed;
	if (typeof power !== "string") return false;
	const normalized = power.toLowerCase();
	return normalized === "on" || normalized === "true" || normalized === "locked";
};

const toSliderAction = (device: RoomDevice, command: string): RoomAction => ({
	id: `${device.id}:${command}`,
	roomId: device.roomId,
	deviceId: device.id,
	deviceName: device.name,
	label: device.name,
	iconName: getActionIcon(device, command),
	type: "slider",
	command,
	value: getNumericValue(device, command),
});

const toToggleAction = (device: RoomDevice): RoomAction => ({
	id: `${device.id}:power`,
	roomId: device.roomId,
	deviceId: device.id,
	deviceName: device.name,
	label: device.name,
	iconName: getActionIcon(device, "power"),
	type: "toggle",
	command: "power",
	value: getToggleValue(device),
});

const toButtonAction = (device: RoomDevice, command: string): RoomAction => ({
	id: `${device.id}:${command}`,
	roomId: device.roomId,
	deviceId: device.id,
	deviceName: device.name,
	label: `${device.name} ${command.replaceAll("_", " ")}`,
	iconName: getActionIcon(device, command),
	type: "button",
	command,
});

export const mapRosDevice = (
	roomId: string,
	roomName: string,
	device: RosDevice,
): RoomDevice => ({
	id: device.id,
	roomId,
	roomName,
	name: device.name,
	type: device.type,
	actions: device.action,
	state: toStateMap(device),
});

export const mapRosRoom = (room: any): DefinedRoom => {
	const bounds = normalizeRoomBounds(room);

	return {
		id: room.room_name,
		name: room.room_name,
		iconName: getRoomIcon(room.room_name),
		minX: bounds.minX,
		minY: bounds.minY,
		maxX: bounds.maxX,
		maxY: bounds.maxY,
		worldX: room.pose_x,
		worldY: room.pose_y,
		worldTheta: room.pose_theta ?? 0,
		devices: (room.devices ?? []).map((device: RosDevice) =>
			mapRosDevice(room.room_name, room.room_name, device),
		),
	};
};

export const getRoomActions = (room: DefinedRoom): RoomAction[] => {
	const actions: RoomAction[] = [];

	for (const device of room.devices) {
		const hasToggle = device.actions.includes("turn_on") || device.actions.includes("turn_off");

		if (hasToggle) {
			actions.push(toToggleAction(device));
		}

		for (const command of device.actions) {
			if (command === "turn_on" || command === "turn_off") continue;
			if (command.startsWith("set_")) {
				actions.push(toSliderAction(device, command));
				continue;
			}
			actions.push(toButtonAction(device, command));
		}
	}

	return actions;
};

export const getAllDevices = (rooms: DefinedRoom[]): RoomDevice[] =>
	rooms.flatMap((room) => room.devices);
