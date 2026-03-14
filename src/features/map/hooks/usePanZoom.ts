import { useState, useCallback, useRef } from "preact/hooks";

interface Transform {
	x: number;
	y: number;
	scale: number;
}

const getDistance = (touches: TouchList) => {
	return Math.hypot(
		touches[0].clientX - touches[1].clientX,
		touches[0].clientY - touches[1].clientY,
	);
};

export const usePanZoom = (initialScale = 1) => {
	const [transform, setTransform] = useState<Transform>({
		x: 0,
		y: 0,
		scale: initialScale,
	});

	const isDragging = useRef(false);
	const lastPosition = useRef({ x: 0, y: 0 });
	const lastDistance = useRef<number | null>(null);

	const totalMovement = useRef(0);

	const setScale = useCallback((newScale: number) => {
		setTransform((prev) => ({
			...prev,
			scale: Math.min(Math.max(0.1, newScale), 5),
		}));
	}, []);

	const zoomIn = () => setScale(transform.scale * 1.2);
	const zoomOut = () => setScale(transform.scale / 1.2);
	const reset = () => setTransform({ x: 0, y: 0, scale: initialScale });

	const onPanStart = useCallback((e: MouseEvent | TouchEvent) => {
		totalMovement.current = 0;

		if (
			window.TouchEvent &&
			e instanceof TouchEvent &&
			e.touches.length === 2
		) {
			isDragging.current = false;
			lastDistance.current = getDistance(e.touches);
			return;
		}

		const clientX =
			e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
		const clientY =
			e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

		isDragging.current = true;
		lastPosition.current = { x: clientX, y: clientY };
	}, []);

	const onPanMove = useCallback((e: MouseEvent | TouchEvent) => {
		if (
			window.TouchEvent &&
			e instanceof TouchEvent &&
			e.touches.length === 2 &&
			lastDistance.current
		) {
			const newDistance = getDistance(e.touches);
			const delta = newDistance / lastDistance.current;

			lastDistance.current = newDistance;

			setTransform((prev) => ({
				...prev,
				scale: Math.min(Math.max(0.1, prev.scale * delta), 5),
			}));
			return;
		}

		if (!isDragging.current) return;

		const clientX =
			e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
		const clientY =
			e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;

		const deltaX = clientX - lastPosition.current.x;
		const deltaY = clientY - lastPosition.current.y;

		totalMovement.current += Math.abs(deltaX) + Math.abs(deltaY);

		lastPosition.current = { x: clientX, y: clientY };

		setTransform((prev) => ({
			...prev,
			x: prev.x + deltaX,
			y: prev.y + deltaY,
		}));
	}, []);

	const onPanEnd = useCallback(() => {
		isDragging.current = false;
		lastDistance.current = null;

		const isClick = totalMovement.current < 5;
		return isClick;
	}, []);

	const onWheel = useCallback((deltaY: number) => {
		setTransform((prev) => {
			const scaleAmount = -deltaY * 0.001;
			return {
				...prev,
				scale: Math.min(Math.max(0.1, prev.scale + scaleAmount), 5),
			};
		});
	}, []);

	return {
		transform,
		setTransform,
		onPanStart,
		onPanMove,
		onPanEnd,
		onWheel,
		zoomIn,
		zoomOut,
		reset,
	};
};
