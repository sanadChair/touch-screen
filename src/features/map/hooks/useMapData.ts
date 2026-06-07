import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { IMapService } from "../services/IMapService";
import { MapServiceFactory } from "../services/MapServiceFactory";
import type { GoalPoint, MapDataState } from "../types";
import { getRosConnectionHint, getRosUrl } from "../../../shared/lib/rosUrl";

const mapService: IMapService = MapServiceFactory.getService();
const STABILITY_TIMEOUT_MS = 3000;

const sampleChecksum = (data: number[]): number => {
	let hash = 0;
	const step = Math.max(1, Math.floor(data.length / 200));
	for (let i = 0; i < data.length; i += step) hash = (hash * 31 + data[i]) | 0;
	return hash;
};

export const useMapData = () => {
	const [state, setState] = useState<MapDataState>({
		map: null,
		robotPose: null,
		isLoading: true,
		error: null,
		navigationStatus: "idle",
		activeGoal: null,
		lastFeedback: null,
		pathHistory: [],
	});
	const [isMapStable, setIsMapStable] = useState(false);
	const lastChecksumRef = useRef<number | null>(null);
	const stabilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const setGoal = useCallback((x: number, y: number, label?: string) => {
		mapService.setGoal(x, y, label);
	}, []);

	const setExternalNavigationGoal = useCallback((goal: GoalPoint | null) => {
		mapService.setExternalNavigationGoal?.(goal);
	}, []);

	useEffect(() => {
		let isMounted = true;

		mapService.onMapUpdate((mapData) => {
			if (!isMounted) return;
			const checksum = sampleChecksum(mapData.data);
			const hasChanged = lastChecksumRef.current !== checksum;
			lastChecksumRef.current = checksum;

			if (hasChanged) {
				setIsMapStable(false);
				if (stabilityTimerRef.current) clearTimeout(stabilityTimerRef.current);
				stabilityTimerRef.current = setTimeout(() => {
					if (isMounted) setIsMapStable(true);
				}, STABILITY_TIMEOUT_MS);
			}

			setState((prev) => ({ ...prev, map: mapData, isLoading: false, error: null }));
		});

		mapService.onRobotPoseUpdate((pose) => {
			if (!isMounted) return;
			setState((prev) => ({ ...prev, robotPose: pose }));
		});

		mapService.onNavigationStateUpdate((navigationState) => {
			if (!isMounted) return;
			setState((prev) => ({
				...prev,
				navigationStatus: navigationState.status,
				activeGoal: navigationState.activeGoal,
				lastFeedback: navigationState.lastFeedback,
				pathHistory: navigationState.pathHistory,
			}));
		});

		const connectionTimeout = setTimeout(() => {
			setState((prev) => {
				if (!prev.isLoading || !isMounted) return prev;
				return {
					...prev,
					isLoading: false,
					error: `Timed out waiting for ROS data. ${getRosConnectionHint(getRosUrl())}`,
				};
			});
		}, 5000);

		return () => {
			isMounted = false;
			clearTimeout(connectionTimeout);
			if (stabilityTimerRef.current) clearTimeout(stabilityTimerRef.current);
		};
	}, []);

	return { ...state, isMapStable, setGoal, setExternalNavigationGoal };
};
