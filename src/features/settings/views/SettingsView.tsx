import {
	Bell,
	Shield,
	Smartphone,
	Settings as SettingsIcon,
	Wifi,
} from "lucide-preact";

export function SettingsView() {
	return (
		<div className="flex-1 h-full flex flex-col p-8 md:p-12 bg-gray-50 overflow-y-auto">
			<div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
				<header>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Settings
					</h1>
					<p className="text-gray-500">
						Manage kiosk preferences and system configuration.
					</p>
				</header>

				<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
					<div className="flex flex-col">
						<div className="p-6 border-b border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
							<div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
								<Wifi size={24} />
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-800">
									Connection
								</h3>
								<p className="text-sm text-gray-500">
									ROS 2 Bridge and network settings
								</p>
							</div>
							<div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
								Connected
							</div>
						</div>

						<div className="p-6 border-b border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
							<div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
								<Smartphone size={24} />
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-800">
									Display
								</h3>
								<p className="text-sm text-gray-500">
									Brightness, theme, and language
								</p>
							</div>
						</div>

						<div className="p-6 border-b border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
							<div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
								<Bell size={24} />
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-800">
									Notifications
								</h3>
								<p className="text-sm text-gray-500">
									Alerts for errors and status changes
								</p>
							</div>
						</div>

						<div className="p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
							<div className="w-12 h-12 bg-stone-100 text-stone-600 rounded-2xl flex items-center justify-center">
								<Shield size={24} />
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-800">
									Security
								</h3>
								<p className="text-sm text-gray-500">
									Access control and permissions
								</p>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-4 flex justify-center">
					<p className="text-xs text-gray-400 flex items-center gap-2">
						<SettingsIcon size={14} className="animate-spin-slow" />
						Sanad Kiosk Interface v1.0.0
					</p>
				</div>
			</div>
		</div>
	);
}
