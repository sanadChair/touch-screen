import * as ROSLIB from "roslib";
import type { DefinedRoom } from "../hooks/useRooms";
import { RosService } from "../../../shared/lib/RosService";

export class RoomService {
	private static instance: RoomService | null = null;
	private ros: ROSLIB.Ros;
	
	private getAllService: ROSLIB.Service<any, any>;
	private addService: ROSLIB.Service<any, any>;
	private deleteService: ROSLIB.Service<any, any>;
	private navigateService: ROSLIB.Service<any, any>;

	private constructor() {
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

	public static getInstance(): RoomService {
		if (!this.instance) {
			this.instance = new RoomService();
		}
		return this.instance;
	}

	public async getAllRooms(): Promise<DefinedRoom[]> {
		return new Promise((resolve, reject) => {
			const request = {};

			this.getAllService.callService(request, (result: any) => {
				if (result && result.rooms) {
					const rooms = result.rooms.map((r: any) => ({
						id: r.room_name,
						name: r.room_name,
						iconName: "Home", // Default icon
						minX: r.min_x,
						minY: r.min_y,
						maxX: r.max_x,
						maxY: r.max_y,
						worldX: r.pose_x,
						worldY: r.pose_y,
					}));
					resolve(rooms);
				} else {
					resolve([]);
				}
			}, (error: string) => {
				console.error("Error calling rooms/get_all:", error);
				reject(error);
			});
		});
	}

	public async addRoom(room: DefinedRoom): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = {
				room: {
					room_name: room.name,
					min_x: room.minX,
					max_x: room.maxX,
					min_y: room.minY,
					max_y: room.maxY,
					theta: 0.0,
					pose_x: room.worldX,
					pose_y: room.worldY,
					pose_theta: 0.0,
					devices: [],
				}
			};

			this.addService.callService(request, () => {
				resolve();
			}, (error: string) => {
				console.error("Error calling rooms/add:", error);
				reject(error);
			});
		});
	}

	public async deleteRoom(roomName: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = {
				room_name: roomName
			};

			this.deleteService.callService(request, () => {
				resolve();
			}, (error: string) => {
				console.error("Error calling rooms/delete:", error);
				reject(error);
			});
		});
	}

	public async navigateToRoom(roomName: string): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = {
				room_name: roomName
			};

			this.navigateService.callService(request, () => {
				resolve();
			}, (error: string) => {
				console.error("Error calling rooms/navigate:", error);
				reject(error);
			});
		});
	}
}
