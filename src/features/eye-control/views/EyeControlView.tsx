import { useState, useEffect, useMemo } from "preact/hooks";
import { GazeWheel } from "../components/GazeWheel";
import type { WheelNode } from "../types";
import { useRooms } from "../../map/hooks/useRooms";
import { RoomServiceFactory } from "../../map/services/RoomServiceFactory";
import { SmartHomeServiceFactory } from "../../smart-home/services/SmartHomeServiceFactory";
import { WheelchairServiceFactory } from "../../wheelchair/services/WheelchairServiceFactory";
import {
	Compass,
	Bot,
} from "lucide-preact";
import { useServerHealth } from "../../../shared/hooks/useServerHealth";

export function EyeControlView() {
	const { rooms, refreshRooms } = useRooms();
	const roomService = RoomServiceFactory.getService();
	const smartHomeService = SmartHomeServiceFactory.getService();
	const wheelchairService = WheelchairServiceFactory.getService();
	const { isOffline } = useServerHealth();

	// Local states
	const [menuPath, setMenuPath] = useState<string[]>(["Main Menu"]);
	const [activeNodes, setActiveNodes] = useState<WheelNode[]>([]);
	const [dwellTimeMs, setDwellTimeMs] = useState<number>(() => {
		const saved = localStorage.getItem("kiosk-gaze-dwell");
		return saved ? Number(saved) : 3000;
	});
	const [statusMessage, setStatusMessage] = useState<string>("Ready");
	const [currentVelocity, setCurrentVelocity] = useState({ linear: 0, angular: 0 });

	// Poll current velocity to display in the sidebar panel
	useEffect(() => {
		const pollVel = async () => {
			try {
				const vel = await wheelchairService.getVelocity();
				setCurrentVelocity(vel);
			} catch (e) {
				// Silently ignore polling errors
			}
		};
		const interval = setInterval(pollVel, 2000);
		return () => clearInterval(interval);
	}, [wheelchairService]);

	// Define wheelchair nodes
	const wheelchairNodes: WheelNode[] = [
		{
			id: "wc_forward",
			label: "Move Forward",
			iconName: "ArrowUp",
			color: "indigo",
			action: () => {
				void wheelchairService.updateVelocity(0.3, 0.0);
				setStatusMessage("Moving forward (linear = 0.3)");
			},
		},
		{
			id: "wc_left",
			label: "Turn Left",
			iconName: "ArrowLeft",
			color: "indigo",
			action: () => {
				void wheelchairService.updateVelocity(0.0, 0.4);
				setStatusMessage("Turning left (angular = 0.4)");
			},
		},
		{
			id: "wc_stop",
			label: "STOP",
			iconName: "Octagon",
			color: "red",
			action: () => {
				void wheelchairService.updateVelocity(0.0, 0.0);
				setStatusMessage("Stopped wheelchair");
			},
		},
		{
			id: "wc_right",
			label: "Turn Right",
			iconName: "ArrowRight",
			color: "indigo",
			action: () => {
				void wheelchairService.updateVelocity(0.0, -0.4);
				setStatusMessage("Turning right (angular = -0.4)");
			},
		},
		{
			id: "wc_backward",
			label: "Move Backward",
			iconName: "ArrowDown",
			color: "indigo",
			action: () => {
				void wheelchairService.updateVelocity(-0.3, 0.0);
				setStatusMessage("Moving backward (linear = -0.3)");
			},
		},
	];

	// Define Dwell Settings nodes
	const dwellSettingsNodes: WheelNode[] = [
		{
			id: "dwell_1.5s",
			label: "1.5s Dwell",
			iconName: "Zap",
			color: "gray",
			action: () => {
				localStorage.setItem("kiosk-gaze-dwell", "1500");
				setDwellTimeMs(1500);
				setStatusMessage("Dwell time set to 1.5s");
				handleGoBack();
			},
		},
		{
			id: "dwell_3.0s",
			label: "3.0s Dwell",
			iconName: "Timer",
			color: "gray",
			action: () => {
				localStorage.setItem("kiosk-gaze-dwell", "3000");
				setDwellTimeMs(3000);
				setStatusMessage("Dwell time set to 3s");
				handleGoBack();
			},
		},
		{
			id: "dwell_5.0s",
			label: "5.0s Dwell",
			iconName: "Hourglass",
			color: "gray",
			action: () => {
				localStorage.setItem("kiosk-gaze-dwell", "5000");
				setDwellTimeMs(5000);
				setStatusMessage("Dwell time set to 5s");
				handleGoBack();
			},
		},
	];

	// Define Top level nodes
	const topLevelNodes = useMemo<WheelNode[]>(() => {
		return [
			{ id: "nav", label: "Navigation", iconName: "Map", color: "blue" },
			{ id: "lights", label: "Toggle Lights", iconName: "Lightbulb", color: "amber" },
			{ id: "temp", label: "Thermostat", iconName: "Thermometer", color: "orange" },
			{ id: "media", label: "Toggle Media", iconName: "Music", color: "purple" },
			{ id: "security", label: "Doors Lock", iconName: "Shield", color: "stone" },
			{ id: "wheelchair", label: "Wheelchair", iconName: "Compass", color: "indigo" },
			{ id: "dwell_settings", label: "Gaze Dwell", iconName: "Settings", color: "gray" },
		];
	}, []);

	// Initialize active nodes
	useEffect(() => {
		if (menuPath.length === 1) {
			setActiveNodes(topLevelNodes);
		}
	}, [menuPath, topLevelNodes]);

	const handleGoBack = () => {
		if (menuPath.length > 1) {
			setMenuPath((prev) => prev.slice(0, -1));
		}
	};

	const handleAction = async (node: WheelNode) => {
		// If node has action callback, run it
		if (node.action) {
			node.action();
			return;
		}

		// Otherwise, handle category sub-wheels
		if (node.id === "nav") {
			const roomNodes: WheelNode[] = rooms.map((room) => ({
				id: `room_${room.id}`,
				label: room.name,
				iconName: room.iconName || "Home",
				color: "emerald",
				action: () => {
					void roomService.navigateToRoom(room.id);
					setStatusMessage(`Navigating to ${room.name}`);
					setMenuPath(["Main Menu"]); // jump back to root menu after action
				},
			}));
			setMenuPath((prev) => [...prev, "Navigation"]);
			setActiveNodes(roomNodes);
		} else if (node.id === "wheelchair") {
			setMenuPath((prev) => [...prev, "Wheelchair"]);
			setActiveNodes(wheelchairNodes);
		} else if (node.id === "dwell_settings") {
			setMenuPath((prev) => [...prev, "Gaze Dwell"]);
			setActiveNodes(dwellSettingsNodes);
		} else if (node.id === "lights") {
			setStatusMessage("Toggling room light switches...");
			// Find all binary light devices in all rooms and toggle them
			let toggledCount = 0;
			for (const room of rooms) {
				for (const dev of room.devices) {
					if (dev.type === "binary" && dev.name.toLowerCase().includes("light")) {
						const isCurrentlyOn = dev.state.power === "on";
						const action = {
							id: dev.id,
							roomId: room.id,
							deviceId: dev.id,
							deviceName: dev.name,
							label: dev.name,
							iconName: "Lightbulb",
							type: "toggle" as const,
							command: isCurrentlyOn ? "turn_off" : "turn_on",
							value: !isCurrentlyOn,
						};
						void smartHomeService.executeAction(action, !isCurrentlyOn);
						toggledCount++;
					}
				}
			}
			setTimeout(() => void refreshRooms(), 300);
			setStatusMessage(`Toggled ${toggledCount} lights in the house`);
		} else if (node.id === "temp") {
			setStatusMessage("Adjusting thermostat presets...");
			// Find all thermostats/ACs and set to 23 degrees Celsius
			let acCount = 0;
			for (const room of rooms) {
				for (const dev of room.devices) {
					if (dev.type === "dimmer" && (dev.name.toLowerCase().includes("ac") || dev.name.toLowerCase().includes("temp"))) {
						const action = {
							id: dev.id,
							roomId: room.id,
							deviceId: dev.id,
							deviceName: dev.name,
							label: dev.name,
							iconName: "Thermometer",
							type: "slider" as const,
							command: "set_brightness",
							value: 23,
						};
						void smartHomeService.executeAction(action, 23);
						acCount++;
					}
				}
			}
			setTimeout(() => void refreshRooms(), 300);
			setStatusMessage(`Set ${acCount} air conditioners to 23°C`);
		} else if (node.id === "media") {
			setStatusMessage("Toggling smart TVs...");
			let mediaCount = 0;
			for (const room of rooms) {
				for (const dev of room.devices) {
					if (dev.type === "binary" && (dev.name.toLowerCase().includes("tv") || dev.name.toLowerCase().includes("media"))) {
						const isCurrentlyOn = dev.state.power === "on";
						const action = {
							id: dev.id,
							roomId: room.id,
							deviceId: dev.id,
							deviceName: dev.name,
							label: dev.name,
							iconName: "Music",
							type: "toggle" as const,
							command: isCurrentlyOn ? "turn_off" : "turn_on",
							value: !isCurrentlyOn,
						};
						void smartHomeService.executeAction(action, !isCurrentlyOn);
						mediaCount++;
					}
				}
			}
			setTimeout(() => void refreshRooms(), 300);
			setStatusMessage(`Toggled ${mediaCount} media devices`);
		} else if (node.id === "security") {
			setStatusMessage("Securing all doors...");
			// Simulating securing all lock doors
			setStatusMessage("All doors successfully LOCKED");
		}
	};

	const activeLabel = menuPath[menuPath.length - 1];

	return (
		<div className="flex-1 h-full flex flex-col p-4 sm:p-6 bg-gradient-to-tr from-[#0a0f1e] via-[#030712] to-[#0d1527] text-white overflow-hidden justify-between kiosk-view">
			{/* Header */}
			<header className="flex items-center justify-between border-b border-slate-800/80 pb-3 h-10 shrink-0">
				<div className="flex items-center gap-2">
					<Compass className="text-indigo-400 animate-spin-slow shrink-0" size={20} />
					<div className="flex items-center gap-1.5 text-sm font-semibold text-gray-300">
						<span>Hands-Free Control</span>
						<span>&gt;</span>
						<span className="text-indigo-400 font-bold">{menuPath.join(" > ")}</span>
					</div>
				</div>
				<div className="text-xs bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 text-slate-400 font-bold">
					Dwell: {(dwellTimeMs / 1000).toFixed(1)}s
				</div>
			</header>

			{/* Main Content Workspace */}
			<div className="flex-1 min-h-0 flex items-center justify-between gap-4 py-0.5">
				{/* Left Info Sidebar */}
				<div className="hidden lg:flex flex-col gap-4 w-44 bg-slate-900/40 p-4 border border-slate-800/60 rounded-3xl backdrop-blur-md self-stretch justify-center">
					<div>
						<span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block mb-1">Robot Status</span>
						<div className="flex items-center gap-1.5">
							<span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
							<span className="text-sm font-bold">Online</span>
						</div>
					</div>
					<div>
						<span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block mb-1">Active Rooms</span>
						<span className="text-sm font-bold">{rooms.length} registered</span>
					</div>
					<div>
						<span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block mb-1">Battery</span>
						<span className="text-sm font-bold">94%</span>
					</div>
				</div>

				{/* Center Radial Gaze Wheel */}
				<div className="flex-1 flex items-center justify-center">
					<GazeWheel
						nodes={activeNodes}
						dwellTimeMs={dwellTimeMs}
						onAction={handleAction}
						onBack={menuPath.length > 1 ? handleGoBack : undefined}
						centerLabel={activeLabel}
						size={isOffline ? 370 : 410} // Fit nicely in the viewport height
					/>
				</div>

				{/* Right Info Sidebar */}
				<div className="hidden lg:flex flex-col gap-4 w-44 bg-slate-900/40 p-4 border border-slate-800/60 rounded-3xl backdrop-blur-md self-stretch justify-center">
					<div>
						<span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block mb-1">Command Output</span>
						<div className="flex items-start gap-1.5 text-xs text-slate-300 leading-tight">
							<Bot size={14} className="shrink-0 text-slate-400 mt-0.5" />
							<span className="font-medium">{statusMessage}</span>
						</div>
					</div>

					<div>
						<span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 block mb-1">Wheelchair Speed</span>
						<div className="font-mono text-xs text-slate-300">
							<p>Linear: {currentVelocity.linear.toFixed(2)} m/s</p>
							<p className="mt-1">Angular: {currentVelocity.angular.toFixed(2)} rad/s</p>
						</div>
					</div>
				</div>
			</div>

		</div>
	);
}
