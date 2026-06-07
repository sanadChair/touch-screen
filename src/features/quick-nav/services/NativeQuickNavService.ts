import type { IQuickNavService } from "./IQuickNavService";
import type { QuickNavDestination } from "../types";
import { RoomServiceFactory } from "../../map/services/RoomServiceFactory";

export class NativeQuickNavService implements IQuickNavService {
	getDestinations(): QuickNavDestination[] {
		return [];
	}

	navigateTo(destination: QuickNavDestination): void {
		console.log(`Quick Nav -> ${destination.label} (Using Room Navigation)`);
		void RoomServiceFactory.getService().navigateToRoom(destination.id);
	}
}
