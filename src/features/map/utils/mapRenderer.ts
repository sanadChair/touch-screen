import type { OccupancyGrid } from "../types";

export const renderMapToCanvas = (
	canvas: HTMLCanvasElement,
	map: OccupancyGrid,
	theme: "light" | "dark" = "light"
) => {
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const { width, height } = map.info;
	const data = map.data;

	canvas.width = width;
	canvas.height = height;

	const imageData = ctx.createImageData(width, height);
	const pixels = imageData.data;

	// Define color palettes
	const palettes = {
		light: {
			free: [255, 255, 255, 255],        // White
			occupied: [15, 23, 42, 255],       // Very dark blue/slate for walls
			unknown: [241, 245, 249, 150],     // Slate 100
		},
		dark: {
			free: [15, 23, 42, 255],           // Slate 950
			occupied: [99, 102, 241, 255],     // Indigo 500 (glowing blue walls)
			unknown: [2, 6, 23, 150],          // Slate 950 darker
		}
	};

	const colors = theme === "dark" ? palettes.dark : palettes.light;

	for (let i = 0; i < data.length; i++) {
		const occupancy = data[i];
		const pixelIndex = i * 4;

		let r, g, b, a;

		if (occupancy === 0) {
			[r, g, b, a] = colors.free;
		} else if (occupancy === 100) {
			[r, g, b, a] = colors.occupied;
		} else if (occupancy === -1) {
			[r, g, b, a] = colors.unknown;
		} else {
			// Interpolate for partial occupancy
			const ratio = occupancy / 100;
			r = colors.free[0] * (1 - ratio) + colors.occupied[0] * ratio;
			g = colors.free[1] * (1 - ratio) + colors.occupied[1] * ratio;
			b = colors.free[2] * (1 - ratio) + colors.occupied[2] * ratio;
			a = 255;
		}

		pixels[pixelIndex] = r;
		pixels[pixelIndex + 1] = g;
		pixels[pixelIndex + 2] = b;
		pixels[pixelIndex + 3] = a;
	}

	ctx.putImageData(imageData, 0, 0);
};

