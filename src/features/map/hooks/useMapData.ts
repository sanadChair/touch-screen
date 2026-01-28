import { useState, useEffect } from "preact/hooks";
import type { IMapService } from "../services/IMapService";
import { MockMapService } from "../services/MockMapService";
import type { MapDataState } from "../types";

const mapService: IMapService = new MockMapService();

export const useMapData = () => {
	const [state, setState] = useState<MapDataState>({
		map: null,
		isLoading: true,
		error: null,
	});

	useEffect(() => {
		let isMounted = true;

		const loadMap = async () => {
			try {
				const data = await mapService.fetchMap();
				if (isMounted) {
					setState({ map: data, isLoading: false, error: null });
				}
			} catch (err) {
				if (isMounted) {
					console.error(err);
					setState({
						map: null,
						isLoading: false,
						error: "Failed to load map data",
					});
				}
			}
		};

		loadMap();

		return () => {
			isMounted = false;
		};
	}, []);

	return state;
};
