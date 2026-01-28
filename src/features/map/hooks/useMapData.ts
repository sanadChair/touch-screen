import { useState, useEffect } from "preact/hooks";
import type { IMapService } from "../services/IMapService";
// import { MockMapService } from "../services/MockMapService";
import { RosMapService } from "../services/RosMapService";
import type { MapDataState } from "../types";

const mapService: IMapService = new RosMapService();

export const useMapData = () => {
	const [state, setState] = useState<MapDataState>({
		map: null,
		robotPose: null,
		isLoading: true,
		error: null,
	});

	useEffect(() => {
		let isMounted = true;

		const init = async () => {
			try {
				const mapData = await mapService.fetchMap();

				if (isMounted) {
					setState((prev) => ({
						...prev,
						map: mapData,
						isLoading: false,
					}));

					mapService.onRobotPoseUpdate((pose) => {
						if (isMounted) {
							setState((prev) => ({
								...prev,
								robotPose: pose,
							}));
						}
					});
				}
			} catch (err) {
				if (isMounted) {
					console.error(err);
					setState((prev) => ({
						...prev,
						isLoading: false,
						error: "Failed to connect to ROS",
					}));
				}
			}
		};

		init();

		return () => {
			isMounted = false;
		};
	}, []);

	return state;
};
