import type { IWheelchairService } from "./IWheelchairService";

export class ServerWheelchairService implements IWheelchairService {
	private static instance: ServerWheelchairService | null = null;
	private serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5051/api/v1";

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
		if (!response.ok || !result.success) {
			throw new Error(result.error?.message || "Failed to get velocity");
		}
		return {
			linear: result.data.linear ?? 0,
			angular: result.data.angular ?? 0,
		};
	}
}
