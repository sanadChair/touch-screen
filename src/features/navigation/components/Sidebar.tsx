import type { NavTab } from "../types";
import { clsx } from "clsx";
import { useArrowNavigation } from "../../../shared/hooks/useArrowNavigation";

interface SidebarProps {
	tabs: NavTab[];
	activeTabId: string;
	onTabChange: (id: string) => void;
}

export function Sidebar({ tabs, activeTabId, onTabChange }: SidebarProps) {
	const { handleKeyDown } = useArrowNavigation();

	return (
		<aside 
			className="w-20 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col items-center py-4 shadow-sm z-10 transition-colors duration-300"
			aria-label="Main Navigation"
		>
			<button 
				onClick={() => onTabChange("home")}
				className="mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl shrink-0" 
				aria-label="Go to Home"
			>
				<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
					<span className="text-white font-bold text-xl tracking-tighter">S</span>
				</div>
			</button>

			<nav 
				className="flex-1 w-full flex flex-col items-center gap-3"
				role="tablist"
				aria-label="Application Tabs"
				onKeyDown={handleKeyDown}
			>
				{tabs.map((tab) => {
					const isActive = tab.id === activeTabId;
					return (
						<button
							key={tab.id}
							id={`tab-${tab.id}`}
							onClick={() => onTabChange(tab.id)}
							role="tab"
							aria-selected={isActive}
							aria-controls={`tab-panel-${tab.id}`}
							aria-label={`Switch to ${tab.label} view`}
							tabIndex={isActive ? 0 : -1}
							className={clsx(
								"w-16 h-16 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ease-out gap-1 focus:outline-none shrink-0 [&_svg]:w-[22px] [&_svg]:h-[22px]",
								isActive
									? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none"
									: "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200",
							)}
						>
							<div
								className={clsx(
									"transition-transform duration-300",
									isActive ? "scale-105 translate-y-[-1px]" : "",
								)}
								aria-hidden="true"
							>
								{tab.icon}
							</div>
							<span
								className={clsx(
									"text-[9px] font-bold tracking-wide transition-opacity duration-300",
									isActive ? "opacity-100" : "opacity-80",
								)}
							>
								{tab.label}
							</span>
						</button>
					);
				})}
			</nav>
		</aside>
	);
}
