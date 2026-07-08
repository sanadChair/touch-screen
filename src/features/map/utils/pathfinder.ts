import type { OccupancyGrid } from "../types";

/**
 * Plans a path between two coordinates in the world frame using A* search on the OccupancyGrid.
 * It downsamples the map internally to keep execution time extremely fast.
 */
export function planPath(
	grid: OccupancyGrid,
	startWorldX: number,
	startWorldY: number,
	goalWorldX: number,
	goalWorldY: number
): { x: number; y: number }[] | null {
	const resolution = grid.info.resolution;
	const originX = grid.info.origin.position.x;
	const originY = grid.info.origin.position.y;
	const width = grid.info.width;
	const height = grid.info.height;
	const data = grid.data;

	// Downsampling factor (e.g. 8 pixels = 0.4 meters per cell)
	const DOWNSAMPLE = 8;
	const gridW = Math.ceil(width / DOWNSAMPLE);
	const gridH = Math.ceil(height / DOWNSAMPLE);

	const worldToCell = (wx: number, wy: number) => {
		const px = Math.floor((wx - originX) / resolution);
		const py = Math.floor((wy - originY) / resolution);
		return {
			x: Math.min(gridW - 1, Math.max(0, Math.floor(px / DOWNSAMPLE))),
			y: Math.min(gridH - 1, Math.max(0, Math.floor(py / DOWNSAMPLE))),
		};
	};

	const cellToWorld = (cx: number, cy: number) => {
		const px = cx * DOWNSAMPLE + DOWNSAMPLE / 2;
		const py = cy * DOWNSAMPLE + DOWNSAMPLE / 2;
		return {
			x: originX + px * resolution,
			y: originY + py * resolution,
		};
	};

	const startCell = worldToCell(startWorldX, startWorldY);
	const goalCell = worldToCell(goalWorldX, goalWorldY);

	// A cell is blocked if any pixel in the DOWNSAMPLE x DOWNSAMPLE block is a wall (>30) or unknown (-1)
	const isBlocked = new Uint8Array(gridW * gridH);
	for (let gy = 0; gy < gridH; gy++) {
		for (let gx = 0; gx < gridW; gx++) {
			let blocked = false;
			for (let dy = 0; dy < DOWNSAMPLE; dy++) {
				const py = gy * DOWNSAMPLE + dy;
				if (py >= height) break;
				for (let dx = 0; dx < DOWNSAMPLE; dx++) {
					const px = gx * DOWNSAMPLE + dx;
					if (px >= width) break;
					const val = data[py * width + px];
					if (val === -1 || val > 30) {
						blocked = true;
						break;
					}
				}
				if (blocked) break;
			}
			isBlocked[gy * gridW + gx] = blocked ? 1 : 0;
		}
	}

	// Safety: ensure start and goal cells are not marked as blocked
	isBlocked[startCell.y * gridW + startCell.x] = 0;
	isBlocked[goalCell.y * gridW + goalCell.x] = 0;

	// A* Setup
	interface AStarNode {
		x: number;
		y: number;
		g: number;
		h: number;
		f: number;
		parentKey: string | null;
	}

	const openSet: AStarNode[] = [];
	const closedSet = new Set<string>();
	const nodeMap = new Map<string, AStarNode>();

	const startKey = `${startCell.x},${startCell.y}`;
	const startNode: AStarNode = {
		x: startCell.x,
		y: startCell.y,
		g: 0,
		h: Math.hypot(goalCell.x - startCell.x, goalCell.y - startCell.y),
		f: Math.hypot(goalCell.x - startCell.x, goalCell.y - startCell.y),
		parentKey: null,
	};

	openSet.push(startNode);
	nodeMap.set(startKey, startNode);

	const dirs = [
		{ dx: 0, dy: -1, cost: 1 },
		{ dx: 0, dy: 1, cost: 1 },
		{ dx: -1, dy: 0, cost: 1 },
		{ dx: 1, dy: 0, cost: 1 },
		{ dx: -1, dy: -1, cost: 1.414 },
		{ dx: 1, dy: -1, cost: 1.414 },
		{ dx: -1, dy: 1, cost: 1.414 },
		{ dx: 1, dy: 1, cost: 1.414 },
	];

	let found = false;
	let endNode: AStarNode | null = null;
	let iterations = 0;
	const maxIterations = 5000;

	while (openSet.length > 0 && iterations < maxIterations) {
		iterations++;
		let minIdx = 0;
		for (let i = 1; i < openSet.length; i++) {
			if (openSet[i].f < openSet[minIdx].f) {
				minIdx = i;
			}
		}

		const current = openSet.splice(minIdx, 1)[0];
		const currentKey = `${current.x},${current.y}`;
		closedSet.add(currentKey);

		if (current.x === goalCell.x && current.y === goalCell.y) {
			found = true;
			endNode = current;
			break;
		}

		for (const d of dirs) {
			const nx = current.x + d.dx;
			const ny = current.y + d.dy;
			if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
			if (isBlocked[ny * gridW + nx]) continue;

			const neighborKey = `${nx},${ny}`;
			if (closedSet.has(neighborKey)) continue;

			// If diagonal move, check corners to prevent cutting through solid wall vertices
			if (d.dx !== 0 && d.dy !== 0) {
				if (isBlocked[current.y * gridW + nx] || isBlocked[ny * gridW + current.x]) {
					continue;
				}
			}

			const tentativeG = current.g + d.cost;
			let neighborNode = nodeMap.get(neighborKey);

			if (!neighborNode) {
				const h = Math.hypot(goalCell.x - nx, goalCell.y - ny);
				neighborNode = {
					x: nx,
					y: ny,
					g: tentativeG,
					h,
					f: tentativeG + h,
					parentKey: currentKey,
				};
				nodeMap.set(neighborKey, neighborNode);
				openSet.push(neighborNode);
			} else if (tentativeG < neighborNode.g) {
				neighborNode.g = tentativeG;
				neighborNode.f = tentativeG + neighborNode.h;
				neighborNode.parentKey = currentKey;
			}
		}
	}

	if (!found || !endNode) {
		return null; // Path is blocked or unreachable
	}

	// Reconstruct path
	const pathCells: { x: number; y: number }[] = [];
	let curr: AStarNode | null = endNode;
	while (curr) {
		pathCells.push({ x: curr.x, y: curr.y });
		curr = curr.parentKey ? nodeMap.get(curr.parentKey) || null : null;
	}
	pathCells.reverse();

	// Convert cell path to world coordinates
	const worldPath = pathCells.map((c) => cellToWorld(c.x, c.y));

	// Keep the exact start and goal points for precision
	if (worldPath.length > 0) {
		worldPath[0] = { x: startWorldX, y: startWorldY };
		worldPath[worldPath.length - 1] = { x: goalWorldX, y: goalWorldY };
	}

	return worldPath;
}
