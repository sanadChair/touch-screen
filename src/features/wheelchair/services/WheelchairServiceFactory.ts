import type { IWheelchairService } from "./IWheelchairService";
import { NativeWheelchairService } from "./NativeWheelchairService";
import { ServerWheelchairService } from "./ServerWheelchairService";

export class WheelchairServiceFactory {
	private static instance: IWheelchairService | null = null;

	static getService(): IWheelchairService {
		if (!this.instance) {
			const type = import.meta.env.VITE_CONNECTION_TYPE || "NATIVE";
			if (type === "SERVER") {
				console.log("Using Server Wheelchair Service");
				this.instance = ServerWheelchairService.getInstance();
			} else {
				console.log("Using Native (ROS) Wheelchair Service");
				this.instance = NativeWheelchairService.getInstance();
			}
		}
		return this.instance;
	}
}
