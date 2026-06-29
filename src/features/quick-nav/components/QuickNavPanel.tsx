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
		<div className="flex flex-col gap-2" role="region" aria-labelledby="quick-nav-heading">
			<div className="flex items-center gap-1.5 px-1">
				<div className="p-1 bg-gray-100 dark:bg-slate-800 rounded-md" aria-hidden="true">
					<Navigation size={14} className="text-gray-500 dark:text-slate-400" />
				</div>
				<h2 id="quick-nav-heading" className="text-xs font-extrabold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
					Quick Nav
				</h2>
			</div>

			<div 
				className="flex flex-col gap-1.5" 
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
								"group relative flex items-center gap-3 p-2 rounded-xl border transition-all duration-205 ease-out cursor-pointer overflow-hidden focus:outline-none",
								isActive
									? [
											colors.activeBg,
											"border-transparent text-white shadow-md scale-[0.98]",
										]
									: [
											"bg-white dark:bg-slate-800/40 border-gray-200 dark:border-slate-800",
											"hover:bg-gray-50 dark:hover:bg-slate-800/80 text-gray-700 dark:text-gray-200"
										],
							)}
						>
							<div
								className={clsx(
									"w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 shrink-0",
									isActive
										? "bg-white/20"
										: ["bg-gray-50 dark:bg-slate-900", colors.icon],
								)}
								aria-hidden="true"
							>
								<Icon size={18} className={isActive ? "text-white" : colors.icon} strokeWidth={2.5} />
							</div>

							<span className="text-xs font-bold truncate">
								{dest.label}
							</span>

							{isActive && (
								<div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse mr-1" aria-hidden="true" />
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
