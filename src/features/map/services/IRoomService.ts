import type { DefinedRoom } from "../types";

export interface IRoomService {
	getRoomsSnapshot(): DefinedRoom[];
	subscribe(listener: (rooms: DefinedRoom[]) => void): () => void;
	refreshRooms(force?: boolean): Promise<DefinedRoom[]>;
	addRoom(room: DefinedRoom): Promise<void>;
	deleteRoom(id: string): Promise<void>;
	navigateToRoom(id: string): Promise<void>;
}
