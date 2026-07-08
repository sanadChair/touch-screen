import { useGazeDwell } from "../hooks/useGazeDwell";
import { GazeSector } from "./GazeSector";
import type { WheelNode } from "../types";
import { ArrowLeft } from "lucide-preact";
import { useMemo } from "preact/hooks";
import { useTheme } from "../../../shared/hooks/useTheme";

interface GazeWheelProps {
	nodes: WheelNode[];
	dwellTimeMs?: number;
	onAction: (node: WheelNode) => void;
	onBack?: () => void;
	centerLabel?: string;
	size?: number; // diameter, default 360
}

export const GazeWheel = ({
	nodes,
	dwellTimeMs = 3000,
	onAction,
	onBack,
	centerLabel = "MENU",
	size = 380,
}: GazeWheelProps) => {
	const { resolvedTheme } = useTheme();
	const cx = size / 2;
	const cy = size / 2;
	const outerR = size / 2 - 5; // 185px
	const innerR = size / 2 - 100; // 85px
	const centerCircleR = innerR - 6; // 79px

	// Inject 'back' node into the nodes list so that useGazeDwell can track it as well
	const allDwellableNodes = useMemo(() => {
		if (onBack) {
			return [...nodes, { id: "back", label: "Back", iconName: "ArrowLeft", color: "gray" }];
		}
		return nodes;
	}, [nodes, onBack]);

	const handleTrigger = (node: WheelNode) => {
		if (node.id === "back") {
			onBack?.();
		} else {
			onAction(node);
		}
	};

	const {
		hoveredSectorId,
		dwellProgress,
		triggeredSectorId,
		startHovering,
		stopHovering,
	} = useGazeDwell({
		nodes: allDwellableNodes,
		dwellTimeMs,
		onTrigger: handleTrigger,
	});

	// Check status for Back button in the center
	const isBackHovered = hoveredSectorId === "back";
	const isBackTriggered = triggeredSectorId === "back";
	const backProgress = dwellProgress["back"] ?? 0;

	// Back circle stroke dash calculations for progress ring
	const circumference = 2 * Math.PI * centerCircleR;
	const strokeDasharray = `${backProgress * circumference} ${circumference}`;

	return (
		<div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				className="w-full h-full drop-shadow-2xl"
			>
				{/* Draw outer sectors */}
				{nodes.map((node, index) => (
					<GazeSector
						key={node.id}
						node={node}
						index={index}
						total={nodes.length}
						cx={cx}
						cy={cy}
						innerR={innerR}
						outerR={outerR}
						isHovered={hoveredSectorId === node.id}
						isTriggered={triggeredSectorId === node.id}
						progress={dwellProgress[node.id] ?? 0}
						onMouseEnter={() => startHovering(node.id)}
						onMouseLeave={stopHovering}
					/>
				))}

				{/* Center donut hole circle */}
				<g
					onMouseEnter={() => onBack && startHovering("back")}
					onMouseLeave={() => onBack && stopHovering()}
					onTouchStart={(e) => {
						if (onBack) {
							e.preventDefault();
							startHovering("back");
						}
					}}
					onTouchEnd={(e) => {
						if (onBack) {
							e.preventDefault();
							stopHovering();
						}
					}}
					className={onBack ? "cursor-pointer" : "pointer-events-none"}
				>
					{/* Outer border / glow */}
					<circle
						cx={cx}
						cy={cy}
						r={centerCircleR}
						className={`transition-all duration-300 ${
							resolvedTheme === "light"
								? onBack
									? "fill-white hover:fill-gray-100"
									: "fill-white"
								: onBack
									? "fill-slate-900/90 dark:fill-slate-950/90 hover:fill-slate-900 dark:hover:fill-black"
									: "fill-slate-900/95 dark:fill-slate-950/95"
						}`}
						stroke={
							isBackTriggered
								? "#10b981"
								: isBackHovered
									? "#818cf8"
									: resolvedTheme === "light"
										? "rgba(203, 213, 225, 0.9)"
										: "rgba(71, 85, 105, 0.4)"
						}
						strokeWidth={2}
					/>

					{/* Dwell Progress Ring for Center Back action */}
					{onBack && backProgress > 0 && (
						<circle
							cx={cx}
							cy={cy}
							r={centerCircleR}
							fill="none"
							stroke="rgb(99, 102, 241)"
							strokeWidth={4}
							strokeDasharray={strokeDasharray}
							transform={`rotate(-90 ${cx} ${cy})`}
							strokeLinecap="round"
							className="pointer-events-none"
						/>
					)}

					{/* Center Text Labels */}
					<foreignObject
						x={cx - centerCircleR}
						y={cy - centerCircleR}
						width={centerCircleR * 2}
						height={centerCircleR * 2}
						className="pointer-events-none"
					>
						<div className={`w-full h-full flex flex-col items-center justify-center text-center p-3 ${
							resolvedTheme === "light" ? "text-gray-800" : "text-white"
						}`}>
							{onBack ? (
								<div className="flex flex-col items-center justify-center gap-1">
									<ArrowLeft
										size={24}
										className={`transition-all duration-300 ${
											isBackTriggered
												? "text-emerald-500"
												: isBackHovered
													? "text-indigo-600 scale-110 -translate-x-1"
													: "text-gray-400"
										}`}
									/>
									<span className={`text-[11px] font-extrabold tracking-widest uppercase ${
										resolvedTheme === "light" ? "text-gray-500" : "text-gray-300"
									}`}>
										{isBackHovered ? `Back (${Math.round((1 - backProgress) * (dwellTimeMs / 1000))}s)` : "Gaze to Back"}
									</span>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center">
									<span className={`text-[10px] font-extrabold tracking-widest uppercase mb-0.5 ${
										resolvedTheme === "light" ? "text-gray-400" : "text-slate-500"
									}`}>
										CONTROL
									</span>
									<span className={`text-sm font-extrabold tracking-wider truncate max-w-[120px] uppercase ${
										resolvedTheme === "light" ? "text-indigo-600" : "text-indigo-400"
									}`}>
										{centerLabel}
									</span>
								</div>
							)}
						</div>
					</foreignObject>
				</g>
			</svg>
		</div>
	);
};
