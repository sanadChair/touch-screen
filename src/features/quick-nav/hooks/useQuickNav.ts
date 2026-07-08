import { useMemo, useState, useEffect } from "preact/hooks";
import { useRooms } from "../../map/hooks/useRooms";
import type { QuickNavDestination } from "../types";
import { useMapData } from "../../map/hooks/useMapData";
import { QuickNavServiceFactory } from "../services/QuickNavServiceFactory";

export function useQuickNav() {
	const service = QuickNavServiceFactory.getService();
	const { rooms } = useRooms();
	const [activeDestinationId, setActiveDestinationId] = useState<string | null>(null);
	const { navigationStatus } = useMapData();

	const destinations = useMemo(
		() =>
			rooms.map((room) => ({
				id: room.id,
				label: room.name,
				point: { x: room.worldX, y: room.worldY, z: 0 },
			})),
		[rooms],
	);

	useEffect(() => {
		if (["canceled", "failed", "succeeded"].includes(navigationStatus)) {
			setActiveDestinationId(null);
		}
	}, [navigationStatus]);

	const navigateTo = (destination: QuickNavDestination) => {
		setActiveDestinationId(destination.id);
		service.navigateTo(destination);
	};

	return { destinations, navigateTo, activeDestinationId };
}
