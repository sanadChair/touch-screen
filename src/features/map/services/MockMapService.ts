import type { IMapService } from "./IMapService";
import { MOCK_OCCUPANCY_GRID } from "../mocks/mockMap";
import type { NavigationState, OccupancyGrid, RobotPose, GoalPoint, PathPoint } from "../types";
import { planPath } from "../utils/pathfinder";

function getPointOnPath(path: { x: number; y: number }[], progress: number): { x: number; y: number } {
	if (path.length === 0) return { x: 0, y: 0 };
	if (path.length === 1) return path[0];
	if (progress <= 0) return path[0];
	if (progress >= 1) return path[path.length - 1];

	let totalLength = 0;
	const segmentLengths = [];
	for (let i = 0; i < path.length - 1; i++) {
		const len = Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
		segmentLengths.push(len);
		totalLength += len;
	}

	if (totalLength === 0) return path[0];

	const targetDist = progress * totalLength;
	let accumulated = 0;

	for (let i = 0; i < path.length - 1; i++) {
		const len = segmentLengths[i];
		if (accumulated + len >= targetDist) {
			const segProgress = (targetDist - accumulated) / len;
			const start = path[i];
			const end = path[i + 1];
			return {
				x: start.x + (end.x - start.x) * segProgress,
				y: start.y + (end.y - start.y) * segProgress,
			};
		}
		accumulated += len;
	}

	return path[path.length - 1];
}

export class MockMapService implements IMapService {
	private navigationState: NavigationState = {
		status: "idle",
		activeGoal: null,
		lastFeedback: null,
		pathHistory: [],
	};
	private navigationListeners = new Set<(state: NavigationState) => void>();
	private robotPoseListeners = new Set<(pose: RobotPose) => void>();
	private currentPose: RobotPose = { x: 10.0, y: 10.0, rotation: 0 };
	private interval: number | undefined;

	onMapUpdate(callback: (map: OccupancyGrid) => void): void {
		callback(MOCK_OCCUPANCY_GRID as OccupancyGrid);
	}

	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		this.robotPoseListeners.add(callback);
		callback(this.currentPose);
	}

	onNavigationStateUpdate(callback: (state: NavigationState) => void): void {
		this.navigationListeners.add(callback);
		callback(this.navigationState);
	}

	setGoal(x: number, y: number, label?: string): void {
		if (this.interval) clearInterval(this.interval);
		let steps = 0;
		const targetX = x;
		const targetY = y;
		const startX = this.currentPose.x;
		const startY = this.currentPose.y;
		const startRotation = this.currentPose.rotation;

		// Calculate A* path on occupancy grid
		let path = planPath(MOCK_OCCUPANCY_GRID as OccupancyGrid, startX, startY, targetX, targetY);

		if (!path) {
			console.warn("MockMapService: A* path planning failed or path is blocked. Falling back to straight line.");
			path = [{ x: startX, y: startY }, { x: targetX, y: targetY }];
		}

		const pathHistory: PathPoint[] = [
			{ x: startX, y: startY, rotation: startRotation, timestamp: Date.now() },
		];

		const totalSteps = 20; // Increase resolution of path steps
		const updateIntervalMs = 500; // updates every 500ms for smoother animation

		this.navigationState = {
			...this.navigationState,
			status: "goal_sent",
			activeGoal: { x, y, label },
			lastFeedback: null,
			pathHistory: [...pathHistory],
		};
		this.emitNavigation();

		this.interval = setInterval(() => {
			steps++;
			const progress = steps / totalSteps;
			if (progress >= 1) {
				clearInterval(this.interval);
				const finalPoint = path[path.length - 1];
				// Align final orientation towards the path's last segment direction
				let finalRotation = 0;
				if (path.length >= 2) {
					const p1 = path[path.length - 2];
					finalRotation = Math.atan2(finalPoint.y - p1.y, finalPoint.x - p1.x);
				}
				this.currentPose = { x: finalPoint.x, y: finalPoint.y, rotation: finalRotation };
				pathHistory.push({
					x: finalPoint.x,
					y: finalPoint.y,
					rotation: finalRotation,
					timestamp: Date.now(),
				});
				this.navigationState = {
					...this.navigationState,
					status: "succeeded",
					activeGoal: null,
					lastFeedback: null,
					pathHistory: [...pathHistory],
				};
			} else {
				const currentPoint = getPointOnPath(path, progress);
				const nextPoint = getPointOnPath(path, Math.min(1.0, progress + 0.02));
				
				let nextRotation = this.currentPose.rotation;
				if (Math.hypot(nextPoint.x - currentPoint.x, nextPoint.y - currentPoint.y) > 0.01) {
					nextRotation = Math.atan2(nextPoint.y - currentPoint.y, nextPoint.x - currentPoint.x);
				}

				this.currentPose = {
					x: currentPoint.x,
					y: currentPoint.y,
					rotation: nextRotation,
				};
				pathHistory.push({
					x: this.currentPose.x,
					y: this.currentPose.y,
					rotation: nextRotation,
					timestamp: Date.now(),
				});
				this.navigationState = {
					...this.navigationState,
					status: "navigating",
					pathHistory: [...pathHistory],
					lastFeedback: {
						currentPose: { ...this.currentPose },
						distanceRemaining: Math.hypot(targetX - this.currentPose.x, targetY - this.currentPose.y),
						estimatedTimeRemainingSec: Math.ceil(((totalSteps - steps) * updateIntervalMs) / 1000),
						navigationTimeSec: Math.ceil((steps * updateIntervalMs) / 1000),
						numberOfRecoveries: 0,
					},
				};
			}
			this.emitPose();
			this.emitNavigation();
		}, updateIntervalMs) as unknown as number;
	}

	cancelGoal(): void {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = undefined;
		}
		this.navigationState = {
			...this.navigationState,
			status: "canceled",
			activeGoal: null,
			lastFeedback: null,
		};
		this.emitNavigation();
	}

	setExternalNavigationGoal(goal: GoalPoint | null): void {
		if (goal) {
			this.setGoal(goal.x, goal.y, goal.label);
		} else {
			this.cancelGoal();
		}
	}

	dispose(): void {
		if (this.interval) clearInterval(this.interval);
	}

	private emitNavigation() {
		for (const listener of this.navigationListeners) {
			listener(this.navigationState);
		}
	}

	private emitPose() {
		for (const listener of this.robotPoseListeners) {
			listener(this.currentPose);
		}
	}
}
