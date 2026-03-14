import type { IQuickNavService } from "./IQuickNavService";
import type { QuickNavDestination } from "../types";
import { MOCK_DESTINATIONS } from "../mocks/mockDestinations";
import { MapServiceFactory } from "../../map/services/MapServiceFactory";

export class NativeQuickNavService implements IQuickNavService {
	getDestinations(): QuickNavDestination[] {
		// TODO: Replace with ROS service call when available
		// For now, return mock destinations as fallback
		return MOCK_DESTINATIONS;
	}

	navigateTo(destination: QuickNavDestination): void {
		console.log(
			`🚀 Quick Nav → ${destination.label} (${destination.point.x}, ${destination.point.y})`,
		);
		MapServiceFactory.getService().setGoal(
			destination.point.x,
			destination.point.y,
		);
	}
}
