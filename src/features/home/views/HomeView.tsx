import { Bot, Map as MapIcon, Settings } from "lucide-preact";

export function HomeView() {
	return (
		<div className="flex-1 h-full flex flex-col p-12 bg-gray-50 overflow-y-auto">
			<div className="max-w-4xl mx-auto w-full flex flex-col gap-10">
				<header className="flex flex-col gap-2">
					<h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
						Welcome to Sanad Kiosk
					</h1>
					<p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
						Interact with the autonomous robot system. Select a
						destination, monitor the current status, and manage
						settings through this interface.
					</p>
				</header>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300">
						<div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
							<Bot size={28} strokeWidth={2.5} />
						</div>
						<div>
							<h3 className="text-xl font-bold text-gray-800 mb-1">
								Robot Status
							</h3>
							<p className="text-gray-500 text-sm">
								Monitor current robot health, battery, and
								operation status.
							</p>
						</div>
					</div>

					<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300">
						<div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
							<MapIcon size={28} strokeWidth={2.5} />
						</div>
						<div>
							<h3 className="text-xl font-bold text-gray-800 mb-1">
								Navigation
							</h3>
							<p className="text-gray-500 text-sm">
								View real-time map, current pose, and set
								navigation goals.
							</p>
						</div>
					</div>

					<div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-300">
						<div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
							<Settings size={28} strokeWidth={2.5} />
						</div>
						<div>
							<h3 className="text-xl font-bold text-gray-800 mb-1">
								Configuration
							</h3>
							<p className="text-gray-500 text-sm">
								Adjust kiosk preferences and application
								settings.
							</p>
						</div>
					</div>
				</div>

				<div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mt-4">
					<div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold mb-2">
								Ready to Start?
							</h2>
							<p className="text-blue-100 max-w-md">
								Navigate to the Map tab to begin exploring the
								environment and assigning tasks.
							</p>
						</div>
						<div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
							<MapIcon
								size={32}
								className="text-white drop-shadow-md"
							/>
						</div>
					</div>
					<div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/4"></div>
				</div>
			</div>
		</div>
	);
}
