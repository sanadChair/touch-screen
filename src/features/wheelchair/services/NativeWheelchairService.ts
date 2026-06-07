import * as ROSLIB from "roslib";
import { RosService } from "../../../shared/lib/RosService";
import type { IWheelchairService } from "./IWheelchairService";

export class NativeWheelchairService implements IWheelchairService {
	private static instance: NativeWheelchairService | null = null;
	private ros: ROSLIB.Ros;
	private cmdVelTopic: ROSLIB.Topic<any>;
	private currentVelocity = { linear: 0, angular: 0 };

	private constructor() {
		this.ros = RosService.getInstance().getRos();
		this.cmdVelTopic = new ROSLIB.Topic({
			ros: this.ros,
			name: "/cmd_vel",
			messageType: "geometry_msgs/Twist",
		});
	}

	public static getInstance(): NativeWheelchairService {
		if (!this.instance) {
			this.instance = new NativeWheelchairService();
		}
		return this.instance;
	}

	public updateVelocity(linear: number, angular: number): void {
		this.currentVelocity = { linear, angular };
		const twist = {
			linear: { x: linear, y: 0.0, z: 0.0 },
			angular: { x: 0.0, y: 0.0, z: angular },
		};
		this.cmdVelTopic.publish(twist);
	}

	public getVelocity(): { linear: number; angular: number } {
		return this.currentVelocity;
	}
}
