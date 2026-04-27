import type { OccupancyGrid } from "../types";

// ─── Constants ──────────────────────────────────────────────
const FREE = 0;
const OCCUPIED = 100;
const UNKNOWN = -1;

// A cell is considered "wall" if its occupancy value is above this
const WALL_THRESHOLD = 50;

// Maximum gap (in cells) to bridge between two wall segments
const MAX_GAP_BRIDGE = 5;

// Minimum neighbors required to keep an isolated occupied cell (noise filter)
const MIN_WALL_NEIGHBORS_RADIUS = 3;
const MIN_WALL_NEIGHBORS_COUNT = 2;

// ─── Helpers ────────────────────────────────────────────────

const isWall = (val: number) => val >= WALL_THRESHOLD;

// ─── Stage 1: Remove Isolated Dots ──────────────────────────
/**
 * Removes stray occupied dots that have no nearby wall neighbors.
 * A dot is "isolated" if within a radius of MIN_WALL_NEIGHBORS_RADIUS
 * there are fewer than MIN_WALL_NEIGHBORS_COUNT other wall cells.
 * This only removes noise dots — never touches real walls.
 */
const removeIsolatedDots = (
	data: number[],
	width: number,
	height: number,
): number[] => {
	const result = [...data];
	const r = MIN_WALL_NEIGHBORS_RADIUS;

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const idx = y * width + x;
			if (!isWall(data[idx])) continue;

			// Count wall neighbors in the radius
			let wallCount = 0;
			for (let dy = -r; dy <= r && wallCount < MIN_WALL_NEIGHBORS_COUNT; dy++) {
				for (let dx = -r; dx <= r && wallCount < MIN_WALL_NEIGHBORS_COUNT; dx++) {
					if (dx === 0 && dy === 0) continue;
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
					if (isWall(data[ny * width + nx])) {
						wallCount++;
					}
				}
			}

			// Not enough neighbors — this is noise
			if (wallCount < MIN_WALL_NEIGHBORS_COUNT) {
				result[idx] = FREE;
			}
		}
	}

	return result;
};

// ─── Stage 2: Wall Thickening (Dilation) ────────────────────
/**
 * Expands every wall cell into its 3×3 neighborhood.
 * This makes thin 1px walls into solid 3px walls and
 * automatically bridges 1-pixel gaps between wall segments.
 * Only expands into free space — never overwrites unknown cells.
 */
const thickenWalls = (
	data: number[],
	width: number,
	height: number,
): number[] => {
	const result = [...data];

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (!isWall(data[y * width + x])) continue;

			// Expand into 3×3 neighborhood
			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					const nx = x + dx;
					const ny = y + dy;
					if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

					const nIdx = ny * width + nx;
					// Only expand into free space, don't overwrite unknown
					if (result[nIdx] === FREE || (result[nIdx] > FREE && !isWall(result[nIdx]))) {
						result[nIdx] = OCCUPIED;
					}
				}
			}
		}
	}

	return result;
};

// ─── Stage 3: Directional Gap Bridging ──────────────────────
/**
 * Scans horizontally and vertically from each wall cell.
 * If another wall cell is found within MAX_GAP_BRIDGE cells,
 * fills the gap with wall cells. This connects broken wall
 * segments that clearly should be continuous.
 * Only bridges through free space — never through unknown regions.
 */
const bridgeWallGaps = (
	data: number[],
	width: number,
	height: number,
): number[] => {
	const result = [...data];

	// Directions: right, down (we only need 2 directions since
	// scanning goes left-to-right, top-to-bottom)
	const directions: [number, number][] = [
		[1, 0], // horizontal
		[0, 1], // vertical
	];

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (!isWall(data[y * width + x])) continue;

			for (const [ddx, ddy] of directions) {
				// Scan forward up to MAX_GAP_BRIDGE cells
				let gapLength = 0;
				let allFree = true;

				for (let step = 1; step <= MAX_GAP_BRIDGE; step++) {
					const nx = x + ddx * step;
					const ny = y + ddy * step;
					if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
						allFree = false;
						break;
					}

					const val = data[ny * width + nx];

					if (isWall(val)) {
						// Found another wall — bridge the gap if it was all free space
						if (allFree && gapLength > 0) {
							for (let fill = 1; fill <= gapLength; fill++) {
								const fx = x + ddx * fill;
								const fy = y + ddy * fill;
								result[fy * width + fx] = OCCUPIED;
							}
						}
						break;
					} else if (val === UNKNOWN) {
						// Unknown cell in the way — don't bridge through unknown
						allFree = false;
						break;
					} else {
						gapLength = step;
					}
				}
			}
		}
	}

	return result;
};

// ─── Exported Pipeline Functions ────────────────────────────

/**
 * Full wall completion pipeline for static/settled maps.
 * Runs: Isolated dot removal → Gap bridging → Wall thickening
 * 
 * Order matters:
 * 1. Remove noise dots first (so they don't get thickened)
 * 2. Bridge gaps (so thin walls connect before thickening)
 * 3. Thicken walls last (makes everything solid)
 */
export const refineMapHeavy = (map: OccupancyGrid): OccupancyGrid => {
	const { width, height } = map.info;
	let data = map.data;

	console.time("[MapFilter] Wall completion");

	data = removeIsolatedDots(data, width, height);
	data = bridgeWallGaps(data, width, height);
	data = thickenWalls(data, width, height);

	console.timeEnd("[MapFilter] Wall completion");

	return {
		header: map.header,
		info: map.info,
		data,
	};
};

/**
 * Lightweight pipeline for maps being actively updated (SLAM).
 * Only removes noise dots — fast and safe during mapping.
 */
export const refineMapLight = (map: OccupancyGrid): OccupancyGrid => {
	const { width, height } = map.info;
	let data = map.data;

	data = removeIsolatedDots(data, width, height);

	return {
		header: map.header,
		info: map.info,
		data,
	};
};
