import { useState } from "preact/hooks";
import {
	Lightbulb,
	Power,
	Thermometer,
	Lock,
	Unlock,
	Fan,
	Camera,
	ShieldCheck,
	Volume2,
	Music,
} from "lucide-preact";
import { clsx } from "clsx";
import { SmartHomeService } from "../services/SmartHomeService";
import { useArrowNavigation } from "../../../shared/hooks/useArrowNavigation";

interface DeviceState {
	id: string;
	name: string;
	isOn: boolean;
	value?: number; // temperature, brightness, etc.
}

export function SmartHomeView() {
	const smartHomeService = SmartHomeService.getInstance();
	const { handleKeyDown } = useArrowNavigation();

	// Simulated States
	const [lights, setLights] = useState<Record<string, DeviceState>>({
		living: { id: "living", name: "Living Room", isOn: true, value: 80 },
		kitchen: { id: "kitchen", name: "Kitchen", isOn: false, value: 100 },
		office: { id: "office", name: "Office Desk", isOn: true, value: 45 },
	});

	const [climate, setClimate] = useState({
		hvac: true,
		temperature: 22,
		fanSpeed: 2,
	});

	const [security, setSecurity] = useState({
		frontDoorLocked: true,
		systemArmed: true,
	});

	// Handlers
	const toggleLight = (id: string) => {
		const newState = !lights[id].isOn;
		setLights((prev) => ({
			...prev,
			[id]: { ...prev[id], isOn: newState },
		}));
		
		smartHomeService.sendCommand(`light_${id}`, newState ? "turn_on" : "turn_off");
	};

	const adjustBrightness = (id: string, val: number) => {
		setLights((prev) => ({
			...prev,
			[id]: { ...prev[id], value: val, isOn: val > 0 },
		}));
		
		smartHomeService.sendCommand(`light_${id}`, `set_brightness_${val}`);
	};

	return (
		<div className="flex-1 h-full flex flex-col p-8 md:p-12 bg-gray-50 dark:bg-slate-900 overflow-y-auto transition-colors duration-300">
			<div className="max-w-6xl mx-auto w-full flex flex-col gap-8 md:gap-12">
				<header className="flex flex-col gap-3">
					<h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
						Smart Home
					</h1>
					<p className="text-lg md:text-xl text-gray-500 dark:text-slate-400 max-w-2xl leading-relaxed">
						Monitor and control integrated IoT devices. Manage lighting, climate, and security from this unified dashboard.
					</p>
				</header>

				<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
					{/* Lighting Section */}
					<section className="flex flex-col gap-4 col-span-1 lg:col-span-2" aria-labelledby="lighting-heading">
						<div className="flex items-center gap-3 px-2">
							<Lightbulb className="text-amber-500" size={24} aria-hidden="true" />
							<h2 id="lighting-heading" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
								Lighting
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4" onKeyDown={handleKeyDown}>
							{Object.values(lights).map((light) => (
								<div
									key={light.id}
									className={clsx(
										"p-6 rounded-[2rem] border transition-all duration-300 flex flex-col gap-6",
										light.isOn
											? "bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-500/30 shadow-lg shadow-amber-500/5 dark:shadow-amber-500/10"
											: "bg-gray-100/50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 shadow-sm"
									)}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-4">
											<div
												className={clsx(
													"w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-300",
													light.isOn
														? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
														: "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
												)}
												aria-hidden="true"
											>
												<Lightbulb size={28} />
											</div>
											<div>
												<h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
													{light.name}
												</h3>
												<p className="text-sm font-medium text-gray-500 dark:text-slate-400" aria-live="polite">
													{light.isOn ? `${light.value}% Brightness` : "Off"}
												</p>
											</div>
										</div>
										<button
											onClick={() => toggleLight(light.id)}
											aria-label={`Toggle ${light.name}`}
											aria-pressed={light.isOn}
											tabIndex={Object.keys(lights).indexOf(light.id) === 0 ? 0 : -1}
											className={clsx(
												"w-16 h-10 rounded-full flex items-center p-1 transition-colors duration-300",
												light.isOn
													? "bg-amber-500 justify-end"
													: "bg-gray-300 dark:bg-slate-600 justify-start"
											)}
										>
											<div className="w-8 h-8 rounded-full bg-white shadow-md transform transition-transform" />
										</button>
									</div>

									{/* Slider */}
									<div className="px-2">
										<label htmlFor={`brightness-${light.id}`} className="sr-only">
											{light.name} Brightness
										</label>
										<input
											id={`brightness-${light.id}`}
											type="range"
											min="0"
											max="100"
											value={light.isOn ? light.value : 0}
											aria-valuemin={0}
											aria-valuemax={100}
											aria-valuenow={light.isOn ? light.value : 0}
											onChange={(e) =>
												adjustBrightness(light.id, parseInt(e.currentTarget.value))
											}
											className={clsx(
												"w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500",
												light.isOn
													? "bg-amber-200 dark:bg-slate-700 accent-amber-500"
													: "bg-gray-200 dark:bg-slate-700 accent-gray-400"
											)}
										/>
									</div>
								</div>
							))}
						</div>
					</section>

					{/* Climate Section */}
					<section className="flex flex-col gap-4" aria-labelledby="climate-heading">
						<div className="flex items-center gap-3 px-2">
							<Thermometer className="text-blue-500" size={24} aria-hidden="true" />
							<h2 id="climate-heading" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
								Climate
							</h2>
						</div>

						<div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-blue-100 dark:border-slate-700 shadow-lg shadow-blue-500/5 flex flex-col gap-8 flex-1">
							<div className="flex items-center justify-between">
								<h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
									Thermostat
								</h3>
								<button
									onClick={() => {
										const newState = !climate.hvac;
										setClimate((p) => ({ ...p, hvac: newState }));
										smartHomeService.sendCommand("ac", newState ? "turn_on" : "turn_off");
									}}
									aria-label={`Toggle Thermostat`}
									aria-pressed={climate.hvac}
									className={clsx(
										"p-3 rounded-xl transition-colors duration-300",
										climate.hvac
											? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
											: "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
									)}
								>
									<Power size={24} aria-hidden="true" />
								</button>
							</div>

							<div className="flex flex-col items-center justify-center gap-2 py-4">
								<div className="relative flex items-center justify-center w-48 h-48 rounded-full border-[6px] border-blue-50 dark:border-slate-700/50" aria-label={`Current target temperature ${climate.temperature} degrees`}>
									<svg className="absolute inset-0 w-full h-full transform -rotate-90" aria-hidden="true">
										<circle
											cx="90"
											cy="90"
											r="84"
											fill="none"
											stroke="currentColor"
											strokeWidth="6"
											className={clsx(
												"transition-all duration-1000 ease-out",
												climate.hvac ? "text-blue-500" : "text-gray-300 dark:text-slate-600"
											)}
											strokeDasharray="527"
											strokeDashoffset={527 - (527 * ((climate.temperature - 10) / 20))}
										/>
									</svg>
									<div className="flex flex-col items-center">
										<span className={clsx(
											"text-6xl font-black tracking-tighter",
											climate.hvac ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500"
										)} aria-live="polite">
											{climate.temperature}°
										</span>
										<span className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mt-1">
											Target
										</span>
									</div>
								</div>
							</div>

							<div className="flex items-center justify-between gap-4 mt-auto">
								<button
									onClick={() => {
										const newVal = Math.max(10, climate.temperature - 0.5);
										setClimate(p => ({ ...p, temperature: newVal }));
										smartHomeService.sendCommand("ac", `set_temp_${newVal}`);
									}}
									aria-label="Decrease temperature"
									className="flex-1 py-4 bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white rounded-2xl font-bold text-xl transition-colors active:scale-95"
								>
									-
								</button>
								<div className="flex flex-col items-center px-4" aria-label={`Fan speed ${climate.fanSpeed}`}>
									<Fan size={20} className={clsx("mb-1 transition-transform duration-1000", climate.hvac && "animate-spin text-blue-500")} aria-hidden="true" />
									<span className="text-xs font-bold text-gray-500 dark:text-slate-400 tracking-wider">FAN {climate.fanSpeed}</span>
								</div>
								<button
									onClick={() => {
										const newVal = Math.min(30, climate.temperature + 0.5);
										setClimate(p => ({ ...p, temperature: newVal }));
										smartHomeService.sendCommand("ac", `set_temp_${newVal}`);
									}}
									aria-label="Increase temperature"
									className="flex-1 py-4 bg-gray-100 dark:bg-slate-700/50 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-white rounded-2xl font-bold text-xl transition-colors active:scale-95"
								>
									+
								</button>
							</div>
						</div>
					</section>

					{/* Security Section (Spans full width on lg, single col on xl) */}
					<section className="col-span-1 lg:col-span-2 xl:col-span-3 mt-4" aria-labelledby="security-heading">
						<div className="flex items-center gap-3 px-2 mb-6">
							<ShieldCheck className="text-emerald-500" size={24} aria-hidden="true" />
							<h2 id="security-heading" className="text-2xl font-bold text-gray-800 dark:text-gray-100">
								Security & Media
							</h2>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" role="list" onKeyDown={handleKeyDown}>
							<button
								onClick={() => {
									const newState = !security.frontDoorLocked;
									setSecurity(p => ({ ...p, frontDoorLocked: newState }));
									smartHomeService.sendCommand("door", newState ? "lock" : "unlock");
								}}
								aria-label={`Front Door: ${security.frontDoorLocked ? "Locked" : "Unlocked"}. Click to ${security.frontDoorLocked ? "unlock" : "lock"}.`}
								aria-pressed={security.frontDoorLocked}
								tabIndex={0}
								className={clsx(
									"p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer flex flex-col gap-4 hover:shadow-lg hover:scale-[1.02] active:scale-95 text-left focus:outline-none",
									security.frontDoorLocked
										? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"
										: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
								)}
								role="listitem"
							>
								<div className="flex justify-between items-start">
									<div className={clsx(
										"p-3 rounded-xl",
										security.frontDoorLocked ? "bg-emerald-200/50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400" : "bg-red-200/50 dark:bg-red-500/20 text-red-700 dark:text-red-400"
									)} aria-hidden="true">
										{security.frontDoorLocked ? <Lock size={24}/> : <Unlock size={24}/>}
									</div>
									<div className={clsx("px-3 py-1 rounded-full text-xs font-bold tracking-wide", security.frontDoorLocked ? "bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300" : "bg-red-200 dark:bg-red-500/20 text-red-800 dark:text-red-300")}>
										{security.frontDoorLocked ? "SECURE" : "UNLOCKED"}
									</div>
								</div>
								<div>
									<h3 className="text-xl font-bold text-gray-900 dark:text-white">Front Door</h3>
									<p className="text-sm font-medium text-gray-500 dark:text-slate-400 pt-1">Smart Deadbolt</p>
								</div>
							</button>

							<button
								className="p-6 rounded-[2rem] border bg-gray-100 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 transition-all duration-300 cursor-pointer flex flex-col gap-4 hover:shadow-lg hover:scale-[1.02] active:scale-95 text-left focus:outline-none"
								role="listitem"
								tabIndex={-1}
								aria-label="Driveway Camera: Recording Live"
							>
								<div className="flex justify-between items-start">
									<div className="p-3 rounded-xl bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300" aria-hidden="true">
										<Camera size={24}/>
									</div>
									<div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mt-2 mr-1" aria-hidden="true" />
								</div>
								<div>
									<h3 className="text-xl font-bold text-gray-900 dark:text-white">Driveway</h3>
									<p className="text-sm font-medium text-gray-500 dark:text-slate-400 pt-1">Recording (Live)</p>
								</div>
							</button>

							<button
								className="col-span-1 sm:col-span-2 p-6 rounded-[2rem] border bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-400 dark:border-indigo-500/50 transition-all duration-300 cursor-pointer flex items-center justify-between hover:shadow-xl hover:shadow-indigo-500/20 text-left focus:outline-none"
								role="listitem"
								tabIndex={-1}
								aria-label="Living Room Audio: Playing Synthwave Radio at 45%"
							>
								<div className="flex items-center gap-5 text-white">
									<div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner" aria-hidden="true">
										<Music size={32} />
									</div>
									<div>
										<h3 className="text-2xl font-bold">Living Room Audio</h3>
										<p className="text-indigo-100 font-medium">Playing: Synthwave Radio • 45%</p>
									</div>
								</div>
								<div className="hidden sm:flex gap-3">
									<div className="p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white backdrop-blur-md">
										<Volume2 size={24} aria-hidden="true"/>
									</div>
								</div>
							</button>
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
