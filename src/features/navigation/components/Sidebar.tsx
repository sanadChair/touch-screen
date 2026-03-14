import type { NavTab } from "../types";
import { clsx } from "clsx";

interface SidebarProps {
	tabs: NavTab[];
	activeTabId: string;
	onTabChange: (id: string) => void;
}

export function Sidebar({ tabs, activeTabId, onTabChange }: SidebarProps) {
	return (
		<aside className="w-24 h-full bg-white border-r border-gray-200 flex flex-col items-center py-6 shadow-sm z-10">
			<div className="mb-8">
				<div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
					<span className="text-white font-bold text-xl">S</span>
				</div>
			</div>

			<nav className="flex-1 w-full flex flex-col items-center gap-4">
				{tabs.map((tab) => {
					const isActive = tab.id === activeTabId;
					return (
						<button
							key={tab.id}
							onClick={() => onTabChange(tab.id)}
							className={clsx(
								"w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 ease-in-out gap-1",
								isActive
									? "bg-blue-50 text-blue-600 shadow-inner"
									: "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
							)}
						>
							<div
								className={clsx(
									"transition-transform duration-200",
									isActive ? "scale-110" : "",
								)}
							>
								{tab.icon}
							</div>
							<span className="text-[10px] font-medium tracking-wide">
								{tab.label}
							</span>
						</button>
					);
				})}
			</nav>
		</aside>
	);
}
