import type { IRoomService } from "./IRoomService";
import type { DefinedRoom, RoomDevice, DeviceStateMap } from "../types";
import { getServerUrl } from "../../../shared/lib/config";

type RoomListener = (rooms: DefinedRoom[]) => void;

const ROOM_ICON_MAP: Record<string, string> = {
	kitchen: "Utensils",
	bedroom: "BedDouble",
	living_room: "Sofa",
	living: "Sofa",
	office: "Briefcase",
};

const getRoomIcon = (roomName: string): string =>
	ROOM_ICON_MAP[roomName.toLowerCase()] || "Home";

export class ServerRoomService implements IRoomService {
	private static instance: ServerRoomService | null = null;
	private serverUrl = getServerUrl();
	private listeners = new Set<RoomListener>();
	private roomsCache: DefinedRoom[] = [];
	private refreshPromise: Promise<DefinedRoom[]> | null = null;

	private constructor() {}

	public static getInstance(): ServerRoomService {
		if (!this.instance) {
			this.instance = new ServerRoomService();
		}
		return this.instance;
	}

	public getRoomsSnapshot(): DefinedRoom[] {
		return this.roomsCache;
	}

	public subscribe(listener: RoomListener): () => void {
		this.listeners.add(listener);
		listener(this.roomsCache);
		return () => this.listeners.delete(listener);
	}

	public async refreshRooms(force = false): Promise<DefinedRoom[]> {
		if (!force && this.roomsCache.length > 0) return this.roomsCache;
		if (this.refreshPromise) return this.refreshPromise;

		this.refreshPromise = (async () => {
			try {
				// 1. Fetch rooms
				const roomResponse = await fetch(`${this.serverUrl}/room`);
				const roomResult = await roomResponse.json();
				if (!roomResponse.ok || !roomResult.success) {
					throw new Error(roomResult.error?.message || "Failed to fetch rooms from server");
				}
				const roomsMap = roomResult.data; // object keyed by room UUID

				// 2. Fetch devices
				const deviceResponse = await fetch(`${this.serverUrl}/smart-home/devices`);
				const deviceResult = await deviceResponse.json();
				if (!deviceResponse.ok || !deviceResult.success) {
					throw new Error(deviceResult.error?.message || "Failed to fetch devices from server");
				}
				const devicesMap = deviceResult.data; // object keyed by device ID

				// 3. Map devices to RoomDevice shape
				const roomDevicesList: RoomDevice[] = Object.values(devicesMap).map((dev: any) => {
					const controlType = dev.controlType || "binary";
					const stateValue = dev.state ?? 0;

					let actions: string[] = [];
					if (controlType === "binary") {
						actions = ["turn_on", "turn_off"];
					} else if (controlType === "dimmer") {
						actions = ["set_brightness"];
					} else if (controlType === "thermostat") {
						actions = ["set_temperature"];
					}

					const stateMap: DeviceStateMap = {};
					if (controlType === "binary") {
						stateMap.power = stateValue === 1 ? "on" : "off";
					} else if (controlType === "dimmer") {
						stateMap.brightness = String(stateValue);
					} else if (controlType === "thermostat") {
						stateMap.temperature = String(stateValue);
					} else {
						stateMap.state = String(stateValue);
					}

					return {
						id: dev.id,
						roomId: dev.room?.id ?? "",
						roomName: dev.room?.name ?? "",
						name: dev.name,
						type: controlType,
						actions,
						state: stateMap,
					};
				});

				// 4. Map rooms and stitch devices
				const mappedRooms: DefinedRoom[] = Object.values(roomsMap).map((room: any) => {
					const roomDevices = roomDevicesList.filter(
						(d) => d.roomId === room.id || d.roomName === room.name
					);

					return {
						id: room.id,
						name: room.name,
						iconName: getRoomIcon(room.name),
						minX: room.min_x ?? 0,
						minY: room.min_y ?? 0,
						maxX: room.max_x ?? 0,
						maxY: room.max_y ?? 0,
						worldX: room.pose_x ?? 0,
						worldY: room.pose_y ?? 0,
						worldTheta: room.pose_theta ?? 0,
						devices: roomDevices,
					};
				});

				this.roomsCache = mappedRooms;
				this.emit();
				return mappedRooms;
			} catch (error) {
				console.error("Error refreshing rooms in ServerRoomService:", error);
				throw error;
			} finally {
				this.refreshPromise = null;
			}
		})();

		return this.refreshPromise;
	}

	public async addRoom(room: DefinedRoom): Promise<void> {
		const body = {
			name: room.name,
			minX: room.minX,
			maxX: room.maxX,
			minY: room.minY,
			maxY: room.maxY,
			theta: room.worldTheta,
			poseX: room.worldX,
			poseY: room.worldY,
			poseTheta: room.worldTheta,
			devices: [],
		};

		const response = await fetch(`${this.serverUrl}/room`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		const result = await response.json().catch(() => ({}));
		if (!response.ok) {
			throw new Error(result.error?.message || `Failed to add room: ${response.statusText}`);
		}

		console.log("Successfully added room:", result);
		await this.refreshRooms(true);
	}

	public async deleteRoom(id: string): Promise<void> {
		const response = await fetch(`${this.serverUrl}/room/${id}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			const errResult = await response.json().catch(() => ({}));
			throw new Error(errResult.error?.message || `Failed to delete room: ${response.statusText}`);
		}

		await this.refreshRooms(true);
	}

	public async navigateToRoom(id: string): Promise<void> {
		const response = await fetch(`${this.serverUrl}/room/${id}/navigate`, {
			method: "POST",
		});

		if (!response.ok) {
			const errResult = await response.json().catch(() => ({}));
			throw new Error(errResult.error?.message || `Failed to navigate: ${response.statusText}`);
		}
	}

	private emit(): void {
		for (const listener of this.listeners) {
			listener(this.roomsCache);
		}
	}
}
