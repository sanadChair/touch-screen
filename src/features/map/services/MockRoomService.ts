import type { IRoomService } from "./IRoomService";
import type { DefinedRoom, RoomDevice } from "../types";

export class MockRoomService implements IRoomService {
	private static instance: MockRoomService | null = null;
	private rooms: DefinedRoom[] = [
		{
			id: "living_room",
			name: "Living Room",
			iconName: "Sofa",
			minX: -2.5,
			maxX: 2.5,
			minY: -2.5,
			maxY: 2.5,
			worldX: 0.0,
			worldY: 0.0,
			worldTheta: 0.0,
			devices: [
				{
					id: "living_light",
					roomId: "living_room",
					roomName: "Living Room",
					name: "Ceiling Light",
					type: "binary",
					actions: ["turn_on", "turn_off"],
					state: { power: "off" },
				},
				{
					id: "living_tv",
					roomId: "living_room",
					roomName: "Living Room",
					name: "Smart TV",
					type: "binary",
					actions: ["turn_on", "turn_off"],
					state: { power: "off" },
				},
			],
		},
		{
			id: "bedroom",
			name: "Bedroom",
			iconName: "BedDouble",
			minX: 3.0,
			maxX: 7.0,
			minY: -2.5,
			maxY: 1.5,
			worldX: 5.0,
			worldY: 0.0,
			worldTheta: 1.57,
			devices: [
				{
					id: "bedroom_light",
					roomId: "bedroom",
					roomName: "Bedroom",
					name: "Bedside Lamp",
					type: "binary",
					actions: ["turn_on", "turn_off"],
					state: { power: "off" },
				},
				{
					id: "bedroom_ac",
					roomId: "bedroom",
					roomName: "Bedroom",
					name: "Air Conditioner",
					type: "dimmer",
					actions: ["set_brightness"],
					state: { brightness: "22" },
				},
			],
		},
		{
			id: "kitchen",
			name: "Kitchen",
			iconName: "Utensils",
			minX: -7.0,
			maxX: -3.0,
			minY: -2.5,
			maxY: 1.5,
			worldX: -5.0,
			worldY: 0.0,
			worldTheta: -1.57,
			devices: [
				{
					id: "kitchen_light",
					roomId: "kitchen",
					roomName: "Kitchen",
					name: "Overhead Light",
					type: "binary",
					actions: ["turn_on", "turn_off"],
					state: { power: "on" },
				},
			],
		},
		{
			id: "office",
			name: "Office",
			iconName: "Briefcase",
			minX: -2.5,
			maxX: 2.5,
			minY: 3.0,
			maxY: 7.0,
			worldX: 0.0,
			worldY: 5.0,
			worldTheta: 3.14,
			devices: [
				{
					id: "office_light",
					roomId: "office",
					roomName: "Office",
					name: "Desk Lamp",
					type: "binary",
					actions: ["turn_on", "turn_off"],
					state: { power: "off" },
				},
			],
		},
	];
	private listeners = new Set<(rooms: DefinedRoom[]) => void>();

	private constructor() {}

	public static getInstance(): MockRoomService {
		if (!this.instance) {
			this.instance = new MockRoomService();
		}
		return this.instance;
	}

	public getRoomsSnapshot(): DefinedRoom[] {
		return this.rooms;
	}

	public subscribe(listener: (rooms: DefinedRoom[]) => void): () => void {
		this.listeners.add(listener);
		listener(this.rooms);
		return () => this.listeners.delete(listener);
	}

	public async refreshRooms(): Promise<DefinedRoom[]> {
		return this.rooms;
	}

	public async addRoom(room: DefinedRoom): Promise<void> {
		this.rooms = [...this.rooms, room];
		this.emit();
	}

	public async deleteRoom(id: string): Promise<void> {
		this.rooms = this.rooms.filter((r) => r.id !== id);
		this.emit();
	}

	public async navigateToRoom(id: string): Promise<void> {
		console.log(`MockRoomService: Navigating to room ${id}`);
	}

	public updateDeviceState(deviceId: string, command: string, value?: boolean | number): void {
		this.rooms = this.rooms.map((room) => {
			const devices = room.devices.map((device) => {
				if (device.id !== deviceId) return device;

				const nextState = { ...device.state };
				if (command === "turn_on") {
					nextState.power = "on";
				} else if (command === "turn_off") {
					nextState.power = "off";
				} else if (command === "set_brightness") {
					nextState.brightness = String(value);
				} else if (command === "set_temperature") {
					nextState.temperature = String(value);
				} else {
					nextState.state = String(value);
				}

				return { ...device, state: nextState };
			});
			return { ...room, devices };
		});
		this.emit();
	}

	public addDevice(roomId: string, device: { id: string; name: string; type: string; category?: string }): void {
		const targetRoomId = roomId && roomId !== "" ? roomId : "unassigned";

		// Create virtual Unassigned room if target is unassigned and doesn't exist yet
		if (targetRoomId === "unassigned" && !this.rooms.some((r) => r.id === "unassigned")) {
			this.rooms.push({
				id: "unassigned",
				name: "Unassigned Devices",
				iconName: "Settings2",
				minX: 0,
				maxX: 0,
				minY: 0,
				maxY: 0,
				worldX: 0,
				worldY: 0,
				worldTheta: 0,
				devices: [],
			});
		}

		this.rooms = this.rooms.map((room) => {
			if (room.id !== targetRoomId && room.name !== targetRoomId) return room;
			if (room.devices.some((d) => d.id === device.id)) return room;

			const newDevice: RoomDevice = {
				id: device.id,
				roomId: room.id,
				roomName: room.name,
				name: device.name,
				type: device.type,
				category: device.category,
				actions: device.type === "binary" ? ["turn_on", "turn_off"] : ["set_brightness"],
				state: device.type === "binary" ? { power: "off" } : { brightness: "0" },
			};
			return {
				...room,
				devices: [...room.devices, newDevice],
			};
		});
		this.emit();
	}

	public moveDeviceToRoom(deviceId: string, roomId: string): void {
		let deviceToMove: RoomDevice | null = null;

		// 1. Remove device from its current room
		this.rooms = this.rooms.map((room) => {
			const dev = room.devices.find((d) => d.id === deviceId);
			if (!dev) return room;
			deviceToMove = dev;
			return {
				...room,
				devices: room.devices.filter((d) => d.id !== deviceId),
			};
		});

		// 2. Add virtual Unassigned room if moving to unassigned and doesn't exist
		if (roomId === "unassigned" && !this.rooms.some((r) => r.id === "unassigned")) {
			this.rooms.push({
				id: "unassigned",
				name: "Unassigned Devices",
				iconName: "Settings2",
				minX: 0,
				maxX: 0,
				minY: 0,
				maxY: 0,
				worldX: 0,
				worldY: 0,
				worldTheta: 0,
				devices: [],
			});
		}

		// 3. Add to the target room
		if (deviceToMove) {
			const dev = deviceToMove as RoomDevice;
			this.rooms = this.rooms.map((room) => {
				if (room.id !== roomId && room.name !== roomId) return room;
				return {
					...room,
					devices: [
						...room.devices,
						{ ...dev, roomId: room.id, roomName: room.name },
					],
				};
			});
		}

		// 4. Prune the unassigned room if it is empty now
		this.rooms = this.rooms.filter((room) => {
			if (room.id === "unassigned" && room.devices.length === 0) {
				return false;
			}
			return true;
		});

		this.emit();
	}

	private emit() {
		for (const listener of this.listeners) {
			listener(this.rooms);
		}
	}
}
