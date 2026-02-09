import * as ROSLIB from "roslib";
import type { IMapService } from "./IMapService";
import type { OccupancyGrid, RobotPose } from "../types";

export class RosMapService implements IMapService {
	private ros: ROSLIB.Ros;
	private mapTopic: ROSLIB.Topic<any>;
	private poseTopic: ROSLIB.Topic<any>;
	private goalTopic: ROSLIB.Topic<any>;
	private lastStamp: { sec: number; nanosec: number } | null = null;

	private robotUrl = "ws://localhost:9090";

	constructor() {
		this.ros = new ROSLIB.Ros({ url: this.robotUrl });

		this.ros.on("connection", () => {
			console.log("✅ Connected to websocket");
		});
		this.ros.on("error", (error) => console.error("❌ Error: ", error));

		this.mapTopic = new ROSLIB.Topic({
			ros: this.ros,
			name: "/map",
			messageType: "nav_msgs/OccupancyGrid",
			compression: "png",
		});

		this.poseTopic = new ROSLIB.Topic({
			ros: this.ros,
			name: "/robot_pose",
			messageType: "geometry_msgs/PoseStamped",
		});

		this.goalTopic = new ROSLIB.Topic({
			ros: this.ros,
			name: "/goal_pose",
			messageType: "geometry_msgs/PoseStamped",
		});
	}

	onMapUpdate(callback: (map: OccupancyGrid) => void): void {
		console.log("📡 Subscribing to Map Updates...");

		this.mapTopic.subscribe((message: any) => {
			console.log("🗺️ New Map Update Received!");
			const grid: OccupancyGrid = {
				header: message.header,
				info: message.info,
				data: message.data,
			};

			callback(grid);
		});
	}

	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		console.log("📍 Subscribing to /robot_pose...");

		this.poseTopic.subscribe((message: any) => {
			if (message.header && message.header.stamp) {
				this.lastStamp = message.header.stamp;
			}
			const x = message.pose.position.x;
			const y = message.pose.position.y;

			const q = message.pose.orientation;
			const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
			const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
			const rotation = Math.atan2(siny_cosp, cosy_cosp);
			callback({ x, y, rotation });
		});
	}
	setGoal(x: number, y: number): void {
		console.log(`🎯 Preparing Goal: X=${x}, Y=${y}`);

		const stamp =
			this.lastStamp?.sec !== 0
				? this.lastStamp
				: { sec: Math.floor(Date.now() / 1000), nanosec: 0 };

		const message = {
			header: {
				frame_id: "map",
				stamp: stamp,
			},
			pose: {
				position: { x: x, y: y, z: 0.0 },
				orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
			},
		};

		console.log("📦 Publishing Message Payload:", message);
		this.goalTopic.publish(message as any);
	}
}
