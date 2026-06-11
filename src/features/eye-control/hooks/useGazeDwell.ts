import { useEffect, useRef, useState, useCallback } from "preact/hooks";
import type { WheelNode } from "../types";

interface GazeDwellParams {
	nodes: WheelNode[];
	dwellTimeMs?: number;
	onTrigger: (node: WheelNode) => void;
}

export const useGazeDwell = ({ nodes, dwellTimeMs = 3000, onTrigger }: GazeDwellParams) => {
	const [hoveredSectorId, setHoveredSectorId] = useState<string | null>(null);
	const [dwellProgress, setDwellProgress] = useState<Record<string, number>>({});
	const [triggeredSectorId, setTriggeredSectorId] = useState<string | null>(null);

	const hoveredIdRef = useRef<string | null>(null);
	const progressIntervalRef = useRef<number | null>(null);
	const cooldownRef = useRef<boolean>(false);

	const resetProgress = useCallback((id: string) => {
		setDwellProgress((prev) => ({ ...prev, [id]: 0 }));
	}, []);

	const stopHovering = useCallback(() => {
		if (hoveredIdRef.current) {
			resetProgress(hoveredIdRef.current);
		}
		setHoveredSectorId(null);
		hoveredIdRef.current = null;
		if (progressIntervalRef.current) {
			clearInterval(progressIntervalRef.current);
			progressIntervalRef.current = null;
		}
	}, [resetProgress]);

	const startHovering = useCallback((id: string) => {
		if (cooldownRef.current || triggeredSectorId) return;
		if (hoveredIdRef.current === id) return;

		stopHovering();

		setHoveredSectorId(id);
		hoveredIdRef.current = id;

		const targetNode = nodes.find((n) => n.id === id);
		if (!targetNode) return;

		const startTime = Date.now();
		const intervalMs = 30; // ~33 fps smooth updates

		progressIntervalRef.current = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(1, elapsed / dwellTimeMs);

			setDwellProgress((prev) => ({ ...prev, [id]: progress }));

			if (progress >= 1) {
				if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
				progressIntervalRef.current = null;

				setTriggeredSectorId(id);
				setHoveredSectorId(null);
				hoveredIdRef.current = null;
				cooldownRef.current = true;

				onTrigger(targetNode);

				// Reset triggered and cooldown status after visual flash
				setTimeout(() => {
					setTriggeredSectorId(null);
					setDwellProgress((prev) => ({ ...prev, [id]: 0 }));
					cooldownRef.current = false;
				}, 600);
			}
		}, intervalMs) as unknown as number;
	}, [nodes, dwellTimeMs, onTrigger, stopHovering, triggeredSectorId]);

	useEffect(() => {
		return () => {
			if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
		};
	}, []);

	return {
		hoveredSectorId,
		dwellProgress,
		triggeredSectorId,
		startHovering,
		stopHovering,
	};
};
