import * as ROSLIB from "roslib";
import type { IMapService } from "./IMapService";
import type { OccupancyGrid, RobotPose } from "../types";

export class RosMapService implements IMapService {
	private ros: ROSLIB.Ros;
	private mapTopic: ROSLIB.Topic<any>;
	// ✅ هنستخدم Topic عادي جداً بدل TFClient المعقد
	private poseTopic: ROSLIB.Topic<any>;

	private robotUrl = "ws://localhost:9090";

	constructor() {
		this.ros = new ROSLIB.Ros({ url: this.robotUrl });

		this.ros.on("connection", () =>
			console.log("✅ Connected to websocket"),
		);
		this.ros.on("error", (error) => console.error("❌ Error: ", error));

		this.mapTopic = new ROSLIB.Topic({
			ros: this.ros,
			name: "/map",
			messageType: "nav_msgs/OccupancyGrid",
		});

		// 1. الاشتراك في التوبيك الجديد اللي عملناه بالبايثون
		this.poseTopic = new ROSLIB.Topic({
			ros: this.ros,
			name: "/robot_pose", // نفس الاسم اللي في سكريبت البايثون
			messageType: "geometry_msgs/PoseStamped", // نوع الرسالة القياسي
		});
	}

	async fetchMap(): Promise<OccupancyGrid> {
		console.log("📡 Waiting for map from ROS...");
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => reject("Timeout"), 5000);
			this.mapTopic.subscribe((message: any) => {
				console.log("🗺️ Map received!");
				this.mapTopic.unsubscribe();
				clearTimeout(timeout);
				const grid: OccupancyGrid = {
					header: message.header,
					info: message.info,
					data: message.data,
				};
				resolve(grid);
			});
		});
	}

	onRobotPoseUpdate(callback: (pose: RobotPose) => void): void {
		console.log("📍 Subscribing to /robot_pose...");

		this.poseTopic.subscribe((message: any) => {
			// البيانات بتيجي مباشرة وسهلة جداً
			const x = message.pose.position.x;
			const y = message.pose.position.y;

			// حساب الزاوية من Quaternion
			const q = message.pose.orientation;
			const siny_cosp = 2 * (q.w * q.z + q.x * q.y);
			const cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
			const rotation = Math.atan2(siny_cosp, cosy_cosp);

			// لو عايز تشوف الأرقام لايف
			// console.log(`🤖 Pose: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);

			callback({ x, y, rotation });
		});
	}
}
