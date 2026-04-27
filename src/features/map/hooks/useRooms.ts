import { useState, useEffect } from "preact/hooks";
import type { RoomAction } from "../types";
import { RoomService } from "../services/RoomService";

export interface DefinedRoom {
	id: string;
	name: string;
	iconName: string;
	// Store bounded pixel region so MapCanvas can draw the highlight mask
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	// Optionally the full mask could be stored, but Uint8Arrays are too heavy for simple localStorage. 
	// We'll just draw a tinted box for the zone bounding box for performance.
	worldX: number; // For navigation goals
	worldY: number;
}

const MOCK_ACTIONS_MAP: Record<string, Omit<RoomAction, "id" | "value">[]> = {
	Sofa: [
		{ label: "Main Lights", iconName: "Lightbulb", type: "toggle" },
		{ label: "AC", iconName: "Thermometer", type: "slider" },
		{ label: "TV", iconName: "Monitor", type: "toggle" },
	],
	Utensils: [
		{ label: "Ceiling Light", iconName: "Lightbulb", type: "toggle" },
		{ label: "Kettle", iconName: "Coffee", type: "button" },
	],
	BedDouble: [
		{ label: "Night Light", iconName: "Lightbulb", type: "toggle" },
		{ label: "Blinds", iconName: "Briefcase", type: "slider" },
	],
	Home: [
		{ label: "Security System", iconName: "ShieldCheck", type: "toggle" },
		{ label: "Main Gate", iconName: "Lock", type: "button" },
	],
};

const DEFAULT_ACTIONS: Omit<RoomAction, "id" | "value">[] = [
	{ label: "Lights", iconName: "Lightbulb", type: "toggle" },
];

export function useRooms() {
	const [rooms, setRoomsState] = useState<DefinedRoom[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const roomService = RoomService.getInstance();

	// Initial load
	useEffect(() => {
		const fetchRooms = async () => {
			setIsLoading(true);
			try {
				const fetchedRooms = await roomService.getAllRooms();
				setRoomsState(fetchedRooms);
			} catch (e) {
				console.error("Failed to fetch rooms from ROS", e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchRooms();
	}, []);

	const saveRoom = async (room: DefinedRoom) => {
		try {
			await roomService.addRoom(room);
			setRoomsState((prev) => [...prev, room]);
		} catch (e) {
			console.error("Failed to save room to ROS", e);
		}
	};

	const deleteRoom = async (id: string) => {
		try {
			await roomService.deleteRoom(id);
			setRoomsState((prev) => prev.filter((r) => r.id !== id));
		} catch (e) {
			console.error("Failed to delete room from ROS", e);
		}
	};

	const getActionsForRoom = (iconName: string): RoomAction[] => {
		const baseActions = MOCK_ACTIONS_MAP[iconName] || DEFAULT_ACTIONS;
		return baseActions.map((action, idx) => ({
			...action,
			id: `${iconName}-action-${idx}`,
			value: action.type === "toggle" ? false : action.type === "slider" ? 22 : undefined,
		}));
	};

	return { rooms, saveRoom, deleteRoom, getActionsForRoom, isLoading };
}

