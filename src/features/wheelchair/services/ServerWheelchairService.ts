import type { IWheelchairService } from "./IWheelchairService";
import { getServerUrl } from "../../../shared/lib/config";

export class ServerWheelchairService implements IWheelchairService {
	private static instance: ServerWheelchairService | null = null;
	private serverUrl = getServerUrl();

	private constructor() {}

	public static getInstance(): ServerWheelchairService {
		if (!this.instance) {
			this.instance = new ServerWheelchairService();
		}
		return this.instance;
	}

	public async updateVelocity(linear: number, angular: number): Promise<void> {
		const response = await fetch(`${this.serverUrl}/wheelchair/velocity`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ linear, angular }),
		});

		if (!response.ok) {
			const errResult = await response.json().catch(() => ({}));
			throw new Error(errResult.error?.message || `Failed to update velocity: ${response.statusText}`);
		}
	}

	public async getVelocity(): Promise<{ linear: number; angular: number }> {
		const response = await fetch(`${this.serverUrl}/wheelchair/velocity`);
		const result = await response.json();
		const isSuccess = result.status === "success" || result.success === true;
		if (!response.ok || !isSuccess) {
			throw new Error(result.error?.message || "Failed to get velocity");
		}
		const velData = Array.isArray(result.data) ? result.data[0]?.velocity : result.data?.velocity;
		return {
			linear: velData?.linear ?? 0,
			angular: velData?.angular ?? 0,
		};
	}
}
