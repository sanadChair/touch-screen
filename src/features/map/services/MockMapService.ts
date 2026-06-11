import type { IMapService } from "./IMapService";
import { MOCK_OCCUPANCY_GRID } from "../mocks/mockMap";
import type { NavigationState, OccupancyGrid, RobotPose, GoalPoint } from "../types";

export class MockMapService implements IMapService {
	private navigationState: NavigationState = {
		status: "idle",
		activeGoal: null,
		lastFeedback: null,
		pathHistory: [],
	};
	private navigationListeners = new Set<(state: NavigationState) => void>();
	private robotPoseListeners = new Set<(pose: RobotPose) => void>();
	private currentPose: RobotPose = { x: 0, y: 0, rotation: 0 };
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
		this.navigationState = {
			...this.navigationState,
			status: "goal_sent",
			activeGoal: { x, y, label },
			lastFeedback: null,
		};
		this.emitNavigation();

		// Simulate navigation progress
		if (this.interval) clearInterval(this.interval);
		let steps = 0;
		const targetX = x;
		const targetY = y;
		const startX = this.currentPose.x;
		const startY = this.currentPose.y;

		this.interval = setInterval(() => {
			steps++;
			const progress = steps / 10;
			if (progress >= 1) {
				clearInterval(this.interval);
				this.currentPose = { x: targetX, y: targetY, rotation: 0 };
				this.navigationState = {
					...this.navigationState,
					status: "succeeded",
					activeGoal: null,
					lastFeedback: null,
				};
			} else {
				this.currentPose = {
					x: startX + (targetX - startX) * progress,
					y: startY + (targetY - startY) * progress,
					rotation: Math.atan2(targetY - startY, targetX - startX),
				};
				this.navigationState = {
					...this.navigationState,
					status: "navigating",
					lastFeedback: {
						distanceRemaining: Math.hypot(targetX - this.currentPose.x, targetY - this.currentPose.y),
						estimatedTimeRemainingSec: 10 - steps,
						navigationTimeSec: steps,
						numberOfRecoveries: 0,
					},
				};
			}
			this.emitPose();
			this.emitNavigation();
		}, 1000) as unknown as number;
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
