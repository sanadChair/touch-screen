import type { OccupancyGrid } from "../types";

export const renderMapToCanvas = (
	canvas: HTMLCanvasElement,
	map: OccupancyGrid,
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

	for (let i = 0; i < data.length; i++) {
		const occupancy = data[i];
		const pixelIndex = i * 4;

		let color = 127;
		let alpha = 255;

		if (occupancy === 0) {
			color = 255;
		} else if (occupancy === 100) {
			color = 0;
		} else if (occupancy === -1) {
			color = 200;
			alpha = 100;
		} else {
			color = 255 - Math.floor((occupancy / 100) * 255);
		}

		pixels[pixelIndex] = color;
		pixels[pixelIndex + 1] = color;
		pixels[pixelIndex + 2] = color;
		pixels[pixelIndex + 3] = alpha;
	}

	ctx.putImageData(imageData, 0, 0);
};
