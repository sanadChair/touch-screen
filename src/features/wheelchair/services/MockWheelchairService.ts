import type { IWheelchairService } from "./IWheelchairService";

export class MockWheelchairService implements IWheelchairService {
	private static instance: MockWheelchairService | null = null;
	private linear = 0.0;
	private angular = 0.0;

	private constructor() {}

	public static getInstance(): MockWheelchairService {
		if (!this.instance) {
			this.instance = new MockWheelchairService();
		}
		return this.instance;
	}

	public async updateVelocity(linear: number, angular: number): Promise<void> {
		this.linear = linear;
		this.angular = angular;
		console.log(`MockWheelchairService: Velocity updated to linear=${linear}, angular=${angular}`);
	}

	public async getVelocity(): Promise<{ linear: number; angular: number }> {
		return {
			linear: this.linear,
			angular: this.angular,
		};
	}
}
