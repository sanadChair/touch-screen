import { useEffect, useState } from "preact/hooks";
import { getRoomActions } from "../lib/roomDevices";
import { RoomServiceFactory } from "../services/RoomServiceFactory";
import type { DefinedRoom, RoomAction } from "../types";

export function useRooms() {
	const roomService = RoomServiceFactory.getService();
	const [rooms, setRooms] = useState<DefinedRoom[]>(
		roomService.getRoomsSnapshot(),
	);
	const [isLoading, setIsLoading] = useState(rooms.length === 0);

	useEffect(() => {
		const unsubscribe = roomService.subscribe((nextRooms) => {
			setRooms(nextRooms);
			setIsLoading(false);
		});

		if (roomService.getRoomsSnapshot().length === 0) {
			roomService
				.refreshRooms()
				.catch((error) => console.error("Failed to fetch rooms from ROS", error))
				.finally(() => setIsLoading(false));
		}

		return unsubscribe;
	}, [roomService]);

	const saveRoom = async (room: DefinedRoom) => {
		setIsLoading(true);
		try {
			await roomService.addRoom(room);
		} finally {
			setIsLoading(false);
		}
	};

	const deleteRoom = async (id: string) => {
		setIsLoading(true);
		try {
			await roomService.deleteRoom(id);
		} finally {
			setIsLoading(false);
		}
	};

	const refreshRooms = async () => {
		setIsLoading(true);
		try {
			await roomService.refreshRooms(true);
		} finally {
			setIsLoading(false);
		}
	};

	const getActionsForRoom = (room: DefinedRoom): RoomAction[] =>
		getRoomActions(room);

	return { rooms, saveRoom, deleteRoom, getActionsForRoom, isLoading, refreshRooms };
}
