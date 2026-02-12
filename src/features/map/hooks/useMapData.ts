import { useState, useEffect } from "preact/hooks";
import type { IMapService } from "../services/IMapService";
import { MapServiceFactory } from "../services/MapServiceFactory";
import type { MapDataState } from "../types";

const mapService: IMapService = MapServiceFactory.getService();

export const useMapData = () => {
	const [state, setState] = useState<MapDataState>({
		map: null,
		robotPose: null,
		isLoading: true,
		error: null,
	});
	const setGoal = (x: number, y: number) => {
		mapService.setGoal(x, y);
	};

	useEffect(() => {
		let isMounted = true;

		mapService.onMapUpdate((mapData) => {
			if (isMounted) {
				setState((prev) => ({
					...prev,
					map: mapData,
					isLoading: false,
					error: null,
				}));
			}
		});

		mapService.onRobotPoseUpdate((pose) => {
			if (isMounted) {
				setState((prev) => ({
					...prev,
					robotPose: pose,
				}));
			}
		});

		const connectionTimeout = setTimeout(() => {
			setState((prev) => {
				if (prev.isLoading && isMounted) {
					return {
						...prev,
					};
				}
				return prev;
			});
		}, 5000);

		return () => {
			isMounted = false;
			clearTimeout(connectionTimeout);
		};
	}, []);

	return { ...state, setGoal };
};
