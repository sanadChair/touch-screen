import type { ISmartHomeService } from "./ISmartHomeService";
import { NativeSmartHomeService } from "./NativeSmartHomeService";
import { ServerSmartHomeService } from "./ServerSmartHomeService";

export class SmartHomeServiceFactory {
	private static instance: ISmartHomeService | null = null;

	static getService(): ISmartHomeService {
		if (!this.instance) {
			const type = import.meta.env.VITE_CONNECTION_TYPE || "NATIVE";
			if (type === "SERVER") {
				console.log("Using Server Smart Home Service");
				this.instance = ServerSmartHomeService.getInstance();
			} else {
				console.log("Using Native (ROS) Smart Home Service");
				this.instance = NativeSmartHomeService.getInstance();
			}
		}
		return this.instance;
	}
}
