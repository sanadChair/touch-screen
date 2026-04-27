import { useState } from "preact/hooks";
import {
	MapPin,
	Home,
	Utensils,
	BedDouble,
	Monitor,
	Coffee,
	Briefcase,
	Sofa,
	Check,
	X,
} from "lucide-preact";
import { clsx } from "clsx";

export interface RoomModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (name: string, icon: string) => void;
}

const AVAILABLE_ICONS = [
	{ name: "Sofa", Component: Sofa },
	{ name: "Utensils", Component: Utensils },
	{ name: "BedDouble", Component: BedDouble },
	{ name: "Coffee", Component: Coffee },
	{ name: "Monitor", Component: Monitor },
	{ name: "Briefcase", Component: Briefcase },
	{ name: "Home", Component: Home },
	{ name: "MapPin", Component: MapPin },
];

export function RoomModal({ isOpen, onClose, onSave }: RoomModalProps) {
	const [name, setName] = useState("");
	const [selectedIcon, setSelectedIcon] = useState("MapPin");

	if (!isOpen) return null;

	const handleSave = () => {
		if (name.trim()) {
			onSave(name.trim(), selectedIcon);
			setName("");
			setSelectedIcon("MapPin");
			onClose();
		}
	};

	return (
		<div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
			<div className="bg-white dark:bg-slate-900 w-[90%] max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-slate-800 flex flex-col gap-8 animate-in zoom-in-95 duration-200">
				
				<div className="flex justify-between items-center">
					<h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
						Save Local Area
					</h2>
					<button
						onClick={onClose}
						className="p-3 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
					>
						<X size={24} />
					</button>
				</div>

				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-3">
						<label className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1">
							Area Name
						</label>
						<input
							type="text"
							value={name}
							onInput={(e) => setName(e.currentTarget.value)}
							placeholder="e.g. Living Room, Main Office..."
							className="w-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white text-xl font-medium px-6 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-colors"
							autoFocus
						/>
					</div>

					<div className="flex flex-col gap-3">
						<label className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest pl-1">
							Select Icon
						</label>
						<div className="grid grid-cols-4 gap-3">
							{AVAILABLE_ICONS.map(({ name: iconName, Component }) => {
								const isSelected = selectedIcon === iconName;
								return (
									<button
										key={iconName}
										onClick={() => setSelectedIcon(iconName)}
										className={clsx(
											"flex items-center justify-center p-4 rounded-2xl transition-all duration-200 border-2",
											isSelected
												? "border-blue-500 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 scale-105"
												: "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-600"
										)}
									>
										<Component size={32} />
									</button>
								);
							})}
						</div>
					</div>
				</div>

				<div className="flex gap-4 pt-4">
					<button
						onClick={onClose}
						className="flex-1 py-5 text-xl font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-2xl active:scale-95 transition-all"
					>
						Cancel
					</button>
					<button
						onClick={handleSave}
						disabled={!name.trim()}
						className="flex-1 py-5 text-xl font-bold rounded-2xl active:scale-95 transition-all text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
					>
						<Check size={24} />
						Save Area
					</button>
				</div>
			</div>
		</div>
	);
}
