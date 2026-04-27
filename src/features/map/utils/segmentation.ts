import type { OccupancyGrid } from "../types";

export interface PixelPoint {
	x: number;
	y: number;
}

export interface BoundingBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface SegmentationResult {
	mask: Uint8Array; // 1 for room pixel, 0 for outside
	boundingBox: BoundingBox;
	pixelCount: number;
}

/**
 * Performs a flood-fill algorithm on an OccupancyGrid to find a contiguous "free" space (room).
 * @param grid The ROS OccupancyGrid.
 * @param startX Source pixel X coordinate.
 * @param startY Source pixel Y coordinate.
 * @param maxDistance Maximum pixel distance to explore (prevents infinite loops on huge open maps).
 * @returns A SegmentationResult containing the Mask and Bounding Box of the room.
 */
export function segmentRoomFromPoint(
	grid: OccupancyGrid,
	startX: number,
	startY: number,
	maxDistance = 600,
): SegmentationResult | null {
	const { width, height } = grid.info;
	const data = grid.data;

	// Bounds check
	if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
		return null;
	}

	const startIndex = startY * width + startX;

	// If starting point is not free space (0) or mostly free, abort.
	// We allow slightly noisy free space up to occupancy 20.
	if (data[startIndex] > 20 || data[startIndex] === -1) {
		return null;
	}

	const mask = new Uint8Array(width * height);
	const queue: PixelPoint[] = [{ x: startX, y: startY }];

	// Mark starting point
	mask[startIndex] = 1;

	let minX = startX;
	let minY = startY;
	let maxX = startX;
	let maxY = startY;
	let pixelCount = 0;

	// Non-recursive BFS
	let head = 0;

	// Direction vectors for 4-way connectivity (Up, Down, Left, Right)
	const dx = [0, 0, -1, 1];
	const dy = [-1, 1, 0, 0];

	while (head < queue.length) {
		const current = queue[head++];
		pixelCount++;

		if (current.x < minX) minX = current.x;
		if (current.x > maxX) maxX = current.x;
		if (current.y < minY) minY = current.y;
		if (current.y > maxY) maxY = current.y;

		// Expand 4-way
		for (let i = 0; i < 4; i++) {
			const nx = current.x + dx[i];
			const ny = current.y + dy[i];

			// Boundary checks
			if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
				continue;
			}

			// Distance restrictor
			if (Math.abs(nx - startX) > maxDistance || Math.abs(ny - startY) > maxDistance) {
				continue;
			}

			const nIndex = ny * width + nx;

			// If already visited by our mask
			if (mask[nIndex]) {
				continue;
			}

			const occ = data[nIndex];

			// -1 is unknown, > 30 is a wall/obstacle. We stop at walls and unknowns.
			if (occ === -1 || occ > 30) {
				continue;
			}

			// Add to queue and mark
			mask[nIndex] = 1;
			queue.push({ x: nx, y: ny });
		}
	}

	// If the room is too tiny (noise), reject it. e.g. < 50 pixels
	if (pixelCount < 50) {
		return null;
	}

	// Add a small padding to bounding box
	minX = Math.max(0, minX - 2);
	minY = Math.max(0, minY - 2);
	maxX = Math.min(width - 1, maxX + 2);
	maxY = Math.min(height - 1, maxY + 2);

	return {
		mask,
		pixelCount,
		boundingBox: { minX, minY, maxX, maxY },
	};
}
