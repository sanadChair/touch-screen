import { useMemo, useState } from "preact/hooks";
import { useRooms } from "../../map/hooks/useRooms";
import { QuickNavServiceFactory } from "../services/QuickNavServiceFactory";
import type { QuickNavDestination } from "../types";

export function useQuickNav() {
	const service = QuickNavServiceFactory.getService();
	const { rooms } = useRooms();
	const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);

	const destinations = useMemo(
		() =>
			rooms.map((room) => ({
				id: room.id,
				label: room.name,
				point: { x: room.worldX, y: room.worldY, z: 0 },
			})),
		[rooms],
	);

	const navigateTo = (destination: QuickNavDestination) => {
		setActiveDestinationId(destination.id);
		service.navigateTo(destination);
	};

	return { destinations, navigateTo, activeDestinationId };
}
