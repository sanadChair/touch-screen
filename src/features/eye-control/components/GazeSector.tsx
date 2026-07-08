import * as Icons from "lucide-preact";
import type { WheelNode } from "../types";
import { cn } from "../../../shared/lib/utils";
import { useTheme } from "../../../shared/hooks/useTheme";

interface GazeSectorProps {
	node: WheelNode;
	index: number;
	total: number;
	cx: number;
	cy: number;
	innerR: number;
	outerR: number;
	isHovered: boolean;
	isTriggered: boolean;
	progress: number;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
}

const getCoords = (cx: number, cy: number, r: number, angleRad: number) => {
	return {
		x: cx + r * Math.cos(angleRad),
		y: cy + r * Math.sin(angleRad),
	};
};

const describeSectorPath = (
	cx: number,
	cy: number,
	innerR: number,
	outerR: number,
	startAngle: number,
	endAngle: number
): string => {
	const startOuter = getCoords(cx, cy, outerR, startAngle);
	const endOuter = getCoords(cx, cy, outerR, endAngle);
	const startInner = getCoords(cx, cy, innerR, startAngle);
	const endInner = getCoords(cx, cy, innerR, endAngle);

	const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;

	return [
		`M ${startInner.x} ${startInner.y}`,
		`L ${startOuter.x} ${startOuter.y}`,
		`A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`,
		`L ${endInner.x} ${endInner.y}`,
		`A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
		"Z",
	].join(" ");
};

const describeProgressArcPath = (
	cx: number,
	cy: number,
	r: number,
	startAngle: number,
	endAngle: number,
	progress: number
): string => {
	if (progress <= 0) return "";
	const currentAngle = startAngle + (endAngle - startAngle) * progress;
	const start = getCoords(cx, cy, r, startAngle);
	const end = getCoords(cx, cy, r, currentAngle);
	const largeArcFlag = currentAngle - startAngle <= Math.PI ? 0 : 1;
	return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

export const GazeSector = ({
	node,
	index,
	total,
	cx,
	cy,
	innerR,
	outerR,
	isHovered,
	isTriggered,
	progress = 0,
	onMouseEnter,
	onMouseLeave,
}: GazeSectorProps) => {
	const { resolvedTheme } = useTheme();

	// Offset angles so the top sector (index 0) starts centered at -90 degrees (-pi/2)
	const angleSize = (2 * Math.PI) / total;
	const startAngle = -Math.PI / 2 + index * angleSize;
	const endAngle = startAngle + angleSize;

	// Compute position for icon + text labels (middle angle, middle radius)
	const midAngle = startAngle + angleSize / 2;
	const labelRadius = (innerR + outerR) / 2;
	const labelCoords = getCoords(cx, cy, labelRadius, midAngle);

	// Get corresponding lucide-preact icon component
	const IconComponent = (Icons as any)[node.iconName] || Icons.HelpCircle;

	const sectorPath = describeSectorPath(cx, cy, innerR, outerR, startAngle, endAngle);
	// Place the progress line right on the outer rim of the sector
	const progressArcPath = describeProgressArcPath(cx, cy, outerR - 4, startAngle, endAngle, progress);

	// Determine theme colors based on state and active theme mode
	let bgFill = resolvedTheme === "light" ? "rgba(255, 255, 255, 0.85)" : "rgba(30, 41, 59, 0.7)";
	let strokeColor = resolvedTheme === "light" ? "rgba(203, 213, 225, 0.7)" : "rgba(51, 65, 85, 0.5)";
	let textClass = resolvedTheme === "light" ? "text-gray-700 font-bold" : "text-gray-300";

	if (isTriggered) {
		bgFill = "rgba(16, 185, 129, 0.85)"; // emerald-500/85
		strokeColor = "rgba(52, 211, 153, 1)"; // emerald-400
		textClass = "text-white font-extrabold";
	} else if (isHovered) {
		bgFill = resolvedTheme === "light" ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.35)"; // indigo overlay
		strokeColor = resolvedTheme === "light" ? "rgba(99, 102, 241, 0.7)" : "rgba(129, 140, 248, 0.8)";
		textClass = resolvedTheme === "light" ? "text-indigo-600 font-extrabold" : "text-white font-bold";
	}

	return (
		<g
			className="group cursor-pointer select-none"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			onTouchStart={(e) => {
				e.preventDefault();
				onMouseEnter();
			}}
			onTouchEnd={(e) => {
				e.preventDefault();
				onMouseLeave();
			}}
		>
			{/* Sector base geometry */}
			<path
				d={sectorPath}
				fill={bgFill}
				stroke={strokeColor}
				strokeWidth={1.5}
				className="transition-colors duration-300 backdrop-blur-md"
				style={{ filter: isHovered ? "drop-shadow(0 0 8px rgba(99, 102, 241, 0.3))" : "" }}
			/>

			{/* Progress indicator arc */}
			{progress > 0 && (
				<path
					d={progressArcPath}
					fill="none"
					stroke="rgb(99, 102, 241)"
					strokeWidth={5}
					strokeLinecap="round"
					className="pointer-events-none"
				/>
			)}

			{/* Center text / label ForeignObject */}
			<foreignObject
				x={labelCoords.x - 45}
				y={labelCoords.y - 30}
				width={90}
				height={60}
				className="pointer-events-none"
			>
				<div className={cn("w-full h-full flex flex-col items-center justify-center text-center p-0.5", textClass)}>
					<IconComponent size={20} className="mb-1 transition-transform duration-300 group-hover:scale-110" />
					<span className="text-[10px] sm:text-[11px] font-bold tracking-wide leading-tight truncate w-full">
						{node.label}
					</span>
				</div>
			</foreignObject>
		</g>
	);
};
