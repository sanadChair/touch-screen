import * as ROSLIB from "roslib";
import type { IMapService } from "./IMapService";
import type {
	GoalPoint,
	NavigationFeedback,
	NavigationState,
	OccupancyGrid,
	PathPoint,
	RobotPose,
} from "../types";
import { RosService } from "../../../shared/lib/RosService";

const MAX_PATH_POINTS = 240;
const GOAL_REACHED_THRESHOLD_METERS = 0.2;

export class NativeMapService implements IMapService {
	private ros: ROSLIB.Ros;
	private mapTopic: ROSLIB.Topic<any>;
	private poseTopic: ROSLIB.Topic<any>;
	private navigationActionClient: any;
	private lastStamp: { sec: number; nanosec: number } | null = null;
	private mapListeners = new Set<(map: OccupancyGrid) => void>();
	private poseListeners = new Set<(pose: RobotPose) => void>();
	private navigationListeners = new Set<(state: NavigationState) => void>();
	private navigationState: NavigationState = {
		status: "idle",
		activeGoal: null,
		lastFeedback: null,
		pathHistory: [],
	};
	private latestPose: RobotPose | null = null;

	constructor() {
		const rosService = RosService.getInstance();
		this.ros = rosService.getRos();
		console.info(`NativeMapService: using shared ROS connection at ${rosService.getUrl()}`);

		this.mapTopic = new ROSLIB.Topic({
			ros: this.ros,
			name: "/map",
			messageType: "nav_msgs/OccupancyGrid",
			compression: "png",
		});

		this.poseTopic = new ROSLIB.Topic({
			ros: this.ros,
			name: "/amcl_pose",
			messageType: "geometry_msgs/msg/PoseWithCovarianceStamped",
		});

		const RoslibWithAction = ROSLIB as unknown as {
			Action: new (options: {
				ros: ROSLIB.Ros;
				name: string;
				actionType: string;
			}) => {
				sendGoal: (
					goal: unknown,
					resultCallback: (result: any) => void,
					feedbackCallback?: (feedback: any) => void,
					failedCallback?: (error: string) => void,
				) => string;
				cancelGoal?: (id: string) => void;
			};
		};

		this.navigationActionClient = new RoslibWithAction.Action({
			ros: this.ros,
			name: "/navigate_to_pose",
			actionType: "nav2_msgs/action/NavigateToPose",
		});

		this.mapTopic.subscribe((message: any) => {
			this.emitMap({
				header: message.header,
				info: message.info,
				data: message.data,
			});
		});

		this.poseTopic.subscribe((message: any) => {
			if (message.header?.stamp) this.lastStamp = message.header.stamp;
			try {
				const pose = this.toRobotPose(message);
				this.latestPose = pose;
				this.emitPose(pose);
				this.updatePathHistory(pose);
			} catch (error) {
				console.error("NativeMapService: failed to parse robot_pose", error);
			}
		});
	}

	onMapUpdate(callback: (map: OccupancyGrid) => void): void {
		this.mapListeners.add(callback);
	}

	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		this.poseListeners.add(callback);
		if (this.latestPose) callback(this.latestPose);
	}

	onNavigationStateUpdate(callback: (state: NavigationState) => void): void {
		this.navigationListeners.add(callback);
		callback(this.navigationState);
	}

	setGoal(x: number, y: number, label?: string): void {
		const stamp =
			this.lastStamp && this.lastStamp.sec !== 0
				? this.lastStamp
				: { sec: Math.floor(Date.now() / 1000), nanosec: 0 };

		this.navigationState = {
			status: "goal_sent",
			activeGoal: { x, y, label },
			lastFeedback: null,
			pathHistory: this.latestPose ? [this.toPathPoint(this.latestPose)] : [],
		};
		this.emitNavigation();

		this.navigationActionClient.sendGoal(
			{
				pose: {
					header: { frame_id: "map", stamp },
					pose: {
						position: { x, y, z: 0.0 },
						orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
					},
				},
				behavior_tree: "",
			},
			(result: any) => {
				this.navigationState = {
					...this.navigationState,
					status: result?.error_code === 0 ? "succeeded" : "failed",
					activeGoal: null,
				};
				this.emitNavigation();
			},
			(feedback: any) => {
				this.navigationState = {
					...this.navigationState,
					status: "navigating",
					lastFeedback: this.toNavigationFeedback(feedback),
				};
				this.emitNavigation();
			},
			(error: string) => {
				console.error("NativeMapService: navigation failed", error);
				this.navigationState = {
					...this.navigationState,
					status: "failed",
				};
				this.emitNavigation();
			},
		);
	}

	setExternalNavigationGoal(goal: GoalPoint | null): void {
		this.navigationState = {
			...this.navigationState,
			status: goal ? "goal_sent" : "idle",
			activeGoal: goal,
			pathHistory: this.latestPose ? [this.toPathPoint(this.latestPose)] : [],
		};
		this.emitNavigation();
	}

	dispose(): void {
		console.log("NativeMapService disposed");
	}

	private emitMap(map: OccupancyGrid) {
		for (const listener of this.mapListeners) listener(map);
	}

	private emitPose(pose: RobotPose) {
		for (const listener of this.poseListeners) listener(pose);
	}

	private emitNavigation() {
		for (const listener of this.navigationListeners) listener(this.navigationState);
	}

	private updatePathHistory(pose: RobotPose) {
		const pathPoint = this.toPathPoint(pose);
		const trimmedPath = [...this.navigationState.pathHistory, pathPoint].slice(-MAX_PATH_POINTS);
		let status = this.navigationState.status;
		let activeGoal = this.navigationState.activeGoal;

		if (activeGoal) {
			const distance = Math.hypot(activeGoal.x - pose.x, activeGoal.y - pose.y);
			if (distance <= GOAL_REACHED_THRESHOLD_METERS) {
				status = "succeeded";
				activeGoal = null;
			} else if (status === "goal_sent") {
				status = "navigating";
			}
		}

		this.navigationState = {
			...this.navigationState,
			status,
			activeGoal,
			pathHistory: trimmedPath,
		};
		this.emitNavigation();
	}

	private toPathPoint(pose: RobotPose): PathPoint {
		return { ...pose, timestamp: Date.now() };
	}

	private toRobotPose(message: any): RobotPose {
		const x = message.pose.pose.position.x;
		const y = message.pose.pose.position.y;
		const q = message.pose.pose.orientation;
		const sinyCosp = 2 * (q.w * q.z + q.x * q.y);
		const cosyCosp = 1 - 2 * (q.y * q.y + q.z * q.z);
		return { x, y, rotation: Math.atan2(sinyCosp, cosyCosp) };
	}

	private toNavigationFeedback(feedback: any): NavigationFeedback {
		return {
			currentPose: feedback?.current_pose
				? this.toRobotPose({ pose: { pose: feedback.current_pose.pose } })
				: null,
			distanceRemaining: feedback?.distance_remaining,
			estimatedTimeRemainingSec: feedback?.estimated_time_remaining
				? feedback.estimated_time_remaining.sec
				: undefined,
			navigationTimeSec: feedback?.navigation_time?.sec,
			numberOfRecoveries: feedback?.number_of_recoveries,
		};
	}
}
