import { useRef, useEffect, useState } from "preact/hooks";
import type { OccupancyGrid, RobotPose } from "../types";
import { renderMapToCanvas } from "../utils/mapRenderer";
import { usePanZoom } from "../hooks/usePanZoom";
import { cn } from "../../../shared/lib/utils";

const ZoomInIcon = () => <span className="text-xl font-bold">+</span>;
const ZoomOutIcon = () => <span className="text-xl font-bold">-</span>;
const ResetIcon = () => <span className="text-xs font-bold">R</span>;

const PinIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="#ef4444"
		className="w-full h-full drop-shadow-md"
		style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.5))" }}
	>
		<path
			fillRule="evenodd"
			d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
			clipRule="evenodd"
		/>
	</svg>
);

const RobotIcon = () => (
	<svg
		viewBox="0 0 24 24"
		fill="#3b82f6"
		className="w-full h-full drop-shadow-md"
		style={{ filter: "drop-shadow(0px 2px 2px rgba(0,0,0,0.5))" }}
	>
		<circle cx="12" cy="12" r="6" fill="white" />
		<path d="M12 2L4.5 20.5L12 17L19.5 20.5L12 2Z" />
	</svg>
);

interface MapCanvasProps {
	mapData: OccupancyGrid;
	robotPose?: RobotPose | null;
	onGoalClick?: (x: number, y: number) => void;
	className?: string;
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
}: MapCanvasProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [goal, setGoal] = useState<GoalPosition | null>(null);

	const {
		transform,
		onPanStart,
		onPanMove,
		onPanEnd: originalOnPanEnd,
		onWheel,
		zoomIn,
		zoomOut,
		reset,
	} = usePanZoom(0.8);

	useEffect(() => {
		if (canvasRef.current && mapData) {
			const ctx = canvasRef.current.getContext("2d");
			if (ctx)
				ctx.clearRect(
					0,
					0,
					canvasRef.current.width,
					canvasRef.current.height,
				);
			renderMapToCanvas(canvasRef.current, mapData);
		}
	}, [mapData]);

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

	const handleInteractionEnd = (e: MouseEvent | TouchEvent) => {
		const isClick = originalOnPanEnd();
		if (!isClick || !canvasRef.current) return;

		const clientX =
			e instanceof MouseEvent ? e.clientX : e.changedTouches[0].clientX;
		const clientY =
			e instanceof MouseEvent ? e.clientY : e.changedTouches[0].clientY;

		const rect = canvasRef.current.getBoundingClientRect();

		const xPct = (clientX - rect.left) / rect.width;
		const yPct = (clientY - rect.top) / rect.height;

		if (xPct < 0 || xPct > 1 || yPct < 0 || yPct > 1) return;

		const pixelX = xPct * mapData.info.width;
		const pixelY_ROS = (1 - yPct) * mapData.info.height;

		const worldX =
			mapData.info.origin.position.x + pixelX * mapData.info.resolution;
		const worldY =
			mapData.info.origin.position.y +
			pixelY_ROS * mapData.info.resolution;

		setGoal({ xPct, yPct, worldX, worldY });

		if (onGoalClick) {
			onGoalClick(worldX, worldY);
		}
	};

	const stopAllEvents = (e: Event) => {
		e.stopPropagation();
	};

	const getRobotStyle = () => {
		if (!robotPose) return { display: "none" };

		const resolution = mapData.info.resolution;
		const originX = mapData.info.origin.position.x;
		const originY = mapData.info.origin.position.y;
		const width = mapData.info.width;
		const height = mapData.info.height;

		const pixelX = (robotPose.x - originX) / resolution;
		const pixelY_ROS = (robotPose.y - originY) / resolution;

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

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative w-full h-[600px] bg-slate-200 shadow-2xl rounded-xl cursor-crosshair touch-none isolate",
				className,
			)}
			onMouseDown={onPanStart}
			onMouseMove={onPanMove}
			onMouseUp={handleInteractionEnd}
			onMouseLeave={originalOnPanEnd}
			onTouchStart={(e) => {
				e.preventDefault();
				onPanStart(e);
			}}
			onTouchMove={(e) => {
				e.preventDefault();
				onPanMove(e);
			}}
			onTouchEnd={handleInteractionEnd}
		>
			<div
				className="absolute inset-0 overflow-hidden rounded-xl"
				style={{
					WebkitMaskImage: "-webkit-radial-gradient(white, black)",
				}}
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
							style={{ imageRendering: "pixelated" }}
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
					</div>
				</div>
			</div>

			<div className="absolute inset-0 border-4 border-slate-800 rounded-xl pointer-events-none z-20" />

			{goal && (
				<div className="absolute top-4 left-4 z-40 bg-black/75 text-white text-xs px-2 py-1 rounded backdrop-blur font-mono pointer-events-none">
					Goal: {goal.worldX.toFixed(2)}, {goal.worldY.toFixed(2)}
				</div>
			)}

			{robotPose && (
				<div className="absolute top-4 right-4 z-40 bg-blue-600/90 text-white text-xs px-2 py-1 rounded backdrop-blur font-mono pointer-events-none flex flex-col gap-1">
					<span>🤖 Robot</span>
					<span>X: {robotPose.x.toFixed(2)}</span>
					<span>Y: {robotPose.y.toFixed(2)}</span>
				</div>
			)}

			<div
				className="absolute bottom-6 right-6 z-30 flex flex-col gap-2 bg-white/90 backdrop-blur p-2 rounded-lg shadow-lg border border-gray-200"
				onMouseDown={stopAllEvents}
				onMouseUp={stopAllEvents}
				onTouchStart={stopAllEvents}
				onTouchEnd={stopAllEvents}
			>
				<button
					onClick={(e) => {
						stopAllEvents(e);
						zoomIn();
					}}
					className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 rounded-md active:bg-gray-100 transition-colors border border-gray-200 text-gray-700 shadow-sm"
				>
					<ZoomInIcon />
				</button>
				<button
					onClick={(e) => {
						stopAllEvents(e);
						reset();
					}}
					className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 rounded-md active:bg-gray-100 transition-colors border border-gray-200 text-gray-700 shadow-sm"
				>
					<ResetIcon />
				</button>
				<button
					onClick={(e) => {
						stopAllEvents(e);
						zoomOut();
					}}
					className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 rounded-md active:bg-gray-100 transition-colors border border-gray-200 text-gray-700 shadow-sm"
				>
					<ZoomOutIcon />
				</button>
			</div>
		</div>
	);
};
