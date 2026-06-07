import * as ROSLIB from "roslib";
import type { RoomAction } from "../../map/types";
import { RosService } from "../../../shared/lib/RosService";
import type { ISmartHomeService } from "./ISmartHomeService";

interface SmartHomeControl {
	target: string;
	action: string;
	value?: number;
}

export class NativeSmartHomeService implements ISmartHomeService {
	private static instance: NativeSmartHomeService | null = null;
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

	public static getInstance(): NativeSmartHomeService {
		if (!this.instance) this.instance = new NativeSmartHomeService();
		return this.instance;
	}

	public publishControl(control: SmartHomeControl) {
		this.commandTopic.publish({
			data: JSON.stringify({ controls: [control] }),
		});
	}

	public executeAction(action: RoomAction, value?: boolean | number) {
		if (action.type === "toggle") {
			this.publishControl({
				target: action.deviceId,
				action: value ? "turn_on" : "turn_off",
			});
			return;
		}

		this.publishControl({
			target: action.deviceId,
			action: action.command,
			value: typeof value === "number" ? value : undefined,
		});
	}
}
