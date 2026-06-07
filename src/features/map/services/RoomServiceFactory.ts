import type { IRoomService } from "./IRoomService";
import { NativeRoomService } from "./NativeRoomService";
import { ServerRoomService } from "./ServerRoomService";

export class RoomServiceFactory {
	private static instance: IRoomService | null = null;

	static getService(): IRoomService {
		if (!this.instance) {
			const type = import.meta.env.VITE_CONNECTION_TYPE || "NATIVE";
			if (type === "SERVER") {
				console.log("Using Server Room Service");
				this.instance = ServerRoomService.getInstance();
			} else {
				console.log("Using Native (ROS) Room Service");
				this.instance = NativeRoomService.getInstance();
			}
		}
		return this.instance;
	}
}
