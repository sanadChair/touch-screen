import type { IQuickNavService } from "./IQuickNavService";
import type { QuickNavDestination } from "../types";
import { RoomService } from "../../map/services/RoomService";

export class NativeQuickNavService implements IQuickNavService {
	getDestinations(): QuickNavDestination[] {
		// This is now handled in the hook via useRooms
		return [];
	}

	navigateTo(destination: QuickNavDestination): void {
		console.log(
			`🚀 Quick Nav → ${destination.label} (Using Room Navigation)`,
		);
		RoomService.getInstance().navigateToRoom(destination.label);
	}
}
