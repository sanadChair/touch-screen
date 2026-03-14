import { useState } from "preact/hooks";
import { QuickNavServiceFactory } from "../services/QuickNavServiceFactory";
import type { QuickNavDestination } from "../types";

export function useQuickNav() {
	const service = QuickNavServiceFactory.getService();
	const destinations = service.getDestinations();
	const [activeDestinationId, setActiveDestinationId] = useState<
		string | null
	>(null);

	const navigateTo = (destination: QuickNavDestination) => {
		setActiveDestinationId(destination.id);
		service.navigateTo(destination);
	};

	return { destinations, navigateTo, activeDestinationId };
}
