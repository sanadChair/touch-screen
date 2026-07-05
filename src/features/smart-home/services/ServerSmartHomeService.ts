import type { RoomAction } from "../../map/types";
import type { ISmartHomeService } from "./ISmartHomeService";
import { getServerUrl } from "../../../shared/lib/config";

export class ServerSmartHomeService implements ISmartHomeService {
	private static instance: ServerSmartHomeService | null = null;
	private serverUrl = getServerUrl();

	private constructor() {}

	public static getInstance(): ServerSmartHomeService {
		if (!this.instance) {
			this.instance = new ServerSmartHomeService();
		}
		return this.instance;
	}

	public async executeAction(action: RoomAction, value?: boolean | number): Promise<void> {
		let state = 0;
		if (action.type === "toggle") {
			state = value ? 1 : 0;
		} else if (action.type === "slider") {
			state = Number(value);
		} else {
			state = 1; // standard trigger button action maps to state 1
		}

		const response = await fetch(`${this.serverUrl}/smart-home/devices/control`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: action.deviceId,
				state: state,
			}),
		});

		if (!response.ok) {
			const errResult = await response.json().catch(() => ({}));
			throw new Error(errResult.error?.message || `Failed to control device: ${response.statusText}`);
		}
	}

	public async changeDeviceRoom(deviceId: string, roomId: string): Promise<void> {
		const response = await fetch(`${this.serverUrl}/smart-home/devices/${deviceId}/room`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ roomId }),
		});

		if (!response.ok) {
			const errResult = await response.json().catch(() => ({}));
			throw new Error(errResult.error?.message || `Failed to change device room: ${response.statusText}`);
		}
	}
}
