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
import { useArrowNavigation } from "../../../shared/hooks/useArrowNavigation";

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
		bg: "bg-blue-50 dark:bg-blue-500/10",
		border: "border-blue-200 dark:border-blue-500/20",
		icon: "text-blue-600 dark:text-blue-400",
		activeBg: "bg-blue-600",
		glow: "shadow-blue-200/60 dark:shadow-blue-900/40",
	},
	bedroom: {
		bg: "bg-violet-50 dark:bg-violet-500/10",
		border: "border-violet-200 dark:border-violet-500/20",
		icon: "text-violet-600 dark:text-violet-400",
		activeBg: "bg-violet-600",
		glow: "shadow-violet-200/60 dark:shadow-violet-900/40",
	},
	gym: {
		bg: "bg-orange-50 dark:bg-orange-500/10",
		border: "border-orange-200 dark:border-orange-500/20",
		icon: "text-orange-600 dark:text-orange-400",
		activeBg: "bg-orange-600",
		glow: "shadow-orange-200/60 dark:shadow-orange-900/40",
	},
	kitchen: {
		bg: "bg-emerald-50 dark:bg-emerald-500/10",
		border: "border-emerald-200 dark:border-emerald-500/20",
		icon: "text-emerald-600 dark:text-emerald-400",
		activeBg: "bg-emerald-600",
		glow: "shadow-emerald-200/60 dark:shadow-emerald-900/40",
	},
	living: {
		bg: "bg-rose-50 dark:bg-rose-500/10",
		border: "border-rose-200 dark:border-rose-500/20",
		icon: "text-rose-600 dark:text-rose-400",
		activeBg: "bg-rose-600",
		glow: "shadow-rose-200/60 dark:shadow-rose-900/40",
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
	const { handleKeyDown } = useArrowNavigation();

	return (
		<div className="flex flex-col gap-5" role="region" aria-labelledby="quick-nav-heading">
			<div className="flex items-center gap-3">
				<div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg" aria-hidden="true">
					<Navigation size={20} className="text-gray-500 dark:text-slate-400" />
				</div>
				<h2 id="quick-nav-heading" className="text-xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
					Quick Navigation
				</h2>
			</div>

			<div 
				className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" 
				role="list"
				onKeyDown={handleKeyDown}
			>
				{destinations.map((dest: QuickNavDestination) => {
					const isActive = activeDestinationId === dest.id;
					const Icon = ICON_MAP[dest.id] || Navigation;
					const colors = COLOR_MAP[dest.id] || COLOR_MAP.office;

					return (
						<button
							key={dest.id}
							onClick={() => onNavigate(dest)}
							role="listitem"
							aria-label={`Navigate to ${dest.label}${isActive ? " (Current Destination)" : ""}`}
							aria-pressed={isActive}
							tabIndex={(activeDestinationId ? isActive : destinations.indexOf(dest) === 0) ? 0 : -1}
							className={clsx(
								"group relative flex flex-col items-center gap-4 p-6 rounded-[1.5rem] border-2 transition-all duration-300 ease-out cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30",
								isActive
									? [
											colors.activeBg,
											"border-transparent text-white shadow-xl scale-[0.98]",
											colors.glow,
										]
									: [
											colors.bg,
											colors.border,
											"hover:shadow-lg hover:scale-[1.02]",
											`hover:${colors.glow}`,
										],
							)}
						>
							<div
								className={clsx(
									"w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
									isActive
										? "bg-white/20 backdrop-blur-md shadow-inner"
										: ["bg-white dark:bg-slate-800 shadow-sm", colors.icon],
								)}
								aria-hidden="true"
							>
								<Icon size={28} className={isActive ? "text-white" : colors.icon} strokeWidth={2.5} />
							</div>

							<span className={clsx(
								"text-base font-bold tracking-wide transition-colors duration-300",
								isActive ? "text-white" : "text-gray-700 dark:text-gray-200"
							)}>
								{dest.label}
							</span>

							{isActive && (
								<div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2 py-1 rounded-full" aria-hidden="true">
									<div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
									<span className="text-[10px] uppercase font-bold text-white tracking-wider">Active</span>
								</div>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
