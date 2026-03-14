import { clsx } from "clsx";
import {
	Briefcase,
	BedDouble,
	Dumbbell,
	CookingPot,
	Sofa,
	Navigation,
} from "lucide-preact";
import type { QuickNavDestination } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
	office: Briefcase,
	bedroom: BedDouble,
	gym: Dumbbell,
	kitchen: CookingPot,
	living: Sofa,
};

const COLOR_MAP: Record<
	string,
	{ bg: string; border: string; icon: string; activeBg: string; glow: string }
> = {
	office: {
		bg: "bg-blue-50",
		border: "border-blue-200",
		icon: "text-blue-600",
		activeBg: "bg-blue-600",
		glow: "shadow-blue-200/60",
	},
	bedroom: {
		bg: "bg-violet-50",
		border: "border-violet-200",
		icon: "text-violet-600",
		activeBg: "bg-violet-600",
		glow: "shadow-violet-200/60",
	},
	gym: {
		bg: "bg-orange-50",
		border: "border-orange-200",
		icon: "text-orange-600",
		activeBg: "bg-orange-600",
		glow: "shadow-orange-200/60",
	},
	kitchen: {
		bg: "bg-emerald-50",
		border: "border-emerald-200",
		icon: "text-emerald-600",
		activeBg: "bg-emerald-600",
		glow: "shadow-emerald-200/60",
	},
	living: {
		bg: "bg-rose-50",
		border: "border-rose-200",
		icon: "text-rose-600",
		activeBg: "bg-rose-600",
		glow: "shadow-rose-200/60",
	},
};

interface QuickNavPanelProps {
	activeDestinationId: string | null;
	onNavigate: (destination: QuickNavDestination) => void;
	destinations: QuickNavDestination[];
}

export function QuickNavPanel({
	activeDestinationId,
	onNavigate,
	destinations,
}: QuickNavPanelProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				<Navigation size={20} className="text-gray-400" />
				<h2 className="text-lg font-bold text-gray-700 tracking-tight">
					Quick Navigation
				</h2>
			</div>

			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
				{destinations.map((dest: QuickNavDestination) => {
					const isActive = activeDestinationId === dest.id;
					const Icon = ICON_MAP[dest.id] || Navigation;
					const colors = COLOR_MAP[dest.id] || COLOR_MAP.office;

					return (
						<button
							key={dest.id}
							onClick={() => onNavigate(dest)}
							className={clsx(
								"group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 ease-out cursor-pointer",
								isActive
									? [
											colors.activeBg,
											"border-transparent text-white shadow-lg scale-[0.97]",
											colors.glow,
										]
									: [
											colors.bg,
											colors.border,
											"hover:shadow-lg hover:scale-[1.03]",
											`hover:${colors.glow}`,
										],
							)}
						>
							<div
								className={clsx(
									"w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
									isActive
										? "bg-white/20 backdrop-blur-sm shadow-inner"
										: ["bg-white shadow-sm", colors.icon],
								)}
							>
								<Icon size={24} className={colors.icon} />
							</div>

							<span className="text-sm font-semibold tracking-wide transition-colors duration-300 text-gray-700">
								{dest.label}
							</span>

							{isActive && (
								<div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-md">
									<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
