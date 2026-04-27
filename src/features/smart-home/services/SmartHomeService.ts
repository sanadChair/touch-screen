import * as ROSLIB from "roslib";
import { RosService } from "../../../shared/lib/RosService";

export class SmartHomeService {
	private static instance: SmartHomeService | null = null;
	private ros: ROSLIB.Ros;
	private commandTopic: ROSLIB.Topic<any>;

	private constructor() {
		this.ros = RosService.getInstance().getRos();

		this.commandTopic = new ROSLIB.Topic({
			ros: this.ros,
			name: "/robot/smarthome_command",
			messageType: "std_msgs/String",
		});
	}

	public static getInstance(): SmartHomeService {
		if (!this.instance) {
			this.instance = new SmartHomeService();
		}
		return this.instance;
	}

	public sendCommand(target: string, action: string) {
		const message = {
			data: JSON.stringify({
				controls: [
					{
						target,
						action,
					},
				],
			}),
		};

		console.log(`📤 Sending Smart Home Command: ${target} -> ${action}`);
		this.commandTopic.publish(message);
	}
}
