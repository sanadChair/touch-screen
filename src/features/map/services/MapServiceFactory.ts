import { NativeMapService } from "./NativeMapService";
import { ServerMapService } from "./ServerMapService";
import { MockMapService } from "./MockMapService";
import type { IMapService } from "./IMapService";
import { getServerHealth, subscribeServerHealth } from "../../../shared/hooks/useServerHealth";
import type { GoalPoint, NavigationState, OccupancyGrid, RobotPose } from "../types";
import { getConnectionType } from "../../../shared/lib/config";

class FallbackMapService implements IMapService {
	private serverService = new ServerMapService();
	private mockService = new MockMapService();
	private nativeService = new NativeMapService();

	private mapCallbacks = new Set<(map: OccupancyGrid) => void>();
	private poseCallbacks = new Set<(pose: RobotPose) => void>();
	private navigationCallbacks = new Set<(state: NavigationState) => void>();

	private lastMap = new Map<IMapService, OccupancyGrid>();
	private lastPose = new Map<IMapService, RobotPose>();
	private lastNavState = new Map<IMapService, NavigationState>();

	private currentActiveService: IMapService;
	private unsubscribeHealth?: () => void;
	private checkInterval?: number;

	constructor() {
		this.currentActiveService = this.activeService;

		// Subscribe to server health changes to handle online/offline toggling reactively
		this.unsubscribeHealth = subscribeServerHealth(() => {
			this.handleServiceChange();
		});

		// Fallback check in case the connection type is dynamically changed in local settings
		this.checkInterval = setInterval(() => {
			this.handleServiceChange();
		}, 1000) as unknown as number;

		// Initialize inner service listeners
		this.serverService.onMapUpdate((map) => {
			this.lastMap.set(this.serverService, map);
			if (this.activeService === this.serverService) {
				this.emitMap(map);
			}
		});
		this.mockService.onMapUpdate((map) => {
			this.lastMap.set(this.mockService, map);
			if (this.activeService === this.mockService) {
				this.emitMap(map);
			}
		});
		this.nativeService.onMapUpdate((map) => {
			this.lastMap.set(this.nativeService, map);
			if (this.activeService === this.nativeService) {
				this.emitMap(map);
			}
		});

		this.serverService.onRobotPoseUpdate((pose) => {
			this.lastPose.set(this.serverService, pose);
			if (this.activeService === this.serverService) {
				this.emitPose(pose);
			}
		});
		this.mockService.onRobotPoseUpdate((pose) => {
			this.lastPose.set(this.mockService, pose);
			if (this.activeService === this.mockService) {
				this.emitPose(pose);
			}
		});
		this.nativeService.onRobotPoseUpdate((pose) => {
			this.lastPose.set(this.nativeService, pose);
			if (this.activeService === this.nativeService) {
				this.emitPose(pose);
			}
		});

		this.serverService.onNavigationStateUpdate((state) => {
			this.lastNavState.set(this.serverService, state);
			if (this.activeService === this.serverService) {
				this.emitNavigation(state);
			}
		});
		this.mockService.onNavigationStateUpdate((state) => {
			this.lastNavState.set(this.mockService, state);
			if (this.activeService === this.mockService) {
				this.emitNavigation(state);
			}
		});
		this.nativeService.onNavigationStateUpdate((state) => {
			this.lastNavState.set(this.nativeService, state);
			if (this.activeService === this.nativeService) {
				this.emitNavigation(state);
			}
		});
	}

	private get activeService(): IMapService {
		const type = getConnectionType();
		if (type === "MOCK" || getServerHealth() === "offline") {
			return this.mockService;
		}
		if (type === "SERVER") {
			return this.serverService;
		}
		return this.nativeService;
	}

	private handleServiceChange() {
		const nextService = this.activeService;
		if (nextService !== this.currentActiveService) {
			this.currentActiveService = nextService;

			const map = this.lastMap.get(nextService);
			if (map) this.emitMap(map);

			const pose = this.lastPose.get(nextService);
			if (pose) this.emitPose(pose);

			const state = this.lastNavState.get(nextService);
			if (state) this.emitNavigation(state);
		}
	}

	public onMapUpdate(callback: (map: OccupancyGrid) => void): void {
		this.mapCallbacks.add(callback);
		const currentMap = this.lastMap.get(this.activeService);
		if (currentMap) callback(currentMap);
	}

	public onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		this.poseCallbacks.add(callback);
		const currentPose = this.lastPose.get(this.activeService);
		if (currentPose) callback(currentPose);
	}

	public onNavigationStateUpdate(callback: (state: NavigationState) => void): void {
		this.navigationCallbacks.add(callback);
		const currentNav = this.lastNavState.get(this.activeService);
		if (currentNav) callback(currentNav);
	}

	private emitMap(map: OccupancyGrid) {
		for (const cb of this.mapCallbacks) cb(map);
	}

	private emitPose(pose: RobotPose) {
		for (const cb of this.poseCallbacks) cb(pose);
	}

	private emitNavigation(state: NavigationState) {
		for (const cb of this.navigationCallbacks) cb(state);
	}

	public setGoal(x: number, y: number, label?: string): void {
		this.activeService.setGoal(x, y, label);
	}

	public cancelGoal(): void {
		this.activeService.cancelGoal();
	}

	public setExternalNavigationGoal(goal: GoalPoint | null): void {
		this.activeService.setExternalNavigationGoal?.(goal);
	}

	public dispose(): void {
		if (this.unsubscribeHealth) this.unsubscribeHealth();
		if (this.checkInterval) clearInterval(this.checkInterval);
		this.serverService.dispose();
		this.mockService.dispose();
		this.nativeService.dispose();
		this.mapCallbacks.clear();
		this.poseCallbacks.clear();
		this.navigationCallbacks.clear();
	}
}

export class MapServiceFactory {
	private static instance: IMapService | null = null;

	static getService(): IMapService {
		if (!this.instance) {
			this.instance = new FallbackMapService();
		}
		return this.instance;
	}
}
