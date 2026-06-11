export interface WheelNode {
	id: string;
	label: string;
	iconName: string; // lucide icon name (e.g. Sofa, Lightbulb, etc.)
	color: string; // tailwind color class or color indicator
	action?: () => void; // action callback when sector is triggered
	children?: WheelNode[]; // sub-wheel children configuration
}

export type DwellState = "idle" | "dwelling" | "triggered" | "cooldown";
