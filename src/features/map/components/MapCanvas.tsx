import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { BedDouble, Briefcase, Home, Map, MapPin, Maximize, Monitor, Sofa, SquarePlus, Utensils, Volume2, ZoomIn, ZoomOut } from "lucide-preact";
import { SmartHomeServiceFactory } from "../../smart-home/services/SmartHomeServiceFactory";
import { useTheme } from "../../../shared/hooks/useTheme";
import { cn } from "../../../shared/lib/utils";
import { usePanZoom } from "../hooks/usePanZoom";
import { useRooms } from "../hooks/useRooms";
import type { GoalPoint, OccupancyGrid, PathPoint, RobotPose, RoomWithActions } from "../types";
import { refineMapHeavy, refineMapLight } from "../utils/mapFilter";
import { renderMapToCanvas } from "../utils/mapRenderer";
import { RoomActionsOverlay } from "./RoomActionsOverlay";
import { RoomModal } from "./RoomModal";
import { segmentRoomFromPoint } from "../utils/segmentation";

const CUSTOM_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="6" stroke="%233b82f6" stroke-width="2" fill="rgba(59, 130, 246, 0.2)"/><circle cx="16" cy="16" r="1.5" fill="%23ef4444"/><path d="M16 2L16 8M16 30L16 24M2 16L8 16M30 16L24 16" stroke="%233b82f6" stroke-width="2" stroke-linecap="round"/></svg>') 16 16, crosshair`;
const ICON_MAP: Record<string, typeof Home> = { Sofa, Utensils, BedDouble, Monitor, Briefcase, Home, MapPin, Volume2 };

const PinIcon = () => <MapPin className="w-full h-full text-red-500 drop-shadow-md" strokeWidth={2.5} style={{ filter: "drop-shadow(0px 2px 4px rgba(239, 68, 68, 0.4))" }} />;

const RobotIcon = () => (
	<div className="relative w-full h-full flex items-center justify-center">
		<div className="absolute w-[250%] h-[250%] rounded-full bg-blue-500/20 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
		<div className="absolute w-[150%] h-[150%] rounded-full bg-blue-500/30 blur-md" />
		<div className="relative z-10 w-full h-full bg-slate-900 rounded-full border-[2.5px] border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center justify-center">
			<svg viewBox="0 0 24 24" fill="none" className="w-3/4 h-3/4 text-blue-400 transform -translate-y-[1px]" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
				<path d="M12 2L4.5 20.5L12 17L19.5 20.5L12 2Z" className="fill-blue-500/50" />
			</svg>
			<div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" />
		</div>
	</div>
);

interface MapCanvasProps {
	mapData: OccupancyGrid;
	robotPose?: RobotPose | null;
	onGoalClick?: (x: number, y: number, label?: string) => void;
	className?: string;
	externalGoal?: GoalPoint | null;
	isMapStable?: boolean;
	pathHistory?: PathPoint[];
}

interface GoalPosition {
	xPct: number;
	yPct: number;
	worldX: number;
	worldY: number;
}

interface RoomPixelBounds {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

export const MapCanvas = ({ mapData, robotPose, onGoalClick, className, externalGoal = null, isMapStable = false, pathHistory = [] }: MapCanvasProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const displayPoseRef = useRef<RobotPose | null>(robotPose ?? null);
	const animationFrameRef = useRef<number | null>(null);
	const [displayPose, setDisplayPose] = useState<RobotPose | null>(robotPose ?? null);
	const [goal, setGoal] = useState<GoalPosition | null>(null);
	const hasAutoFitted = useRef(false);
	const { resolvedTheme } = useTheme();
	const smartHomeService = SmartHomeServiceFactory.getService();
	const [isAddingRoom, setIsAddingRoom] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [pendingRoom, setPendingRoom] = useState<any>(null);
	const { rooms, saveRoom, getActionsForRoom, refreshRooms } = useRooms();
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
	const [dragStart, setDragStart] = useState<{ pixelX: number; pixelY_ROS: number } | null>(null);
	const [dragCurrent, setDragCurrent] = useState<{ pixelX: number; pixelY_ROS: number } | null>(null);
	const { transform, setTransform, onPanStart, onPanMove, onPanEnd: originalOnPanEnd, onWheel, zoomIn, zoomOut } = usePanZoom(1);

	const toPixelBounds = useCallback(
		(room: { minX: number; maxX: number; minY: number; maxY: number }): RoomPixelBounds => ({
			minX: (room.minX - mapData.info.origin.position.x) / mapData.info.resolution,
			maxX: (room.maxX - mapData.info.origin.position.x) / mapData.info.resolution,
			minY: (room.minY - mapData.info.origin.position.y) / mapData.info.resolution,
			maxY: (room.maxY - mapData.info.origin.position.y) / mapData.info.resolution,
		}),
		[
			mapData.info.origin.position.x,
			mapData.info.origin.position.y,
			mapData.info.resolution,
		],
	);

	const fitToScreen = useCallback(() => {
		if (!containerRef.current || mapData.info.width === 0) return;
		const rect = containerRef.current.getBoundingClientRect();
		const optimalScale = Math.min(rect.width / mapData.info.width, rect.height / mapData.info.height);
		setTransform({ x: 0, y: 0, scale: optimalScale });
		setSelectedRoomId(null);
	}, [mapData, setTransform]);

	const zoomToRoom = useCallback((room: any) => {
		if (!containerRef.current) return;
		const rect = containerRef.current.getBoundingClientRect();
		const pixelBounds = toPixelBounds(room);
		const roomWidth = pixelBounds.maxX - pixelBounds.minX;
		const roomHeight = pixelBounds.maxY - pixelBounds.minY;
		const optimalScale = Math.min(rect.width / (roomWidth * 1.5), rect.height / (roomHeight * 1.5));
		const pixelCenterX = (pixelBounds.minX + pixelBounds.maxX) / 2;
		const pixelCenterY = (pixelBounds.minY + pixelBounds.maxY) / 2;
		setTransform({
			x: (mapData.info.width / 2 - pixelCenterX) * optimalScale,
			y: (pixelCenterY - mapData.info.height / 2) * optimalScale,
			scale: optimalScale,
		});
		setSelectedRoomId(room.id);
	}, [mapData, setTransform, toPixelBounds]);

	const refinedMap = useMemo(() => (isMapStable ? refineMapHeavy(mapData) : refineMapLight(mapData)), [isMapStable, mapData]);

	const selectedRoom = useMemo(() => {
		if (!selectedRoomId) return null;
		const room = rooms.find((item) => item.id === selectedRoomId);
		return room ? ({ ...room, actions: getActionsForRoom(room) } as RoomWithActions) : null;
	}, [getActionsForRoom, rooms, selectedRoomId]);

	const trailSegments = useMemo(() => {
		if (pathHistory.length < 2) return [];
		return pathHistory.slice(1).map((point, index) => {
			const previous = pathHistory[index];
			const startX = (previous.x - mapData.info.origin.position.x) / mapData.info.resolution;
			const startY = mapData.info.height - (previous.y - mapData.info.origin.position.y) / mapData.info.resolution;
			const endX = (point.x - mapData.info.origin.position.x) / mapData.info.resolution;
			const endY = mapData.info.height - (point.y - mapData.info.origin.position.y) / mapData.info.resolution;
			return { startX, startY, endX, endY, opacity: (index + 1) / pathHistory.length };
		});
	}, [mapData.info.height, mapData.info.origin.position.x, mapData.info.origin.position.y, mapData.info.resolution, pathHistory]);

	useEffect(() => {
		if (!canvasRef.current) return;
		const ctx = canvasRef.current.getContext("2d");
		if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
		renderMapToCanvas(canvasRef.current, refinedMap, resolvedTheme);
	}, [refinedMap, resolvedTheme]);

	useEffect(() => {
		if (hasAutoFitted.current) return;
		const rafId = requestAnimationFrame(() => {
			if (containerRef.current?.getBoundingClientRect().width) {
				fitToScreen();
				hasAutoFitted.current = true;
			}
		});
		return () => cancelAnimationFrame(rafId);
	}, [fitToScreen]);

	useEffect(() => {
		if (!externalGoal) return;
		const pixelX = (externalGoal.x - mapData.info.origin.position.x) / mapData.info.resolution;
		const pixelY_ROS = (externalGoal.y - mapData.info.origin.position.y) / mapData.info.resolution;
		setGoal({
			xPct: pixelX / mapData.info.width,
			yPct: 1 - pixelY_ROS / mapData.info.height,
			worldX: externalGoal.x,
			worldY: externalGoal.y,
		});
		const matchingRoom = rooms.find((room) => Math.abs(room.worldX - externalGoal.x) < 0.01 && Math.abs(room.worldY - externalGoal.y) < 0.01);
		if (matchingRoom) zoomToRoom(matchingRoom);
	}, [externalGoal, mapData.info.height, mapData.info.origin.position.x, mapData.info.origin.position.y, mapData.info.resolution, mapData.info.width, rooms, zoomToRoom]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			event.stopPropagation();
			onWheel(event.deltaY);
		};
		container.addEventListener("wheel", handleWheel, { passive: false });
		return () => container.removeEventListener("wheel", handleWheel);
	}, [onWheel]);

	useEffect(() => {
		if (!robotPose) return;
		const targetPose = { ...robotPose };
		if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

		const step = () => {
			const currentPose = displayPoseRef.current ?? targetPose;
			const nextPose = {
				x: currentPose.x + (targetPose.x - currentPose.x) * 0.25,
				y: currentPose.y + (targetPose.y - currentPose.y) * 0.25,
				rotation: currentPose.rotation + (targetPose.rotation - currentPose.rotation) * 0.25,
			};
			displayPoseRef.current = nextPose;
			setDisplayPose(nextPose);

			const done = Math.abs(nextPose.x - targetPose.x) < 0.005 && Math.abs(nextPose.y - targetPose.y) < 0.005;
			if (!done) {
				animationFrameRef.current = requestAnimationFrame(step);
			} else {
				displayPoseRef.current = targetPose;
				setDisplayPose(targetPose);
			}
		};

		animationFrameRef.current = requestAnimationFrame(step);
		return () => {
			if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
		};
	}, [robotPose]);

	const getGridCoords = (event: MouseEvent | TouchEvent) => {
		if (!canvasRef.current) return null;
		const clientX = event instanceof MouseEvent ? event.clientX : event.changedTouches[0].clientX;
		const clientY = event instanceof MouseEvent ? event.clientY : event.changedTouches[0].clientY;
		const rect = canvasRef.current.getBoundingClientRect();
		const xPct = (clientX - rect.left) / rect.width;
		const yPct = (clientY - rect.top) / rect.height;
		if (xPct < 0 || xPct > 1 || yPct < 0 || yPct > 1) return null;
		return { pixelX: xPct * mapData.info.width, pixelY_ROS: (1 - yPct) * mapData.info.height, xPct, yPct };
	};

	const handleDragStart = (event: MouseEvent | TouchEvent) => {
		if (!isAddingRoom) return onPanStart(event);
		const coords = getGridCoords(event);
		if (!coords) return;
		setDragStart(coords);
		setDragCurrent(coords);
		setPendingRoom(null);
	};

	const handleDragMove = (event: MouseEvent | TouchEvent) => {
		if (!isAddingRoom) return onPanMove(event);
		if (!dragStart) return;
		const coords = getGridCoords(event);
		if (coords) setDragCurrent(coords);
	};

	const handleInteractionEnd = (event: MouseEvent | TouchEvent) => {
		if (isAddingRoom) {
			if (dragStart && dragCurrent) {
				const minX = Math.min(dragStart.pixelX, dragCurrent.pixelX);
				const maxX = Math.max(dragStart.pixelX, dragCurrent.pixelX);
				const minY = Math.min(dragStart.pixelY_ROS, dragCurrent.pixelY_ROS);
				const maxY = Math.max(dragStart.pixelY_ROS, dragCurrent.pixelY_ROS);
				if (Math.abs(maxX - minX) > 5 && Math.abs(maxY - minY) > 5) {
					// Manual drag addition
					setPendingRoom({
						pixelMinX: minX,
						pixelMaxX: maxX,
						pixelMinY: minY,
						pixelMaxY: maxY,
						minX: mapData.info.origin.position.x + minX * mapData.info.resolution,
						maxX: mapData.info.origin.position.x + maxX * mapData.info.resolution,
						minY: mapData.info.origin.position.y + minY * mapData.info.resolution,
						maxY: mapData.info.origin.position.y + maxY * mapData.info.resolution,
						worldX: mapData.info.origin.position.x + ((minX + maxX) / 2) * mapData.info.resolution,
						worldY: mapData.info.origin.position.y + ((minY + maxY) / 2) * mapData.info.resolution,
						worldTheta: 0,
					});
					setIsModalOpen(true);
				} else {
					// Single click/tap auto-segmentation
					const segResult = segmentRoomFromPoint(
						mapData,
						Math.floor(dragStart.pixelX),
						Math.floor(dragStart.pixelY_ROS)
					);
					if (segResult) {
						const { boundingBox } = segResult;
						setPendingRoom({
							pixelMinX: boundingBox.minX,
							pixelMaxX: boundingBox.maxX,
							pixelMinY: boundingBox.minY,
							pixelMaxY: boundingBox.maxY,
							minX: mapData.info.origin.position.x + boundingBox.minX * mapData.info.resolution,
							maxX: mapData.info.origin.position.x + boundingBox.maxX * mapData.info.resolution,
							minY: mapData.info.origin.position.y + boundingBox.minY * mapData.info.resolution,
							maxY: mapData.info.origin.position.y + boundingBox.maxY * mapData.info.resolution,
							worldX: mapData.info.origin.position.x + ((boundingBox.minX + boundingBox.maxX) / 2) * mapData.info.resolution,
							worldY: mapData.info.origin.position.y + ((boundingBox.minY + boundingBox.maxY) / 2) * mapData.info.resolution,
							worldTheta: 0,
						});
						setIsModalOpen(true);
					}
				}
			}
			setDragStart(null);
			setDragCurrent(null);
			return;
		}

		if (!originalOnPanEnd()) return;
		const coords = getGridCoords(event);
		if (!coords) return;
		const worldX = mapData.info.origin.position.x + coords.pixelX * mapData.info.resolution;
		const worldY = mapData.info.origin.position.y + coords.pixelY_ROS * mapData.info.resolution;
		setGoal({ xPct: coords.xPct, yPct: coords.yPct, worldX, worldY });
		onGoalClick?.(worldX, worldY);
	};

	const stopAllEvents = (event: Event) => event.stopPropagation();

	const getRobotStyle = () => {
		if (!displayPose) return { display: "none" };
		const pixelX = (displayPose.x - mapData.info.origin.position.x) / mapData.info.resolution;
		const pixelY_ROS = (displayPose.y - mapData.info.origin.position.y) / mapData.info.resolution;
		return {
			left: `${(pixelX / mapData.info.width) * 100}%`,
			top: `${(1 - pixelY_ROS / mapData.info.height) * 100}%`,
			transform: `translate(-50%, -50%) rotate(${-displayPose.rotation * (180 / Math.PI) + 90}deg)`,
			transformOrigin: "center center",
		};
	};

	const triggerRoomAction = async (action: any, value: boolean | number) => {
		await smartHomeService.executeAction(action, value);
		await refreshRooms();
	};

	return (
		<>
			<div
				ref={containerRef}
				className={cn("relative w-full h-full min-h-[300px] bg-slate-200 dark:bg-slate-900 shadow-2xl rounded-xl touch-none isolate overflow-hidden select-none", className)}
				style={{ cursor: isAddingRoom ? "crosshair" : CUSTOM_CURSOR }}
				onMouseDown={handleDragStart}
				onMouseMove={handleDragMove}
				onMouseUp={handleInteractionEnd}
				onMouseLeave={() => { originalOnPanEnd(); setDragStart(null); setDragCurrent(null); }}
				onTouchStart={(event) => { event.preventDefault(); handleDragStart(event); }}
				onTouchMove={(event) => { event.preventDefault(); handleDragMove(event); }}
				onTouchEnd={handleInteractionEnd}
			>
				<div className="absolute inset-0 overflow-hidden rounded-xl bg-white dark:bg-slate-900 transition-colors duration-300">
					<div style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, willChange: "transform", transformOrigin: "center center", transition: "transform 0.1s ease-out", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
						<div className="relative" style={{ width: mapData.info.width, height: mapData.info.height }}>
							<canvas ref={canvasRef} className="w-full h-full scale-y-[-1]" style={{ filter: "drop-shadow(0 0 8px rgba(0,0,0,0.1))" }} />
							<svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox={`0 0 ${mapData.info.width} ${mapData.info.height}`} preserveAspectRatio="none">
								{trailSegments.map((segment, index) => (
									<line key={`${segment.endX}-${segment.endY}-${index}`} x1={segment.startX} y1={segment.startY} x2={segment.endX} y2={segment.endY} stroke="rgb(59 130 246)" strokeWidth={4} strokeOpacity={segment.opacity * 0.8} strokeLinecap="round" />
								))}
							</svg>

							{displayPose && (
								<div className="absolute z-50 pointer-events-none transition-transform duration-75" style={{ ...getRobotStyle(), width: "40px", height: "40px", scale: `${1 / transform.scale}` }}>
									<RobotIcon />
								</div>
							)}

							{goal && (
								<div className="absolute z-40 pointer-events-none" style={{ left: `${goal.xPct * 100}%`, top: `${goal.yPct * 100}%`, width: "32px", height: "32px", transition: "transform 0.1s ease-out", transform: `translate(-50%, -100%) scale(${1 / transform.scale})`, transformOrigin: "bottom center" }}>
									<PinIcon />
								</div>
							)}

							{isAddingRoom && dragStart && dragCurrent && (
								<div className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none z-50" style={{ left: `${(Math.min(dragStart.pixelX, dragCurrent.pixelX) / mapData.info.width) * 100}%`, top: `${(1 - Math.max(dragStart.pixelY_ROS, dragCurrent.pixelY_ROS) / mapData.info.height) * 100}%`, width: `${(Math.abs(dragCurrent.pixelX - dragStart.pixelX) / mapData.info.width) * 100}%`, height: `${(Math.abs(dragCurrent.pixelY_ROS - dragStart.pixelY_ROS) / mapData.info.height) * 100}%` }} />
							)}

							{pendingRoom && isModalOpen && (
								<div className="absolute border-[3px] border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.3)] rounded-lg pointer-events-none z-40 animate-pulse" style={{ left: `${(pendingRoom.pixelMinX / mapData.info.width) * 100}%`, top: `${(1 - pendingRoom.pixelMaxY / mapData.info.height) * 100}%`, width: `${((pendingRoom.pixelMaxX - pendingRoom.pixelMinX) / mapData.info.width) * 100}%`, height: `${((pendingRoom.pixelMaxY - pendingRoom.pixelMinY) / mapData.info.height) * 100}%` }} />
							)}

							{rooms.map((room) => {
								const pixelBounds = toPixelBounds(room);
								const leftPct = (pixelBounds.minX / mapData.info.width) * 100;
								const topPct = (1 - pixelBounds.maxY / mapData.info.height) * 100;
								const widthPct = ((pixelBounds.maxX - pixelBounds.minX) / mapData.info.width) * 100;
								const heightPct = ((pixelBounds.maxY - pixelBounds.minY) / mapData.info.height) * 100;
								const IconComponent = ICON_MAP[room.iconName] || MapPin;
								const isSelected = selectedRoomId === room.id;
								return (
									<div key={room.id} className={cn("absolute border-2 rounded-lg flex flex-col items-center justify-center transition-all z-30 overflow-hidden pointer-events-none", isSelected ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-4 ring-emerald-500/20" : "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.1)]")} style={{ left: `${leftPct}%`, top: `${topPct}%`, width: `${widthPct}%`, height: `${heightPct}%` }}>
										<div
											onMouseDown={(event) => { event.stopPropagation(); onPanStart(event); }}
											onMouseUp={(event) => { event.stopPropagation(); if (originalOnPanEnd()) zoomToRoom(room); }}
											onTouchStart={(event) => { event.stopPropagation(); onPanStart(event); }}
											onTouchEnd={(event) => { event.stopPropagation(); if (originalOnPanEnd()) zoomToRoom(room); }}
											style={{ scale: `${1 / Math.max(0.5, transform.scale)}`, transition: "scale 0.1s ease-out", pointerEvents: isAddingRoom ? "none" : "auto" }}
											className={cn("flex flex-col items-center justify-center text-white px-1.5 py-0.5 rounded-md shadow-md transition-colors cursor-pointer", isSelected ? "bg-emerald-600" : "bg-indigo-600/90 hover:bg-indigo-500")}
										>
											<IconComponent size={10} className="mb-0" />
											<span className="text-[8px] font-bold tracking-wider truncate max-w-[60px]" style={{ fontSize: `${Math.max(6.5, 9 / transform.scale)}px` }}>{room.name}</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<div className="absolute inset-0 border-4 border-slate-900/10 dark:border-slate-100/10 rounded-2xl pointer-events-none z-20 transition-colors duration-300" />

				{goal && (
					<div className="absolute top-6 left-6 z-40 bg-slate-900/80 dark:bg-black/60 text-white text-sm font-semibold px-4 py-2 rounded-xl backdrop-blur-md shadow-lg pointer-events-none transition-colors duration-300">
						Target: {goal.worldX.toFixed(2)}, {goal.worldY.toFixed(2)}
					</div>
				)}

				{robotPose && (
					<div className="hidden absolute top-6 right-6 z-40 bg-blue-600/90 dark:bg-blue-500/80 text-white text-xs px-4 py-3 rounded-xl backdrop-blur-md shadow-lg font-mono pointer-events-none flex flex-col gap-1.5 transition-colors duration-300">
						<span className="font-bold">Map Frame Pose</span>
						<span>X: {robotPose.x.toFixed(3)} m</span>
						<span>Y: {robotPose.y.toFixed(3)} m</span>
					</div>
				)}

				{!selectedRoom && (
					<div className="absolute bottom-6 right-6 z-30 flex flex-col gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-[1.25rem] shadow-xl border border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300" onMouseDown={stopAllEvents} onMouseUp={stopAllEvents} onClick={stopAllEvents} onTouchStart={stopAllEvents} onTouchEnd={stopAllEvents}>
						<button onClick={(event) => { stopAllEvents(event); setIsAddingRoom(!isAddingRoom); }} className={cn("w-12 h-12 flex items-center justify-center rounded-xl transition-colors border shadow-sm focus:outline-none mb-2", isAddingRoom ? "bg-indigo-500 text-white border-indigo-600 shadow-indigo-500/50 animate-pulse" : "bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 active:bg-gray-100 dark:active:bg-slate-500 border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-200")}>
							{isAddingRoom ? <Map size={24} /> : <SquarePlus size={24} />}
						</button>
						<div className="w-8 h-px bg-gray-200 dark:bg-slate-700 mx-auto" />
						<button onClick={(event) => { stopAllEvents(event); zoomIn(); }} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-xl active:bg-gray-100 dark:active:bg-slate-500 transition-colors border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none"><ZoomIn size={24} /></button>
						<div className="w-8 h-px bg-gray-200 dark:bg-slate-700 mx-auto" />
						<button onClick={(event) => { stopAllEvents(event); fitToScreen(); }} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-xl active:bg-gray-100 dark:active:bg-slate-500 transition-colors border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none"><Maximize size={22} /></button>
						<div className="w-8 h-px bg-gray-200 dark:bg-slate-700 mx-auto" />
						<button onClick={(event) => { stopAllEvents(event); zoomOut(); }} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-xl active:bg-gray-100 dark:active:bg-slate-500 transition-colors border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none"><ZoomOut size={24} /></button>
					</div>
				)}

				{selectedRoom && <RoomActionsOverlay room={selectedRoom} onClose={() => setSelectedRoomId(null)} onActionTrigger={triggerRoomAction} />}
			</div>

			<RoomModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					setPendingRoom(null);
					setIsAddingRoom(false);
				}}
				onSave={(name, icon) => {
					void saveRoom({
						id: name,
						name,
						iconName: icon,
						minX: pendingRoom.minX,
						maxX: pendingRoom.maxX,
						minY: pendingRoom.minY,
						maxY: pendingRoom.maxY,
						worldX: pendingRoom.worldX,
						worldY: pendingRoom.worldY,
						worldTheta: pendingRoom.worldTheta,
						devices: [],
					});
					setIsModalOpen(false);
					setPendingRoom(null);
					setIsAddingRoom(false);
				}}
			/>
		</>
	);
};
