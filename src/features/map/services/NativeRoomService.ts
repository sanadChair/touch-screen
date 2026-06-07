import * as ROSLIB from "roslib";
import type { DefinedRoom } from "../types";
import { mapRosRoom } from "../lib/roomDevices";
import { RosService } from "../../../shared/lib/RosService";
import type { IRoomService } from "./IRoomService";

type RoomListener = (rooms: DefinedRoom[]) => void;

export class NativeRoomService implements IRoomService {
	private static instance: NativeRoomService | null = null;
	private ros: ROSLIB.Ros;
	private listeners = new Set<RoomListener>();
	private roomsCache: DefinedRoom[] = [];
	private refreshPromise: Promise<DefinedRoom[]> | null = null;
	private getAllService: ROSLIB.Service<any, any>;
	private addService: ROSLIB.Service<any, any>;
	private deleteService: ROSLIB.Service<any, any>;
	private navigateService: ROSLIB.Service<any, any>;

	constructor() {
		this.ros = RosService.getInstance().getRos();
		this.getAllService = new ROSLIB.Service({
			ros: this.ros,
			name: "/rooms/get_all",
			serviceType: "sanad_interfaces/srv/GetAllRooms",
		});
		this.addService = new ROSLIB.Service({
			ros: this.ros,
			name: "/rooms/add",
			serviceType: "sanad_interfaces/srv/AddRoom",
		});
		this.deleteService = new ROSLIB.Service({
			ros: this.ros,
			name: "/rooms/delete",
			serviceType: "sanad_interfaces/srv/DeleteRoom",
		});
		this.navigateService = new ROSLIB.Service({
			ros: this.ros,
			name: "/rooms/navigate",
			serviceType: "sanad_interfaces/srv/NavigateToRoom",
		});
	}

	public static getInstance(): NativeRoomService {
		if (!this.instance) this.instance = new NativeRoomService();
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

		this.refreshPromise = new Promise((resolve, reject) => {
			this.getAllService.callService(
				{},
				(result: any) => {
					const rooms = (result?.rooms ?? []).map(mapRosRoom);
					this.roomsCache = rooms;
					this.emit();
					this.refreshPromise = null;
					resolve(rooms);
				},
				(error: string) => {
					console.error("Error calling rooms/get_all:", error);
					this.refreshPromise = null;
					reject(error);
				},
			);
		});

		return this.refreshPromise;
	}

	public async addRoom(room: DefinedRoom): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			this.addService.callService(
				{
					room: {
						room_name: room.name,
						min_x: room.minX,
						max_x: room.maxX,
						min_y: room.minY,
						max_y: room.maxY,
						theta: 0.0,
						pose_x: room.worldX,
						pose_y: room.worldY,
						pose_theta: room.worldTheta,
						devices: [],
					},
				},
				() => resolve(),
				(error: string) => reject(error),
			);
		});
		await this.refreshRooms(true);
	}

	public async deleteRoom(roomName: string): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			this.deleteService.callService(
				{ name: roomName },
				() => resolve(),
				(error: string) => reject(error),
			);
		});
		await this.refreshRooms(true);
	}

	public async navigateToRoom(roomName: string): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			this.navigateService.callService(
				{ room_name: roomName },
				() => resolve(),
				(error: string) => reject(error),
			);
		});
	}

	private emit(): void {
		for (const listener of this.listeners) {
			listener(this.roomsCache);
		}
	}
}
