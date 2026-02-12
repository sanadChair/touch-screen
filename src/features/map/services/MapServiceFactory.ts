import { NativeMapService } from "./NativeMapService";
import { ServerMapService } from "./ServerMapService";
import type { IMapService } from "./IMapService";

export class MapServiceFactory {
	private static instance: IMapService | null = null;

	static getService(): IMapService {
		if (!this.instance) {
			const type = import.meta.env.VITE_CONNECTION_TYPE;
			if (type === "SERVER") {
				console.log("Using Server Map Service");
				this.instance = new ServerMapService();
			} else {
				console.log("Using Native (ROS) Map Service");
				this.instance = new NativeMapService();
			}
		}
		return this.instance!;
	}
}
