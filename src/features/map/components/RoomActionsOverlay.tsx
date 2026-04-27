import { 
	Lightbulb, 
	Thermometer, 
	Monitor, 
	Coffee, 
	Briefcase, 
	ShieldCheck, 
	Lock, 
	X,
	Settings2,
	ChevronRight
} from "lucide-preact";
import { cn } from "../../../shared/lib/utils";
import type { RoomAction, RoomWithActions } from "../types";
import { useState } from "preact/hooks";

interface RoomActionsOverlayProps {
	room: RoomWithActions;
	onClose: () => void;
	onActionTrigger?: (action: RoomAction, value: any) => void;
}

const ICON_MAP: Record<string, any> = {
	Lightbulb,
	Thermometer,
	Monitor,
	Coffee,
	Briefcase,
	ShieldCheck,
	Lock,
};

export const RoomActionsOverlay = ({ 
	room, 
	onClose, 
	onActionTrigger 
}: RoomActionsOverlayProps) => {
	const [actionValues, setActionValues] = useState<Record<string, any>>(
		room.actions.reduce((acc, action) => ({ ...acc, [action.id]: action.value }), {})
	);

	const handleAction = (action: RoomAction, newValue: any) => {
		setActionValues(prev => ({ ...prev, [action.id]: newValue }));
		if (onActionTrigger) onActionTrigger(action, newValue);
	};

	const stopBubbling = (e: any) => {
		e.stopPropagation();
	};

	return (
		<div 
			onMouseDown={stopBubbling}
			onMouseUp={stopBubbling}
			onClick={stopBubbling}
			onTouchStart={stopBubbling}
			onTouchEnd={stopBubbling}
			className="absolute top-6 left-6 z-[60] flex flex-col gap-6 animate-in slide-in-from-left-8 duration-500 ease-out"
		>


			{/* Header Card */}
			<div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-2xl rounded-3xl p-6 min-w-[320px] relative overflow-hidden group">
				{/* Background Glow */}
				<div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-colors duration-700" />
				
				<div className="flex items-center justify-between relative z-10">
					<div className="flex items-center gap-4">
						<div className="w-14 h-14 bg-indigo-600 dark:bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
							<Settings2 className="text-white" size={28} />
						</div>
						<div>
							<h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
								{room.name}
							</h2>
							<p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
								Room Controls
							</p>
						</div>
					</div>
					<button 
						onClick={onClose}
						className="p-2.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors text-slate-500 dark:text-slate-400 active:scale-90"
					>
						<X size={24} />
					</button>
				</div>
			</div>

			{/* Actions List */}
			<div className="flex flex-col gap-3">
				{room.actions.map((action, idx) => {
					const Icon = ICON_MAP[action.iconName] || Lightbulb;
					const value = actionValues[action.id];

					return (
						<div 
							key={action.id}
							style={{ animationDelay: `${idx * 100}ms` }}
							className={cn(
								"group bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border border-white/20 dark:border-slate-800/50 shadow-xl rounded-2xl p-4 flex items-center justify-between min-w-[320px] transition-all duration-300 hover:translate-x-2 animate-in slide-in-from-left-4 fill-mode-both",
								action.type === 'toggle' && value && "bg-indigo-50/90 dark:bg-indigo-500/10 border-indigo-200/50 dark:border-indigo-500/30"
							)}
						>
							<div className="flex items-center gap-4">
								<div className={cn(
									"w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
									action.type === 'toggle' && value 
										? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-110" 
										: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
								)}>
									<Icon size={22} />
								</div>
								<div>
									<h3 className="font-bold text-slate-800 dark:text-slate-100">
										{action.label}
									</h3>
									<p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
										{action.type === 'slider' ? `${Number(value) || 22}°C` : action.type === 'toggle' ? (value ? 'ACTIVE' : 'INACTIVE') : 'READY'}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								{action.type === 'toggle' && (
									<button
										onClick={() => handleAction(action, !value)}
										className={cn(
											"w-12 h-7 rounded-full transition-colors duration-300 relative flex items-center px-1",
											value ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
										)}
									>
										<div className={cn(
											"w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300",
											value ? "translate-x-5" : "translate-x-0"
										)} />
									</button>
								)}

								{action.type === 'slider' && (
									<div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
										<button 
											onClick={() => handleAction(action, Math.max(16, (Number(value) || 22) - 1))}
											className="w-6 h-6 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors"
										>
											-
										</button>
										<span className="text-xs font-mono font-bold w-6 text-center text-slate-700 dark:text-slate-200">
											{Number(value) || 22}
										</span>
										<button 
											onClick={() => handleAction(action, Math.min(30, (Number(value) || 22) + 1))}
											className="w-6 h-6 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-colors"
										>
											+
										</button>
									</div>
								)}


								{action.type === 'button' && (
									<button
										onClick={() => handleAction(action, true)}
										className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-all active:scale-95 group-hover:text-indigo-500"
									>
										<ChevronRight size={20} />
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
