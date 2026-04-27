import {
	useRef,
	useEffect,
	useState,
	useCallback,
	useMemo,
} from "preact/hooks";
import type { OccupancyGrid, RobotPose } from "../types";
import { renderMapToCanvas } from "../utils/mapRenderer";
import { usePanZoom } from "../hooks/usePanZoom";
import { cn } from "../../../shared/lib/utils";
import { refineMapHeavy, refineMapLight } from "../utils/mapFilter";
import { ZoomIn, ZoomOut, Maximize, MapPin, SquarePlus, Map, Home, Utensils, BedDouble, Monitor, Coffee, Briefcase, Sofa } from "lucide-preact";
import { useTheme } from "../../../shared/hooks/useTheme";
import { useRooms } from "../hooks/useRooms";
import { RoomModal } from "./RoomModal";
import { RoomActionsOverlay } from "./RoomActionsOverlay";
import type { RoomWithActions } from "../types";


const CUSTOM_CURSOR = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="6" stroke="%233b82f6" stroke-width="2" fill="rgba(59, 130, 246, 0.2)"/><circle cx="16" cy="16" r="1.5" fill="%23ef4444"/><path d="M16 2L16 8M16 30L16 24M2 16L8 16M30 16L24 16" stroke="%233b82f6" stroke-width="2" stroke-linecap="round"/></svg>') 16 16, crosshair`;
const PinIcon = () => (
	<MapPin
		className="w-full h-full text-red-500 drop-shadow-md"
		strokeWidth={2.5}
		style={{ filter: "drop-shadow(0px 2px 4px rgba(239, 68, 68, 0.4))" }}
	/>
);

const ICON_MAP: Record<string, typeof Home> = {
	Sofa,
	Utensils,
	BedDouble,
	Coffee,
	Monitor,
	Briefcase,
	Home,
	MapPin,
};

const RobotIcon = () => (
	<div className="relative w-full h-full flex items-center justify-center">
		{/* Outer sonar pulse */}
		<div className="absolute w-[250%] h-[250%] rounded-full bg-blue-500/20 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
		{/* Inner stable glow */}
		<div className="absolute w-[150%] h-[150%] rounded-full bg-blue-500/30 blur-md" />
		{/* Core chassis */}
		<div className="relative z-10 w-full h-full bg-slate-900 rounded-full border-[2.5px] border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.6)] flex items-center justify-center">
			{/* Directional Chevron */}
			<svg 
				viewBox="0 0 24 24" 
				fill="none" 
				className="w-3/4 h-3/4 text-blue-400 transform -translate-y-[1px]"
				stroke="currentColor" 
				strokeWidth="3.5" 
				strokeLinecap="round" 
				strokeLinejoin="round"
			>
				<path d="M12 2L4.5 20.5L12 17L19.5 20.5L12 2Z" className="fill-blue-500/50" />
			</svg>
			{/* Core Energy Center */}
			<div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" />
		</div>
	</div>
);

interface MapCanvasProps {
	mapData: OccupancyGrid;
	robotPose?: RobotPose | null;
	onGoalClick?: (x: number, y: number, yaw?: number) => void;
	className?: string;
	poseOffset?: { x: number; y: number };
	externalGoal?: { x: number; y: number } | null;
	isMapStable?: boolean;
}

interface GoalPosition {
	xPct: number;
	yPct: number;
	worldX: number;
	worldY: number;
}

export const MapCanvas = ({
	mapData,
	robotPose,
	onGoalClick,
	className,
	poseOffset = { x: 0, y: 0 },
	externalGoal = null,
	isMapStable = false,
}: MapCanvasProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [goal, setGoal] = useState<GoalPosition | null>(null);
	const hasAutoFitted = useRef(false);
	const { resolvedTheme } = useTheme();

	// Room Segmenting State
	const [isAddingRoom, setIsAddingRoom] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [pendingRoom, setPendingRoom] = useState<any>(null);
	const { rooms, saveRoom, getActionsForRoom } = useRooms();
	const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

	
	const [dragStart, setDragStart] = useState<{ pixelX: number; pixelY_ROS: number } | null>(null);
	const [dragCurrent, setDragCurrent] = useState<{ pixelX: number; pixelY_ROS: number } | null>(null);

	const {
		transform,
		setTransform,
		onPanStart,
		onPanMove,
		onPanEnd: originalOnPanEnd,
		onWheel,
		zoomIn,
		zoomOut,
	} = usePanZoom(1);

	// Shared fit-to-screen: calculates the scale so the map fills
	// the container's width or height (whichever is the limiting axis)
	const fitToScreen = useCallback(() => {
		if (!containerRef.current || !mapData || mapData.info.width === 0)
			return;
		const rect = containerRef.current.getBoundingClientRect();
		const scaleX = rect.width / mapData.info.width;
		const scaleY = rect.height / mapData.info.height;
		const optimalScale = Math.min(scaleX, scaleY);
		setTransform({ x: 0, y: 0, scale: optimalScale });
		setSelectedRoomId(null);
	}, [mapData, setTransform]);

	const zoomToRoom = useCallback((room: any) => {
		if (!containerRef.current || !mapData) return;
		
		const rect = containerRef.current.getBoundingClientRect();
		const { width, height } = mapData.info;
		
		// Target room dimensions in pixels
		const roomWidth = room.maxX - room.minX;
		const roomHeight = room.maxY - room.minY;
		
		// Calculate optimal scale to fit the room with padding
		const paddingFactor = 1.5; // 50% padding
		const scaleX = rect.width / (roomWidth * paddingFactor);
		const scaleY = rect.height / (roomHeight * paddingFactor);
		const optimalScale = Math.min(scaleX, scaleY);
		
		// Center of the room in pixel coordinates
		const pixelCenterX = (room.minX + room.maxX) / 2;
		const pixelCenterY = (room.minY + room.maxY) / 2;
		
		// Convert pixel center to world center (relative to map center)
		// Map is centered in its own div (width/height)
		// We need to translate so that the pixel center is at the center of the viewport
		const offsetX = (width / 2 - pixelCenterX) * optimalScale;
		const offsetY = (pixelCenterY - height / 2) * optimalScale; // Canvas is flipped Y, but we are calculating relative translation
		
		setTransform({ 
			x: offsetX, 
			y: offsetY, 
			scale: optimalScale 
		});
		setSelectedRoomId(room.id);
	}, [mapData, setTransform]);


	// Memoize the refined map — heavy for stable, light during SLAM
	const refinedMap = useMemo(() => {
		if (!mapData) return null;
		return isMapStable ? refineMapHeavy(mapData) : refineMapLight(mapData);
	}, [mapData, isMapStable]);

	useEffect(() => {
		if (canvasRef.current && refinedMap) {
			const ctx = canvasRef.current.getContext("2d");
			if (ctx)
				ctx.clearRect(
					0,
					0,
					canvasRef.current.width,
					canvasRef.current.height,
				);
			renderMapToCanvas(canvasRef.current, refinedMap, resolvedTheme);
		}
	}, [refinedMap, resolvedTheme]);

	// Auto fit-to-screen once after the map has rendered and the container has layout
	useEffect(() => {
		if (!mapData || hasAutoFitted.current) return;
		// Wait for next animation frame so the browser has completed layout
		const rafId = requestAnimationFrame(() => {
			if (
				containerRef.current &&
				containerRef.current.getBoundingClientRect().width > 0
			) {
				fitToScreen();
				hasAutoFitted.current = true;
			}
		});
		return () => cancelAnimationFrame(rafId);
	}, [mapData, fitToScreen]);

	// Listen to external goal changes (e.g. from Quick Nav)
	useEffect(() => {
		if (externalGoal && mapData) {
			const { x, y } = externalGoal;
			const { resolution, width, height, origin } = mapData.info;

			// Convert world coordinates back to percentages
			const pixelX = (x - origin.position.x) / resolution;
			const pixelY_ROS = (y - origin.position.y) / resolution;

			const xPct = pixelX / width;
			const yPct = 1 - pixelY_ROS / height;

			setGoal({ xPct, yPct, worldX: x, worldY: y });

			// Check if this matches a saved room to trigger zooming and actions
			const matchingRoom = rooms.find(r => 
				Math.abs(r.worldX - x) < 0.01 && 
				Math.abs(r.worldY - y) < 0.01
			);
			if (matchingRoom) {
				zoomToRoom(matchingRoom);
			} else {
				setSelectedRoomId(null);
			}
		} else if (externalGoal === null && !onGoalClick) {

			// Optional: clear goal if external goal is null, but here we just
			// let local interaction override or keep it.
		}
	}, [externalGoal, mapData]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();
			onWheel(e.deltaY);
		};
		container.addEventListener("wheel", handleWheel, { passive: false });
		return () => container.removeEventListener("wheel", handleWheel);
	}, [onWheel]);

	const getGridCoords = (e: MouseEvent | TouchEvent) => {
		if (!canvasRef.current || !mapData) return null;
		const clientX = e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX;
		const clientY = e instanceof MouseEvent ? e.clientY : e.changedTouches[0].clientY;
		
		const rect = canvasRef.current.getBoundingClientRect();
		const xPct = (clientX - rect.left) / rect.width;
		const yPct = (clientY - rect.top) / rect.height;

		if (xPct < 0 || xPct > 1 || yPct < 0 || yPct > 1) return null;

		const pixelX = xPct * mapData.info.width;
		const pixelY_ROS = (1 - yPct) * mapData.info.height;
		
		return { pixelX, pixelY_ROS, xPct, yPct };
	};

	const handleDragStart = (e: MouseEvent | TouchEvent) => {
		if (!isAddingRoom) {
			onPanStart(e);
			return;
		}
		const coords = getGridCoords(e);
		if (coords) {
			setDragStart(coords);
			setDragCurrent(coords);
			setPendingRoom(null);
		}
	};

	const handleDragMove = (e: MouseEvent | TouchEvent) => {
		if (!isAddingRoom) {
			onPanMove(e);
			return;
		}
		if (dragStart) {
			const coords = getGridCoords(e);
			if (coords) {
				setDragCurrent(coords);
			}
		}
	};

	const handleInteractionEnd = (e: MouseEvent | TouchEvent) => {
		if (isAddingRoom) {
			if (dragStart && dragCurrent) {
				const minX = Math.min(dragStart.pixelX, dragCurrent.pixelX);
				const maxX = Math.max(dragStart.pixelX, dragCurrent.pixelX);
				const minY = Math.min(dragStart.pixelY_ROS, dragCurrent.pixelY_ROS);
				const maxY = Math.max(dragStart.pixelY_ROS, dragCurrent.pixelY_ROS);
				
				// Minimum size check (5x5 pixels)
				if (Math.abs(maxX - minX) > 5 && Math.abs(maxY - minY) > 5) {
					const worldX = mapData.info.origin.position.x + ((minX + maxX) / 2) * mapData.info.resolution;
					const worldY = mapData.info.origin.position.y + ((minY + maxY) / 2) * mapData.info.resolution;
					
					setPendingRoom({ minX, maxX, minY, maxY, worldX, worldY });
					setIsModalOpen(true);
				}
			}
			setDragStart(null);
			setDragCurrent(null);
			return;
		}

		// Handle normal map navigation clicks
		const isClick = originalOnPanEnd();
		if (!isClick) return;

		const coords = getGridCoords(e);
		if (!coords) return;

		const worldX = mapData.info.origin.position.x + coords.pixelX * mapData.info.resolution;
		const worldY = mapData.info.origin.position.y + coords.pixelY_ROS * mapData.info.resolution;

		setGoal({ xPct: coords.xPct, yPct: coords.yPct, worldX, worldY });

		if (onGoalClick) {
			onGoalClick(worldX, worldY);
		}
	};

	const stopAllEvents = (e: Event) => {
		e.stopPropagation();
	};

	const getRobotStyle = () => {
		if (!robotPose) return { display: "none" };

		const { resolution, width, height } = mapData.info;
		const originX = mapData.info.origin.position.x;
		const originY = mapData.info.origin.position.y;

		const adjustedX = robotPose.x + poseOffset.x;
		const adjustedY = robotPose.y + poseOffset.y;

		const pixelX = (adjustedX - originX) / resolution;
		const pixelY_ROS = (adjustedY - originY) / resolution;

		const leftPct = (pixelX / width) * 100;
		const topPct = (1 - pixelY_ROS / height) * 100;

		const rotationDeg = -robotPose.rotation * (180 / Math.PI) + 90;

		return {
			left: `${leftPct}%`,
			top: `${topPct}%`,
			transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
			transformOrigin: "center center",
		};
	};

	const selectedRoom = useMemo(() => {
		if (!selectedRoomId) return null;
		const room = rooms.find(r => r.id === selectedRoomId);
		if (!room) return null;
		return {
			...room,
			actions: getActionsForRoom(room.iconName)
		} as RoomWithActions;
	}, [selectedRoomId, rooms, getActionsForRoom]);


	return (
		<>
			<div
				ref={containerRef}
			className={cn(
				"relative w-full h-[600px] bg-slate-200 dark:bg-slate-900 shadow-2xl rounded-xl touch-none isolate overflow-hidden select-none",
				className,
			)}

			style={{ cursor: isAddingRoom ? "crosshair" : CUSTOM_CURSOR }}
			onMouseDown={handleDragStart}
			onMouseMove={handleDragMove}
			onMouseUp={handleInteractionEnd}
			onMouseLeave={() => {
				originalOnPanEnd();
				setDragStart(null);
				setDragCurrent(null);
			}}
			onMouseDownCapture={() => {
				// Prevent room clicks from triggering pan start if needed, 
				// but here we just want to allow normal map interactions.
			}}

			onTouchStart={(e) => {
				e.preventDefault();
				handleDragStart(e);
			}}
			onTouchMove={(e) => {
				e.preventDefault();
				handleDragMove(e);
			}}
			onTouchEnd={handleInteractionEnd}
		>
			<div
				className="absolute inset-0 overflow-hidden rounded-xl bg-white dark:bg-slate-900 transition-colors duration-300"
			>
				<div
					style={{
						transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
						willChange: "transform",
						transformOrigin: "center center",
						transition: "transform 0.1s ease-out",
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div
						className="relative"
						style={{
							width: mapData.info.width,
							height: mapData.info.height,
						}}
					>
						<canvas
							ref={canvasRef}
							className="w-full h-full scale-y-[-1]"
							style={{
								filter: "drop-shadow(0 0 8px rgba(0,0,0,0.1))",
							}}
						/>

						{robotPose && (
							<div
								className="absolute z-50 pointer-events-none transition-transform duration-75"
								style={{
									...getRobotStyle(),
									width: "40px",
									height: "40px",
									scale: `${1 / transform.scale}`,
								}}
							>
								<RobotIcon />
							</div>
						)}

						{goal && (
							<div
								className="absolute z-40 pointer-events-none"
								style={{
									left: `${goal.xPct * 100}%`,
									top: `${goal.yPct * 100}%`,
									width: "32px",
									height: "32px",
									transition: "transform 0.1s ease-out",
									transform: `translate(-50%, -100%) scale(${1 / transform.scale})`,
									transformOrigin: "bottom center",
								}}
							>
								<PinIcon />
							</div>
						)}

						{/* Render Active Drag Highlight */}
						{isAddingRoom && dragStart && dragCurrent && (
							<div
								className="absolute border-2 border-indigo-500 bg-indigo-500/10 pointer-events-none z-50"
								style={{
									left: `${(Math.min(dragStart.pixelX, dragCurrent.pixelX) / mapData.info.width) * 100}%`,
									top: `${(1 - Math.max(dragStart.pixelY_ROS, dragCurrent.pixelY_ROS) / mapData.info.height) * 100}%`,
									width: `${(Math.abs(dragCurrent.pixelX - dragStart.pixelX) / mapData.info.width) * 100}%`,
									height: `${(Math.abs(dragCurrent.pixelY_ROS - dragStart.pixelY_ROS) / mapData.info.height) * 100}%`,
								}}
							/>
						)}

						{/* Render Pending Room Bounds */}
						{pendingRoom && isModalOpen && (
							<div
								className="absolute border-[3px] border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.3)] rounded-lg pointer-events-none z-40 animate-pulse"
								style={{
									left: `${(pendingRoom.minX / mapData.info.width) * 100}%`,
									top: `${(1 - pendingRoom.maxY / mapData.info.height) * 100}%`,
									width: `${((pendingRoom.maxX - pendingRoom.minX) / mapData.info.width) * 100}%`,
									height: `${((pendingRoom.maxY - pendingRoom.minY) / mapData.info.height) * 100}%`,
								}}
							/>
						)}

						{/* Render Saved Rooms Bounds */}
						{rooms.map((room) => {
							const { width, height } = mapData.info;
							const leftPct = (room.minX / width) * 100;
							const topPct = (1 - room.maxY / height) * 100;
							const widthPct = ((room.maxX - room.minX) / width) * 100;
							const heightPct = ((room.maxY - room.minY) / height) * 100;

							const IconComponent = ICON_MAP[room.iconName] || MapPin;
							const isSelected = selectedRoomId === room.id;

							return (
								<div
									key={room.id}
									className={cn(
										"absolute border-2 rounded-lg flex flex-col items-center justify-center transition-all z-30 overflow-hidden pointer-events-none",
										isSelected 
											? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-4 ring-emerald-500/20" 
											: "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
									)}
									style={{
										left: `${leftPct}%`,
										top: `${topPct}%`,
										width: `${widthPct}%`,
										height: `${heightPct}%`,
									}}
								>
									<div 
										onMouseDown={(e) => {
											e.stopPropagation();
											onPanStart(e);
										}}
										onMouseUp={(e) => {
											e.stopPropagation();
											const isClick = originalOnPanEnd();
											if (isClick) zoomToRoom(room);
										}}
										onTouchStart={(e) => {
											e.stopPropagation();
											onPanStart(e);
										}}
										onTouchEnd={(e) => {
											e.stopPropagation();
											const isClick = originalOnPanEnd();
											if (isClick) zoomToRoom(room);
										}}
										style={{ 
											scale: `${1 / Math.max(0.5, transform.scale)}`, 
											transition: 'scale 0.1s ease-out',
											pointerEvents: isAddingRoom ? 'none' : 'auto'
										}}
										className={cn(
											"flex flex-col items-center justify-center text-white px-2 py-1 rounded-lg shadow-lg transition-colors cursor-pointer",
											isSelected ? "bg-emerald-600" : "bg-indigo-600/90 hover:bg-indigo-500"
										)}
									>

										<IconComponent size={14} className="mb-0.5" />
										<span className="text-[10px] font-bold tracking-wider truncate max-w-[80px]" style={{ fontSize: `${Math.max(8, 12 / transform.scale)}px` }}>{room.name}</span>
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

			{/* {robotPose && (
				<div className="absolute top-6 right-6 z-40 bg-blue-600/90 dark:bg-blue-500/80 text-white text-xs px-4 py-3 rounded-xl backdrop-blur-md shadow-lg font-mono pointer-events-none flex flex-col gap-1.5 transition-colors duration-300">
					<span className="font-bold flex items-center gap-2 mb-1">
						<Navigation size={14} className="fill-white" />
						Robot Telemetry
					</span>
					<span>X: {robotPose.x.toFixed(3)} m</span>
					<span>Y: {robotPose.y.toFixed(3)} m</span>
				</div>
			)} */}
			{!selectedRoom && (
				<div
					className="absolute bottom-6 right-6 z-30 flex flex-col gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-2 rounded-[1.25rem] shadow-xl border border-gray-200/50 dark:border-slate-700/50 transition-colors duration-300"
					onMouseDown={stopAllEvents}
					onMouseUp={stopAllEvents}
					onClick={stopAllEvents}
					onTouchStart={stopAllEvents}
					onTouchEnd={stopAllEvents}

				>
					<button
						onClick={(e) => {
							stopAllEvents(e);
							setIsAddingRoom(!isAddingRoom);
						}}
						className={cn(
							"w-12 h-12 flex items-center justify-center rounded-xl transition-colors border shadow-sm focus:outline-none mb-2",
							isAddingRoom 
								? "bg-indigo-500 text-white border-indigo-600 shadow-indigo-500/50 animate-pulse" 
								: "bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 active:bg-gray-100 dark:active:bg-slate-500 border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-200"
						)}
					>
						{isAddingRoom ? <Map size={24} /> : <SquarePlus size={24} />}
					</button>
					<div className="w-8 h-px bg-gray-200 dark:bg-slate-700 mx-auto" />
					<button
						onClick={(e) => {
							stopAllEvents(e);
							zoomIn();
						}}
						className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-xl active:bg-gray-100 dark:active:bg-slate-500 transition-colors border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none"
					>
						<ZoomIn size={24} />
					</button>
					<div className="w-8 h-px bg-gray-200 dark:bg-slate-700 mx-auto" />
					<button
						onClick={(e) => {
							stopAllEvents(e);
							fitToScreen();
						}}
						className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-xl active:bg-gray-100 dark:active:bg-slate-500 transition-colors border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none"
					>
						<Maximize size={22} />
					</button>
					<div className="w-8 h-px bg-gray-200 dark:bg-slate-700 mx-auto" />
					<button
						onClick={(e) => {
							stopAllEvents(e);
							zoomOut();
						}}
						className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-xl active:bg-gray-100 dark:active:bg-slate-500 transition-colors border border-gray-100 dark:border-slate-600 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none"
					>
						<ZoomOut size={24} />
					</button>
				</div>
			)}

			{selectedRoom && (
				<RoomActionsOverlay 
					room={selectedRoom} 
					onClose={() => setSelectedRoomId(null)} 
				/>
			)}
		</div>

		
		<RoomModal
			isOpen={isModalOpen}
			onClose={() => {
				setIsModalOpen(false);
				setPendingRoom(null);
				setIsAddingRoom(false);
			}}
			onSave={(name, icon) => {
				saveRoom({
					id: Date.now().toString(),
					name,
					iconName: icon,
					...pendingRoom
				});
				setIsModalOpen(false);
				setPendingRoom(null);
				setIsAddingRoom(false);
			}}
		/>
		</>
	);
};
