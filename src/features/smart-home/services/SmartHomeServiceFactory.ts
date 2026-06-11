import type { ISmartHomeService } from "./ISmartHomeService";
import { NativeSmartHomeService } from "./NativeSmartHomeService";
import { ServerSmartHomeService } from "./ServerSmartHomeService";
import { MockSmartHomeService } from "./MockSmartHomeService";
import { getServerHealth, setServerHealth } from "../../../shared/hooks/useServerHealth";
import type { RoomAction } from "../../map/types";
import { getConnectionType } from "../../../shared/lib/config";

class FallbackSmartHomeService implements ISmartHomeService {
	private serverService = ServerSmartHomeService.getInstance();
	private mockService = MockSmartHomeService.getInstance();
	private nativeService = NativeSmartHomeService.getInstance();

	private get activeService(): ISmartHomeService {
		const type = getConnectionType();
		if (type === "MOCK" || getServerHealth() === "offline") {
			return this.mockService;
		}
		if (type === "SERVER") {
			return this.serverService;
		}
		return this.nativeService;
	}

	public async executeAction(action: RoomAction, value?: boolean | number): Promise<void> {
		try {
			await this.activeService.executeAction(action, value);
		} catch (error) {
			console.error("Smart home action failed, checking health", error);
			if (this.activeService === this.serverService) {
				setServerHealth("offline");
				await this.mockService.executeAction(action, value);
			} else {
				throw error;
			}
		}
	}
}

export class SmartHomeServiceFactory {
	private static instance: ISmartHomeService | null = null;

	static getService(): ISmartHomeService {
		if (!this.instance) {
			this.instance = new FallbackSmartHomeService();
		}
		return this.instance;
	}
}
