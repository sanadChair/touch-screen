import type { IMapService } from "./IMapService";
import type { GoalPoint, NavigationState, OccupancyGrid, RobotPose, NavigationStatus } from "../types";

export class ServerMapService implements IMapService {
	private serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5051/api/v1";
	private mapInterval: number | undefined;
	private poseInterval: number | undefined;
	private navigationState: NavigationState = {
		status: "idle",
		activeGoal: null,
		lastFeedback: null,
		pathHistory: [],
	};

	onMapUpdate(callback: (map: OccupancyGrid) => void): void {
		const fetchMap = async () => {
			try {
				const response = await fetch(`${this.serverUrl}/map`);
				const result = await response.json();
				if (result.status !== "success" || !result.data) return;
				const serverMap = result.data;
				callback({
					header: { frame_id: serverMap.frame || "map", stamp: { sec: 0, nanosec: 0 } },
					info: {
						resolution: serverMap.resolution,
						width: serverMap.width,
						height: serverMap.height,
						origin: {
							position: { x: serverMap.origin?.x || 0, y: serverMap.origin?.y || 0, z: 0 },
							orientation: { x: 0, y: 0, z: 0, w: 1 },
						},
					},
					data: serverMap.map,
				});
			} catch (error) {
				console.error("Error fetching map:", error);
			}
		};

		fetchMap();
		this.mapInterval = setInterval(fetchMap, 5000) as unknown as number;
	}

	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		const fetchPose = async () => {
			try {
				const response = await fetch(`${this.serverUrl}/pose`);
				const result = await response.json();
				if (result.status !== "success" || !result.data) return;
				callback({
					x: result.data.x,
					y: result.data.y,
					rotation: result.data.yaw,
				});
			} catch (error) {
				console.error("Error fetching pose:", error);
			}
		};

		fetchPose();
		this.poseInterval = setInterval(fetchPose, 2000) as unknown as number;
	}

	private goalInterval: number | undefined;
	private navigationListeners = new Set<(state: NavigationState) => void>();

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

		fetch(`${this.serverUrl}/goal`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ x, y, yaw: 0 }),
		})
			.then(() => {
				this.startGoalPolling();
			})
			.catch((error) => {
				console.error("Error sending goal:", error);
				this.navigationState = {
					...this.navigationState,
					status: "failed",
				};
				this.emitNavigation();
			});
	}

	setExternalNavigationGoal(goal: GoalPoint | null): void {
		this.navigationState = {
			...this.navigationState,
			status: goal ? "goal_sent" : "idle",
			activeGoal: goal,
			pathHistory: [],
		};
		this.emitNavigation();
		if (goal) {
			this.startGoalPolling();
		} else {
			this.stopGoalPolling();
		}
	}

	dispose(): void {
		if (this.mapInterval) clearInterval(this.mapInterval);
		if (this.poseInterval) clearInterval(this.poseInterval);
		this.stopGoalPolling();
	}

	private emitNavigation() {
		for (const listener of this.navigationListeners) {
			listener(this.navigationState);
		}
	}

	private startGoalPolling() {
		if (this.goalInterval) clearInterval(this.goalInterval);

		const pollGoal = async () => {
			try {
				const response = await fetch(`${this.serverUrl}/goal`);
				if (response.status === 404) {
					this.navigationState = {
						...this.navigationState,
						status: "idle",
						activeGoal: null,
						lastFeedback: null,
					};
					this.emitNavigation();
					this.stopGoalPolling();
					return;
				}

				const result = await response.json();
				if (result.status !== "success" || !result.data) return;

				const { goal, status, feedback } = result.data;
				
				let navStatus: NavigationStatus = "navigating";
				let shouldStopPoll = false;

				switch (status?.status) {
					case "ACCEPTED":
						navStatus = "goal_sent";
						break;
					case "EXECUTING":
						navStatus = "navigating";
						break;
					case "SUCCEEDED":
						navStatus = "succeeded";
						shouldStopPoll = true;
						break;
					case "CANCELED":
					case "CANCELING":
						navStatus = "canceled";
						shouldStopPoll = true;
						break;
					case "ABORTED":
						navStatus = "failed";
						shouldStopPoll = true;
						break;
					default:
						navStatus = "idle";
						shouldStopPoll = true;
				}

				this.navigationState = {
					...this.navigationState,
					status: navStatus,
					activeGoal: shouldStopPoll ? null : { x: goal?.x ?? 0, y: goal?.y ?? 0 },
					lastFeedback: feedback ? {
						distanceRemaining: feedback.distance_remaining,
						estimatedTimeRemainingSec: feedback.estimated_time_remaining?.sec,
						navigationTimeSec: feedback.navigation_time?.sec,
						numberOfRecoveries: feedback.number_of_recoveries,
					} : null,
				};
				this.emitNavigation();

				if (shouldStopPoll) {
					this.stopGoalPolling();
				}
			} catch (error) {
				console.error("Error polling goal:", error);
			}
		};

		this.goalInterval = setInterval(pollGoal, 2000) as unknown as number;
	}

	private stopGoalPolling() {
		if (this.goalInterval) {
			clearInterval(this.goalInterval);
			this.goalInterval = undefined;
		}
	}
}
