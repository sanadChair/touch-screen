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
			className="w-28 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col items-center py-8 shadow-sm z-10 transition-colors duration-300"
			aria-label="Main Navigation"
		>
			<div className="mb-10" aria-hidden="true">
				<div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
					<span className="text-white font-bold text-2xl tracking-tighter">S</span>
				</div>
			</div>

			<nav 
				className="flex-1 w-full flex flex-col items-center gap-6"
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
								"w-20 h-20 rounded-[1.25rem] flex flex-col items-center justify-center transition-all duration-300 ease-out gap-1.5 focus:outline-none",
								isActive
									? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-none"
									: "text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200",
							)}
						>
							<div
								className={clsx(
									"transition-transform duration-300",
									isActive ? "scale-110 translate-y-[-2px]" : "",
								)}
								aria-hidden="true"
							>
								{tab.icon}
							</div>
							<span
								className={clsx(
									"text-[11px] font-semibold tracking-wide transition-opacity duration-300",
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
