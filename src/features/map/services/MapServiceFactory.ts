import { NativeMapService } from "./NativeMapService";
import { ServerMapService } from "./ServerMapService";
import { MockMapService } from "./MockMapService";
import type { IMapService } from "./IMapService";
import { getServerHealth } from "../../../shared/hooks/useServerHealth";
import type { GoalPoint, NavigationState, OccupancyGrid, RobotPose } from "../types";
import { getConnectionType } from "../../../shared/lib/config";

class FallbackMapService implements IMapService {
	private serverService = new ServerMapService();
	private mockService = new MockMapService();
	private nativeService = new NativeMapService();

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

	public onMapUpdate(callback: (map: OccupancyGrid) => void): void {
		this.serverService.onMapUpdate((map) => {
			if (this.activeService === this.serverService) callback(map);
		});
		this.mockService.onMapUpdate((map) => {
			if (this.activeService === this.mockService) callback(map);
		});
		this.nativeService.onMapUpdate((map) => {
			if (this.activeService === this.nativeService) callback(map);
		});
	}

	public onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		this.serverService.onRobotPoseUpdate((pose) => {
			if (this.activeService === this.serverService) callback(pose);
		});
		this.mockService.onRobotPoseUpdate((pose) => {
			if (this.activeService === this.mockService) callback(pose);
		});
		this.nativeService.onRobotPoseUpdate((pose) => {
			if (this.activeService === this.nativeService) callback(pose);
		});
	}

	public onNavigationStateUpdate(callback: (state: NavigationState) => void): void {
		this.serverService.onNavigationStateUpdate((state) => {
			if (this.activeService === this.serverService) callback(state);
		});
		this.mockService.onNavigationStateUpdate((state) => {
			if (this.activeService === this.mockService) callback(state);
		});
		this.nativeService.onNavigationStateUpdate((state) => {
			if (this.activeService === this.nativeService) callback(state);
		});
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
		this.serverService.dispose();
		this.mockService.dispose();
		this.nativeService.dispose();
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
