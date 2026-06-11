import type { IWheelchairService } from "./IWheelchairService";
import { NativeWheelchairService } from "./NativeWheelchairService";
import { ServerWheelchairService } from "./ServerWheelchairService";
import { MockWheelchairService } from "./MockWheelchairService";
import { getServerHealth, setServerHealth } from "../../../shared/hooks/useServerHealth";
import { getConnectionType } from "../../../shared/lib/config";

class FallbackWheelchairService implements IWheelchairService {
	private serverService = ServerWheelchairService.getInstance();
	private mockService = MockWheelchairService.getInstance();
	private nativeService = NativeWheelchairService.getInstance();

	private get activeService(): IWheelchairService {
		const type = getConnectionType();
		if (type === "MOCK" || getServerHealth() === "offline") {
			return this.mockService;
		}
		if (type === "SERVER") {
			return this.serverService;
		}
		return this.nativeService;
	}

	public async updateVelocity(linear: number, angular: number): Promise<void> {
		try {
			await this.activeService.updateVelocity(linear, angular);
		} catch (error) {
			console.error("Wheelchair updateVelocity failed, checking health", error);
			if (this.activeService === this.serverService) {
				setServerHealth("offline");
				await this.mockService.updateVelocity(linear, angular);
			} else {
				throw error;
			}
		}
	}

	public async getVelocity(): Promise<{ linear: number; angular: number }> {
		try {
			return await this.activeService.getVelocity();
		} catch (error) {
			console.error("Wheelchair getVelocity failed, checking health", error);
			if (this.activeService === this.serverService) {
				setServerHealth("offline");
				return await this.mockService.getVelocity();
			} else {
				throw error;
			}
		}
	}
}

export class WheelchairServiceFactory {
	private static instance: IWheelchairService | null = null;

	static getService(): IWheelchairService {
		if (!this.instance) {
			this.instance = new FallbackWheelchairService();
		}
		return this.instance;
	}
}
