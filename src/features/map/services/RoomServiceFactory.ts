import type { IRoomService } from "./IRoomService";
import { NativeRoomService } from "./NativeRoomService";
import { ServerRoomService } from "./ServerRoomService";
import { MockRoomService } from "./MockRoomService";
import { getServerHealth, setServerHealth } from "../../../shared/hooks/useServerHealth";
import type { DefinedRoom } from "../types";
import { getConnectionType } from "../../../shared/lib/config";

class FallbackRoomService implements IRoomService {
	private serverService = ServerRoomService.getInstance();
	private mockService = MockRoomService.getInstance();
	private nativeService = NativeRoomService.getInstance();

	private get activeService(): IRoomService {
		const type = getConnectionType();
		if (type === "MOCK" || getServerHealth() === "offline") {
			return this.mockService;
		}
		if (type === "SERVER") {
			return this.serverService;
		}
		return this.nativeService;
	}

	public getRoomsSnapshot(): DefinedRoom[] {
		return this.activeService.getRoomsSnapshot();
	}

	public subscribe(listener: (rooms: DefinedRoom[]) => void): () => void {
		let currentService = this.activeService;
		listener(currentService.getRoomsSnapshot());

		const unsubServer = this.serverService.subscribe((rooms) => {
			if (this.activeService === this.serverService) listener(rooms);
		});
		const unsubMock = this.mockService.subscribe((rooms) => {
			if (this.activeService === this.mockService) listener(rooms);
		});
		const unsubNative = this.nativeService.subscribe((rooms) => {
			if (this.activeService === this.nativeService) listener(rooms);
		});

		// Check for active service change and emit immediately
		const interval = setInterval(() => {
			if (this.activeService !== currentService) {
				currentService = this.activeService;
				listener(currentService.getRoomsSnapshot());
			}
		}, 500);

		return () => {
			unsubServer();
			unsubMock();
			unsubNative();
			clearInterval(interval);
		};
	}

	public async refreshRooms(force?: boolean): Promise<DefinedRoom[]> {
		try {
			// If we are in SERVER mode, add a timeout for server connection
			if (getConnectionType() === "SERVER" && getServerHealth() === "connected") {
				const res = await Promise.race([
					this.activeService.refreshRooms(force),
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error("Timeout connecting to server")), 3000)
					),
				]);
				return res;
			}
			return await this.activeService.refreshRooms(force);
		} catch (error) {
			console.warn("Server connection failed in refreshRooms, falling back to mock", error);
			setServerHealth("offline");
			return this.mockService.getRoomsSnapshot();
		}
	}

	public async addRoom(room: DefinedRoom): Promise<void> {
		try {
			await this.activeService.addRoom(room);
		} catch (error) {
			console.error("addRoom failed, checking health", error);
			if (this.activeService === this.serverService) {
				setServerHealth("offline");
				await this.mockService.addRoom(room);
			} else {
				throw error;
			}
		}
	}

	public async deleteRoom(id: string): Promise<void> {
		try {
			await this.activeService.deleteRoom(id);
		} catch (error) {
			console.error("deleteRoom failed, checking health", error);
			if (this.activeService === this.serverService) {
				setServerHealth("offline");
				await this.mockService.deleteRoom(id);
			} else {
				throw error;
			}
		}
	}

	public async navigateToRoom(id: string): Promise<void> {
		try {
			await this.activeService.navigateToRoom(id);
		} catch (error) {
			console.error("navigateToRoom failed, checking health", error);
			if (this.activeService === this.serverService) {
				setServerHealth("offline");
				await this.mockService.navigateToRoom(id);
			} else {
				throw error;
			}
		}
	}
}

export class RoomServiceFactory {
	private static instance: IRoomService | null = null;

	static getService(): IRoomService {
		if (!this.instance) {
			this.instance = new FallbackRoomService();
		}
		return this.instance;
	}
}
