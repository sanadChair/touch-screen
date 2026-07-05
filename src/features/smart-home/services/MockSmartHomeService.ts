import type { ISmartHomeService } from "./ISmartHomeService";
import type { RoomAction } from "../../map/types";
import { MockRoomService } from "../../map/services/MockRoomService";

export class MockSmartHomeService implements ISmartHomeService {
	private static instance: MockSmartHomeService | null = null;

	private constructor() {}

	public static getInstance(): MockSmartHomeService {
		if (!this.instance) {
			this.instance = new MockSmartHomeService();
		}
		return this.instance;
	}

	public async executeAction(action: RoomAction, value?: boolean | number): Promise<void> {
		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, 200));
		console.log(`MockSmartHomeService: Executing ${action.command} on device ${action.deviceId} with value ${value}`);
		
		// Update state in MockRoomService
		MockRoomService.getInstance().updateDeviceState(action.deviceId, action.command, value);
	}

	public async changeDeviceRoom(deviceId: string, roomId: string): Promise<void> {
		await new Promise((resolve) => setTimeout(resolve, 200));
		MockRoomService.getInstance().moveDeviceToRoom(deviceId, roomId);
	}
}
